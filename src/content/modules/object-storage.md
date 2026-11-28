---
slug: object-storage
title: Object storage
section: databases
readFirst:
  - sql-vs-nosql
  - cdn
sources:
  - id: wiki-obj
    title: Wikipedia, Object storage
    url: https://en.wikipedia.org/wiki/Object_storage
    license: CC BY-SA 4.0
    use: reworded
  - id: primer
    title: The System Design Primer, SQL tuning (avoid storing large BLOBs)
    url: https://github.com/donnemartin/system-design-primer#sql-tuning
    license: CC BY 4.0
    use: reworded
  - id: wiki-erasure
    title: Wikipedia, Erasure code
    url: https://en.wikipedia.org/wiki/Erasure_code
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: How is an object addressed in object storage?
    options:
      - By a path in a directory tree on one disk
      - By a key in a flat namespace inside a bucket
      - By a row id in a table
      - By a block number
    correct: 1
    explanation: Slashes in keys look like folders, but the namespace is flat.
  - prompt: How do you change part of a large object?
    options:
      - Seek and overwrite the bytes in place
      - Write a whole new version of the object
      - Append with a SQL UPDATE
      - Lock the object first
    correct: 1
    explanation: Objects are immutable; a PUT replaces the whole object.
  - prompt: Why use a pre-signed URL for uploads?
    options:
      - To encrypt the file
      - So the client uploads straight to object storage with short-lived permission, without the file passing through your servers
      - To make the file public forever
      - To compress the upload
    correct: 1
    explanation: Your API grants permission; the bytes go directly to the storage service.
  - prompt: Where should a 50 MB video live, and where should its metadata live?
    options:
      - Both in the database
      - The video in object storage, its key, owner and size in the database
      - Both in object storage
      - The video in the database, the metadata in object storage
    correct: 1
    explanation: Store the location of large objects, not the bytes, in the database.
  - prompt: In the worked example, users upload 2 million photos a day at an average of 3 MB, with 4 resized versions adding 1 MB in total. About how much new storage is that per month?
    options:
      - About 24 TB
      - About 240 TB
      - About 2.4 TB
      - About 2.4 PB
    correct: 1
    explanation: 2 million × 4 MB = 8 TB a day, × 30 ≈ 240 TB a month.
  - prompt: In the worked example, why does putting a CDN in front of the bucket cut the egress bill so sharply?
    options:
      - CDNs compress images to zero bytes
      - With a 95% hit ratio, only 5% of downloads reach object storage, and CDN delivery is cheaper per GB than direct egress
      - Object storage stops charging when a CDN is used
      - The CDN stores the database too
    correct: 1
    explanation: Most reads are served from edge caches, so origin traffic falls by 20 times.
  - prompt: Photos older than 90 days are almost never viewed. Why move them to an infrequent-access class with a lifecycle rule rather than straight to an archive class?
    options:
      - Archive classes do not exist
      - Old photos still get occasional views, and archive classes add hours of restore delay and retrieval fees, while infrequent-access stays instant
      - Infrequent-access is more durable
      - Lifecycle rules only support one class
    correct: 1
    explanation: Cheaper storage classes trade storage price against retrieval time and cost; pick by how the data is read.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import PresignedUploadFlow from '#lib/diagrams/PresignedUploadFlow.svelte';
</script>

Object storage keeps files as whole objects under a key, in a service that scales to any size and replicates for you. It is where user uploads, media, backups and data-lake files belong, rather than in your database or on your web servers' disks.

## What it is

Here is the problem. Users upload photos to your app. If you save them on the web server's disk, the next request may hit a different server that does not have the file, the disk fills up, and when the server dies the photos die with it. If you store them as `BLOB` columns in the database, a 3 MB photo makes a row thousands of times bigger than normal rows, backups and replicas balloon, and the database's memory, which should be holding hot rows, fills with image bytes. The Primer's advice is to avoid storing large BLOBs and store *where to get the object* instead. <Src id="primer" />

**<Term id="object-storage">Object storage</Term>** is that place. It keeps data as **objects**: the bytes, some metadata (content type, size, custom tags), and a unique **key**. Objects live in a **bucket**, a flat namespace rather than a folder tree. A key like `photos/2026/11/abc.jpg` looks like a path, but the slashes are just characters; the service shows them as folders for convenience. Amazon S3, Google Cloud Storage and Azure Blob Storage are the common services, and MinIO and Ceph provide the same model on your own hardware. <Src id="wiki-obj" />

It differs from the other two kinds of storage you meet:

- **Block storage** (a disk or a cloud volume such as EBS) gives a server raw blocks to put a filesystem on. Fast and editable in place, but attached to one machine at a time.
- **File storage** (NFS, EFS) gives a shared filesystem with directories and in-place edits, shared by a few servers.
- **Object storage** gives an HTTP API to whole objects, reachable from anywhere, with practically unlimited capacity, but no in-place edits and higher latency per request.

## How it works

### The API

