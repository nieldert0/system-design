---
slug: scaling-on-aws
title: Scale to millions of users on AWS
section: case-studies
readFirst:
  - approach-a-design-interview
  - load-balancers
  - replication
sources:
  - id: primer-aws
    title: System Design Primer, Design a system that scales to millions of users on AWS
    url: https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/scaling_aws/README.md
    license: CC BY 4.0
    use: reworded
  - id: wiki-autoscaling
    title: Wikipedia, Autoscaling
    url: https://en.wikipedia.org/wiki/Autoscaling
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the first thing to split off a single server as traffic grows?
    options:
      - The DNS record
      - The database, onto its own (managed) instance
      - The load balancer
      - The logs
    correct: 1
    explanation: Web and database then scale independently, and the database gets backups and failover.
  - prompt: Why must web servers be stateless before adding a load balancer?
    options:
      - Any server can then handle any request, so servers can be added or removed freely
      - Stateless servers use less CPU
      - Load balancers only accept stateless servers by law
      - It removes the need for a database
    correct: 0
    explanation: Sessions move to a shared store such as a cache or the database.
  - prompt: What do read replicas take off the primary database?
    options:
      - Writes
      - Backups only
      - Reads
      - Schema changes
    correct: 2
    explanation: The primary handles writes; replicas serve the read-heavy traffic.
  - prompt: Why serve static files from object storage behind a CDN?
    options:
      - It encrypts them
      - Databases cannot store images
      - It is required by HTTPS
      - Web servers stop spending capacity on them, and users get them from a nearby edge
    correct: 3
    explanation: The primer moves static content to S3 and CloudFront early.
  - prompt: What does autoscaling do?
    options:
      - Adds or removes servers automatically based on load metrics such as CPU
      - Makes one server bigger
      - Shards the database
      - Clears the cache
    correct: 0
    explanation: Capacity follows traffic, so you pay less at night and survive spikes.
  - prompt: The app serves 40,000 reads a second and the cache hit ratio is 90%. Each read replica comfortably serves 5,000 queries a second. How many replicas do you need for reads, with headroom to lose one?
    options:
      - 1
      - 2
      - 8
      - 40
    correct: 1
    explanation: 10% of 40,000 is 4,000 database reads a second. One replica would be at 80%; two share the load at 40% each and one can carry everything if the other fails.
  - prompt: The cache hit ratio drops from 90% to 70% after a deploy changes cache keys. What happens to database read load?
    options:
      - It drops
      - It stays the same
      - It triples, from 4,000 to 12,000 reads a second
      - It doubles exactly
    correct: 2
    explanation: Misses go from 10% to 30% of 40,000, so the replicas that were at 40% each are now asked for 6,000 a second each, beyond their capacity. Hit ratio is the number to watch.
  - prompt: Auto Scaling takes about 5 minutes to add a warmed-up instance, and traffic doubles in 2 minutes during a TV advert. What protects the site?
    options:
      - Nothing is needed; autoscaling is instant
      - Running with headroom (for example targeting 50% CPU) and scheduling extra capacity before known events
      - Turning off the load balancer
      - Removing the cache
    correct: 1
    explanation: Reactive scaling lags; spare capacity and scheduled scaling cover the gap until new instances are in service.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import AwsScalingFlow from '#lib/diagrams/AwsScalingFlow.svelte';
</script>

This case study does not design one feature. It shows how an architecture grows, one bottleneck at a time, from a single server to tens of millions of users, using AWS services as concrete names. It follows the four steps from [How to approach a design interview](/modules/approach-a-design-interview), and the growth walk-through is the worked example.

## What it is

The problem: an app that runs fine on one server for its first thousand users falls over at a hundred thousand, and the failure is never "everything is slow". It is one specific thing: the database's CPU at 100%, or one web server's memory, or image downloads saturating the network card. Redesigning everything at once is expensive and usually wrong.

The method is a loop: **measure, find the bottleneck, fix only that, repeat.** <Src id="primer-aws" /> AWS supplies the boxes (managed databases, load balancers, caches, object storage), but the habit is the point. An interviewer asking this question wants to hear you name the bottleneck that justifies each new box, with numbers.

## Requirements

**Step 1, scope.** The primer frames it as a generic web app. <Src id="primer-aws" />

Functional requirements:

- Users sign up, log in, and make read and write requests (posts, profile changes, uploads).
- Users fetch pages, data, and static assets (images, scripts, styles).

Non-functional requirements:

