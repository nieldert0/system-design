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
    use: copied
quiz:
  - prompt: What is object storage?
    options:
      - A relational database
      - A store for whole files (objects) addressed by key, with metadata, in a flat namespace
      - A block device attached to one VM
      - An in-memory cache
    correct: 1
    explanation: S3, Google Cloud Storage and Azure Blob Storage are examples.
  - prompt: Where should user-uploaded photos usually live?
    options:
      - In a database BLOB column
      - In object storage, with the database holding the key or URL
      - On the app server's local disk
      - In Redis
    correct: 1
    explanation: Avoid storing large BLOBs; store the location of where to get the object instead.
  - prompt: Why not store uploads on an app server's local disk?
    options:
      - Disks are slow
      - It ties data to one server, breaking stateless scaling and risking loss
      - It is not allowed
      - It is too cheap
    correct: 1
    explanation: Object storage is shared and durable.
  - prompt: How do you change part of an object?
    options:
      - Edit bytes in place like a file
      - Upload a new version of the whole object
      - Run an UPDATE statement
      - Append with SQL
    correct: 1
    explanation: Objects are generally written whole; there is no in-place edit.
  - prompt: How can clients upload large files without passing them through your servers?
    options:
      - Through a WebSocket to the app server
      - With a pre-signed URL that lets the client upload straight to object storage
      - By email
      - Through DNS
    correct: 1
    explanation: Pre-signed URLs grant short-lived permission to upload or download one object.
  - prompt: What usually sits in front of object storage for fast global reads?
    options:
      - A database replica
      - A CDN
      - A message queue
      - A graph database
    correct: 1
    explanation: The CDN caches objects near users; object storage is the origin.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Object storage is where large files live: images, videos, backups, logs. It is cheap, very durable and scales almost without limit, but you cannot edit files in place.

## What it is

**<Term id="object-storage">Object storage</Term>** keeps data as whole objects. Each object has its data, some metadata and a unique key, and lives in a flat namespace (a bucket) rather than a folder tree. Amazon S3, Google Cloud Storage and Azure Blob Storage are common examples. <Src id="wiki-obj" />

## How it works

You `PUT` an object under a key, `GET` it back by key and `DELETE` it. There is no in-place edit: to change an object you write a new version of it. Behind the API, the service copies each object across disks and data centers, which is how it reaches very high durability. <Src id="wiki-obj" />

Databases should not hold large files. Avoid storing large BLOBs, store the location of where to get the object instead. <Src id="primer" />

A typical upload flow:

1. The client asks your API for permission to upload.
2. The API returns a short-lived **pre-signed URL** for one key.
3. The client uploads the file directly to object storage.
4. The API saves the key and metadata in the database.
5. Reads go through a <Term id="cdn">CDN</Term> with object storage as the origin.

## Trade-offs

- **Cheap and durable at any scale,** but higher <Term id="latency">latency</Term> per request than a local disk or a database row.
- **Whole-object writes only.** Fine for media and backups, wrong for data that changes in small pieces.
- **Simple key lookups;** listing and searching need the database or an index you maintain.
- **Storage classes** (hot, infrequent, archive) trade lower cost for slower or pricier retrieval.

## Interview tips

- Any time users upload media, put it in object storage and the key in the database.
- Use pre-signed URLs so big files skip your servers.
- Put a CDN in front for reads, and move old data to colder storage classes to save money.