You `PUT` an object under a key, `GET` it back by key, `DELETE` it, and `LIST` keys by prefix. There is no in-place edit: to change an object you write a new one under the same key, which replaces it. With **versioning** turned on, the old version is kept and can be restored. <Src id="wiki-obj" />

`GET` supports byte ranges (`Range: bytes=0-1048575`), so a video player can stream part of a file. Large uploads use **<Term id="multipart-upload">multipart upload</Term>**: split the file into parts (for example 100 MB each), upload them in parallel and retry only the parts that fail, then ask the service to stitch them together into one object.

Since December 2020, S3 gives strong read-after-write consistency: once a `PUT` succeeds, every `GET` and `LIST` sees it. Older guides warning about eventual consistency on S3 are out of date. Google Cloud Storage and Azure Blob are also strongly consistent for object reads.

### Durability

Behind the API, the service stores each object redundantly across many disks, racks and, by default, several data centres (availability zones). Some systems keep full copies; most large ones use **<Term id="erasure-coding">erasure coding</Term>**, which splits an object into, say, 10 data fragments plus 4 parity fragments spread over 14 disks. Any 10 fragments can rebuild the object, so it survives losing 4 disks while using 1.4 times the space, against 3 times for three full copies. Background processes check fragments and repair lost ones continuously. That is how S3 is designed for 99.999999999% (eleven nines) durability: store 10 million objects and you would expect to lose one about every 10,000 years. <Src id="wiki-obj" /> <Src id="wiki-erasure" />

Durability is not availability. The same S3 Standard class is designed for 99.99% availability, so requests can briefly fail even though no data is lost, and clients retry.

### The upload flow

Uploads should not stream through your application servers, which would tie up a worker for the whole upload and pay for the bandwidth twice. Instead, the client uploads straight to the bucket with a **<Term id="presigned-url">pre-signed URL</Term>**: a URL that carries a signature granting one specific operation, such as `PUT` to one key, until a short expiry.

1. The client asks your API for permission to upload, sending the file type and size.
2. The API checks the user may upload, picks a key such as `uploads/{user_id}/{uuid}.jpg`, and returns a pre-signed `PUT` URL valid for about 15 minutes.
3. The client uploads the file directly to object storage.
4. The client, or an event from the bucket, tells the API the upload finished; the API saves the key, owner and size in the database.
5. Reads go through a [CDN](/modules/cdn), with the bucket as the <Term id="origin-server">origin</Term>.

<PresignedUploadFlow />

The bucket can send an event on each new object (S3 Event Notifications to a queue or a function), which is the usual way to start processing such as resizing images or transcoding video, in a [message queue](/modules/queues-and-back-pressure) worker.

### Storage classes and lifecycle

Not all data is read equally, so services offer **<Term id="storage-class">storage classes</Term>** that trade price per GB against retrieval time and fees. On S3, roughly: Standard (instant, about $0.023 per GB-month in us-east-1), Standard-IA, the infrequent-access class (instant, about half the storage price, plus a per-GB retrieval fee and a 30-day minimum), and the Glacier classes (from milliseconds to 12 hours to retrieve, down to about $0.001 per GB-month for Deep Archive). **Lifecycle rules** move objects between classes or delete them by age automatically, for example "after 90 days move to IA, after a year delete".

## Worked example

A photo-sharing app gets **2 million uploads a day**, averaging **3 MB** each. Each photo also gets 4 resized versions, which add about **1 MB** in total. Viewers download **100 million** images a day, mostly the 200 KB feed size.

**Step 1, storage growth.** 2 million × 4 MB = **8 TB a day**, about **240 TB a month**, nearly 3 PB a year. In a database that would be impossible; in a bucket it is just a larger bill. At about $0.023 per GB-month, the first month's 240 TB costs about $5,500 a month to keep, and each month adds another $5,500 to the monthly bill.

**Step 2, upload traffic.** 2 million a day is 23 per second on average, perhaps **100 per second** at peak. Through the API servers, that is 100 × 3 MB = 300 MB/s of uploads, with each upload holding a worker for several seconds on a slow phone connection. With pre-signed URLs, the API only handles 100 small JSON requests a second, and the bytes go straight to the bucket.

**Step 3, read traffic.** 100 million × 200 KB = **20 TB a day** downloaded. Served directly from S3, internet egress is around $0.09 per GB for the first tiers, so about **$1,800 a day**. With a CDN in front and a 95% <Term id="hit-ratio">hit ratio</Term>, only 1 TB a day goes from the bucket to the CDN, and transfer from S3 to CloudFront is free. Most of the 20 TB is served by the CDN at lower per-GB prices for this volume, and users get images from a nearby edge in tens of milliseconds instead of a cross-continent fetch.

**Step 4, cooling data.** Analytics show photos older than 90 days get under 1% of views. A lifecycle rule moves them to Standard-IA, roughly halving their storage cost. Archive classes would be cheaper still, but a user scrolling back to a 2-year-old photo would wait hours, so archive is only for raw originals nobody views, and backups.