- **Grows from 1 user to 10 million**, and the design should evolve rather than be built for 10 million on day one.
- **Read-heavy**: about 100 reads for every write.
- **Highly available**: survives the loss of one server and one data centre (an AWS <Term id="availability-zone">availability zone</Term>).
- **Fast**: pages in a few hundred milliseconds for users worldwide.
- **Cost-aware**: capacity should follow traffic, not sit idle at 3 a.m.

## Capacity estimates

The primer's end-state numbers, with the arithmetic. <Src id="primer-aws" /> See [Back-of-the-envelope numbers](/modules/back-of-the-envelope).

- **Writes.** 1 billion a month ÷ 2.6 million seconds ≈ **400 writes a second**.
- **Reads.** 100 billion a month ≈ **40,000 reads a second**, a 100:1 ratio.
- **Storage.** 1 KB per write × 1 billion = **1 TB a month**, about **36 TB** over three years. Too big for comfort on one database volume long term, fine for years with a managed database and archiving.
- **Web tier.** If one app server handles about 1,000 requests a second, 40,000 reads plus writes needs about 40 servers at full load, **about 80** at a 50% CPU target, and more at peak.
- **Database reads.** With a 90% cache <Term id="hit-ratio">hit ratio</Term>, the database sees 4,000 reads a second. At roughly 5,000 simple queries a second per replica, two read replicas carry that with room to lose one.
- **Static assets.** If each page pulls 500 KB of images and scripts and there are 5,000 page views a second, that is 2.5 GB/s. No fleet of app servers should be serving that; a [CDN](/modules/cdn) should.

These numbers come at the end. At 1,000 users, every figure is a few hundred times smaller, and one server is enough.

## API

The app's API is ordinary; what matters here is that every endpoint can be served by any web server.

```http
POST /api/v1/sessions
{ "email": "a@example.com", "password": "..." }

201 Created
Set-Cookie: sid=7f3a...; HttpOnly; Secure
```

```http
GET /api/v1/posts?author=42&limit=20
Cookie: sid=7f3a...

200 OK
{ "posts": [ { "id": 901, "text": "...", "image_url": "https://cdn.example.com/i/901.jpg" } ] }
```

```http
POST /api/v1/uploads
→ 200 OK { "upload_url": "https://bucket.s3.amazonaws.com/...", "expires_in": 300 }
```

Two details make the API scale. The session id points into a shared store, not one server's memory, so any server can handle the next request. And uploads go straight to S3 through a <Term id="presigned-url">presigned URL</Term>, so large files never pass through the web tier.

## Data model

- **Relational data** (users, posts, follows) in a managed SQL database such as Amazon RDS for PostgreSQL or MySQL, or Aurora. One primary takes writes; replicas take reads.
- **Sessions** in ElastiCache (Redis), keyed `session:{sid}` with a TTL of, say, 24 hours. Losing the cache logs people out, which is acceptable; if not, store sessions in DynamoDB instead.
- **Hot read data** in the same Redis cluster with [cache-aside](/modules/cache-strategies-and-eviction): `post:{id}`, `user:{id}`, `feed:{user_id}`.
- **Files** in S3, keyed by content type and id (`images/901.jpg`), served through CloudFront.
- **Background jobs** as messages in SQS (`{ "type": "resize_image", "key": "images/901.jpg" }`).

## High-level design

**Step 2, the end state.** DNS (Route 53) points at CloudFront for static content and at an Application Load Balancer for the API. The load balancer spreads requests across an Auto Scaling group of stateless web servers in at least two availability zones. Web servers read from ElastiCache first, then from RDS read replicas; writes go to the RDS primary, which replicates to a standby in another zone. Slow work goes through SQS to a separate worker group. <Src id="primer-aws" />

<AwsScalingFlow />

## How it works

**Step 3, grow one bottleneck at a time.** This is the worked example: each stage gives the symptom that forces the change, the change, and roughly where it stops working. <Src id="primer-aws" />

### Stage 1: one server, about 1 to 1,000 users

One EC2 instance runs the web app and a database, with a Route 53 record pointing at an Elastic IP. It costs tens of dollars a month. It is a single point of failure, and the only way to grow is a bigger instance ([vertical scaling](/modules/performance-vs-scalability)). <Src id="primer-aws" />

**Symptom that ends it:** at a few hundred requests a second, the database and app fight over CPU and memory, and a disk failure loses everything.

### Stage 2: split the database and static files, about 10,000 users

Move the database to RDS: backups, patching, and a Multi-AZ standby come with it. Move images and scripts to S3 behind CloudFront, so the web server stops serving bytes it does not need to. Now the web server and database scale separately.

**Symptom that ends it:** one web server at 80% CPU, and a deploy or reboot takes the site down.

### Stage 3: scale out the web tier, about 100,000 users

Make web servers **<Term id="stateless">stateless</Term>**: sessions move to ElastiCache, uploads go to S3. Put an Application Load Balancer in front with <Term id="health-check">health checks</Term>, and run at least two servers in each of two availability zones. A bad server or a whole zone can now fail and the load balancer routes around it. See [Load balancers](/modules/load-balancers).

**Symptom that ends it:** the database at 70% CPU, almost all of it reads.

### Stage 4: take reads off the database, about 1 million users

Add ElastiCache for hot objects, and [read replicas](/modules/replication) for the reads the cache misses. With 40,000 reads a second at a 90% hit ratio, replicas see 4,000 a second; two replicas run at about 40% each. The primary now handles only the 400 writes a second. Code must tolerate <Term id="replication-lag">replication lag</Term>: after a user edits their profile, read it from the primary for a few seconds (read-your-writes).

**Symptom that ends it:** daily traffic swings 5× between night and evening, so the fleet is either overloaded at 8 p.m. or idle at 4 a.m., and slow tasks like image resizing make requests time out.

### Stage 5: automate and decouple, about 10 million users

Put the web servers in an Auto Scaling group with **<Term id="autoscaling">autoscaling</Term>** on a target-tracking policy (keep average CPU at 50%), with a minimum of 4 and a maximum of, say, 120 instances. <Src id="wiki-autoscaling" /> Move slow work onto SQS with a separate worker group that scales on queue depth, so a burst of uploads delays thumbnails rather than slowing page loads. See [Queues and back-pressure](/modules/queues-and-back-pressure). Add metrics, logs, and alarms ([Observability](/modules/observability)) so the next bottleneck is visible before users report it.

**Step 4, beyond.** When the primary can no longer take the writes, or the data outgrows one machine, [shard or federate](/modules/federation-sharding-denormalization) the database, or move suitable data (sessions, counters, activity feeds) to [NoSQL](/modules/nosql-types) such as DynamoDB. <Src id="primer-aws" />

## Deep dives

### 1. Making the web tier stateless

Anything a server keeps between requests pins a user to that server: sessions in memory, uploaded files on local disk, an in-process cache that must be invalidated. Each blocks horizontal scaling and makes losing a server lose data. Move sessions to Redis or DynamoDB, files to S3, and caches to ElastiCache (a small local cache with a short TTL is fine). Then servers are interchangeable, autoscaling can terminate any of them, and deploys can replace them one by one. Avoid relying on <Term id="sticky-session">sticky sessions</Term> to paper over local state; they break when the server dies and unbalance load.

### 2. Database growth: replicas, then partitioning

Read replicas scale reads, not writes: every replica still applies every write. At 400 writes a second a single RDS primary is comfortable; at 10,000 it is not. Steps in order of cost:

1. Make writes cheaper: batch them, drop unneeded indexes, move counters and logs out of the main database.
2. Move whole tables with a different access pattern elsewhere: sessions and activity streams to DynamoDB, search to OpenSearch.
3. **Federate**: split by function into separate databases (users, posts, billing).
4. **Shard**: split one table across databases by a <Term id="shard-key">shard key</Term> such as user id. This is the expensive step, because cross-shard queries and transactions become hard.

### 3. Surviving an availability zone failure

An availability zone is one or more data centres with independent power and networking; a region has several. Spreading across two zones is not enough if losing one leaves the other at 150% load. Size each zone to carry the whole load (or run three zones each sized for half), so a zone failure needs no scaling action in the middle of the incident. AWS calls this **static stability**. RDS Multi-AZ fails over to the standby automatically, typically in one to two minutes; the app must reconnect and retry. ElastiCache with a replica in another zone does the same for the cache.

## Bottlenecks and scaling

- **Database writes**: the eventual hard limit. Watch primary CPU and write latency; plan federation or sharding well before 70% utilisation.
- **Cache hit ratio**: the number that decides database read load. A drop from 90% to 70% triples misses, from 4,000 to 12,000 reads a second. Alarm on it, and watch for the <Term id="thundering-herd">thundering herd</Term> when a hot key expires.
- **Autoscaling lag**: new instances take minutes to boot and warm up. Keep headroom with a 50% CPU target, bake application code into the machine image so boot is fast, and use scheduled scaling before known peaks.
- **Static and media traffic**: if CloudFront's hit ratio is low, S3 and the network bill grow; set long cache lifetimes with versioned file names.
- **Connections**: 120 web servers × 20 database connections each = 2,400 connections, enough to exhaust a database. Use a <Term id="connection-pool">connection pool</Term> per server and RDS Proxy in front of the database.