**Step 5, the metadata.** The database holds one row per photo, about 200 bytes: `id, user_id, key, width, height, created_at`. 2 million rows a day is 400 MB a day, trivial for PostgreSQL. Listing a user's photos is an indexed database query, not a bucket `LIST`, which is slow and paged at 1,000 keys per call.

## In the real world

- **Amazon S3.** Designed for eleven nines of durability across at least three availability zones (for most classes). Request rates scale per *prefix*: at least 3,500 `PUT`/`POST`/`DELETE` and 5,500 `GET` requests a second per prefix, so very hot workloads spread keys across prefixes. Single `PUT` up to 5 GB, multipart up to 5 TB per object with up to 10,000 parts. Pre-signed URLs last up to 7 days when signed with long-term credentials. Block Public Access is on by default for new buckets.
- **Google Cloud Storage.** Classes Standard, Nearline (30-day minimum), Coldline (90 days) and Archive (365 days), all with millisecond access, unlike Glacier's slower tiers; the colder classes charge more per retrieval instead. Signed URLs last up to 7 days. Dual-region and multi-region buckets replicate across regions.
- **Azure Blob Storage.** Hot, cool, cold and archive tiers; archive blobs must be "rehydrated", taking up to 15 hours at standard priority. Redundancy is chosen per account: LRS (3 copies in one data centre), ZRS (across zones) or GRS (to a second region). Shared Access Signatures play the role of pre-signed URLs.
- **MinIO and Ceph.** Self-hosted object storage with an S3-compatible API. MinIO uses erasure coding across drives with a configurable parity setting, so you choose how many drives can fail; it is common on-premises and in Kubernetes.

## Trade-offs

- **Cheap and durable at any scale,** but higher <Term id="latency">latency</Term> per request, often tens of milliseconds for the first byte, than a local disk or a database row.
- **Whole-object writes only.** Fine for media, backups and data files written once, wrong for data that changes in small pieces, such as a database's files or a log being appended.
- **Simple key lookups.** Listing and searching are slow and limited; keep an index in your database.
- **Storage classes** trade lower cost per GB for slower or pricier retrieval and minimum storage periods.
- **Egress costs money.** Storing a file is cheap; serving it to the internet repeatedly can cost far more than storing it, which is why a CDN goes in front.

## Interview tips

- Whenever users upload media, put it in object storage and the key in the database, and say so early.
- Use pre-signed URLs so large files skip your servers, and multipart upload for big files.
- Put a CDN in front for reads, and estimate egress with the hit ratio.
- Mention lifecycle rules to cold classes when data ages, with the retrieval-time catch.

**Common mistakes:**

- Storing images or videos as BLOBs in the database, bloating backups, replicas and memory.
- Making a bucket public to serve files, instead of keeping it private behind a CDN or signed URLs.
- Using bucket `LIST` as a query engine ("all photos by user 42") instead of a database index.
- Choosing an archive class for data users may open on demand, then discovering restores take hours.

## Common follow-up questions

### How do you serve private files, like invoices, through a CDN?

Keep the bucket private and let only the CDN read it (CloudFront origin access control, for example). Then give users either a short-lived signed URL or signed cookie for the CDN, issued by your API after it checks they own the file. The CDN still caches the bytes, but nobody can fetch them without a valid signature.

### How would you build object storage yourself?

Split it into a metadata service and data nodes. The metadata service maps each key to the locations of its fragments and is a replicated, partitioned database, often using [consistent hashing](/modules/consistent-hashing) on the key. Data nodes store fragments with erasure coding across failure domains. Writes go to the data nodes first and become visible once the metadata entry is committed, and background scrubbers find and repair missing fragments.

### How do you stop users uploading huge or malicious files?

Constrain the pre-signed request: S3 pre-signed `POST` policies can enforce a maximum `content-length-range` and a content type, and the URL expires quickly. Upload into a quarantine prefix, scan and validate the file (type, size, malware) in a worker triggered by the upload event, and only then move it to the public prefix and mark it ready in the database.

### What happens if the client uploads but never calls the API to confirm?

You get orphaned objects that cost money but are never referenced. Handle it by recording a pending row when issuing the URL, confirming via the bucket's upload event rather than trusting the client, and running a lifecycle rule that deletes objects in the uploads prefix after a day unless they were moved. Incomplete multipart uploads also need a lifecycle rule (`AbortIncompleteMultipartUpload`), because their parts are billed.

## Go deeper

- [Amazon S3: Optimizing performance](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html): per-prefix request limits, byte-range fetches and parallel uploads.
- [Amazon S3: Sharing objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html): how pre-signed URLs are created, how long they last, and who can use them.
- [Google Cloud Storage: Storage classes](https://cloud.google.com/storage/docs/storage-classes): what each class costs in minimum duration and retrieval, with availability figures.
- [Building and operating a pretty big storage system called S3 (All Things Distributed)](https://www.allthingsdistributed.com/2023/07/building-and-operating-a-pretty-big-storage-system.html): how S3 handles durability, heat and scale, from its engineering lead.