## In the real world

- **EC2 Auto Scaling** target tracking keeps a metric such as `ASGAverageCPUUtilization` at a target value you choose (50% is common), scaling out quickly and in slowly. A default instance warmup (often set to a few minutes) stops new instances from skewing the metric before they serve traffic.
- **Application Load Balancer** checks targets on a health check path (default interval 30 seconds), has cross-zone load balancing on by default, a default idle timeout of 60 seconds, and a deregistration delay of 300 seconds that lets in-flight requests finish during scale-in and deploys.
- **Amazon RDS** supports up to 15 read replicas for MySQL and PostgreSQL, and Multi-AZ deployments keep a synchronous standby in another zone. Aurora shares storage across replicas, so replica lag is usually tens of milliseconds and failover is faster.
- **CloudFront** caches objects for a default TTL of 24 hours unless `Cache-Control` says otherwise, and S3 supports at least 3,500 writes and 5,500 reads a second per key prefix, so a bucket scales by spreading keys across prefixes.

## Trade-offs

- **Every step adds moving parts**: more cost, more things to monitor, and more ways to fail. Only add a piece when measurements say you need it. <Src id="primer-aws" />
- **Managed services** (RDS, load balancers, S3) cost more than running your own, but save the operations work. <Src id="primer-aws" />
- **Caches and replicas** bring stale reads; decide which data can tolerate them. <Src id="primer-aws" />
- **Autoscaling reacts with a delay**, so sudden spikes still need headroom. <Src id="wiki-autoscaling" />
- **Multi-AZ costs about double** for the database and some cross-zone traffic charges, in exchange for surviving a data centre failure.

## Interview tips

- Grow the design out loud, and name the symptom and metric that justify each new box.
- Make web servers stateless early; it unlocks load balancing, autoscaling, and safe deploys.
- Use the read/write ratio and cache hit ratio to size replicas, with the arithmetic shown.
- Say "it depends on measurements" and mention monitoring, rather than drawing the final diagram first.
- Mention availability zones and what happens when one fails.

**Common mistakes:**

- Drawing the 10-million-user architecture for an app that has 1,000 users, which costs money and attention without a bottleneck to justify it.
- Adding read replicas to fix a write bottleneck; replicas apply every write too.
- Keeping sessions or uploads on local disk, then adding a load balancer and wondering why users get logged out.
- Spreading across two availability zones but sizing each for half the load, so a zone failure overloads the survivor.

## Common follow-up questions

### When would you use serverless (Lambda) instead of EC2?

For spiky or low-volume workloads and glue code: image processing triggered by S3 uploads, scheduled jobs, webhooks. You pay per request and never manage servers, at the cost of <Term id="cold-start">cold starts</Term>, a 15-minute execution limit, and a higher price per request at steady high volume. See [Monolith vs microservices](/modules/monolith-vs-microservices) for where it fits.

### How would you go multi-region?

Start with a second region for disaster recovery: replicate the database asynchronously (Aurora Global Database or cross-region replicas), copy S3 data, and fail over DNS with Route 53 health checks. Serving writes in both regions needs conflict handling or partitioning users by region, which is much harder; most apps run one write region and serve reads and static content everywhere.

### How do you deploy without downtime?

Replace instances gradually behind the load balancer: launch new ones, wait for health checks, then drain old ones using the deregistration delay. For risky changes use a [canary or blue-green release](/modules/ci-cd-and-deployment), and use expand-then-contract schema migrations so old and new code both work against the database.

### The site is slow. How do you find the bottleneck?

Start from user-facing latency percentiles, then trace one slow request through the tiers with [distributed tracing](/modules/observability). Compare saturation in each tier: load balancer surge queue, web CPU, cache hit ratio and latency, database CPU, connections, and slow query log. The tier with rising latency and high saturation is the bottleneck; fix that one.

## Go deeper

- [System Design Primer, Design a system that scales to millions of users on AWS](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/scaling_aws/README.md): the full primer walk-through with its estimates and stage-by-stage diagrams.
- [AWS Builders' Library, Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/): how AWS sizes services so a zone failure needs no scaling action.
- [Amazon EC2 Auto Scaling, Target tracking scaling policies](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html): how target tracking works, which metrics to use, and the warmup settings.
- [AWS Well-Architected Framework, Reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html): AWS's checklist for designing workloads that recover from failure and scale with demand.
