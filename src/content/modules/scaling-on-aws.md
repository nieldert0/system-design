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
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import AwsScalingFlow from '#lib/diagrams/AwsScalingFlow.svelte';
</script>

This case study does not design one feature. It shows how an architecture grows, one bottleneck at a time, from a single server to millions of users. It follows the steps from [How to approach a design interview](/modules/approach-a-design-interview).

## What it is

**Step 1, requirements.** A generic web app with users making read and write requests. It starts with one user and grows to tens of millions, with reads far outnumbering writes. <Src id="primer-aws" /> The goal is the habit, not the AWS products: **measure, find the bottleneck, fix it, repeat.** <Src id="primer-aws" />

## How it works

**Step 2, start simple.** One server runs the web app and a database, with a DNS name pointing at it. It is cheap and fine for a handful of users, but it is a single point of failure and can only grow by getting bigger ([vertical scaling](/modules/performance-vs-scalability)). <Src id="primer-aws" />

**Step 3, grow one bottleneck at a time.** <Src id="primer-aws" />

1. **Split the database** onto its own managed SQL instance (such as RDS), and move static files to object storage (S3) served through a [CDN](/modules/cdn).
2. **Scale out the web tier**: make web servers stateless, put a [load balancer](/modules/load-balancers) in front, and spread them over several availability zones.
3. **Take reads off the database**: add a memory cache for hot data and sessions, and [read replicas](/modules/replication).
4. **Automate and decouple**: <Term id="autoscaling">autoscaling</Term> adds and removes web servers with load, and slow work goes through a [queue](/modules/queues-and-back-pressure) to workers. <Src id="wiki-autoscaling" />

<AwsScalingFlow />

**Step 4, beyond millions.** When the primary can no longer take the writes, [shard or federate](/modules/federation-sharding-denormalization) the database, or move suitable data to [NoSQL](/modules/nosql-types). Add monitoring at every step so you know where the next bottleneck is. <Src id="primer-aws" />

## Trade-offs

- **Every step adds moving parts**: more cost, more things to monitor, and more ways to fail. Only add a piece when measurements say you need it. <Src id="primer-aws" />
- **Managed services** (RDS, load balancers, S3) cost more than running your own, but save the operations work. <Src id="primer-aws" />
- **Caches and replicas** bring stale reads; decide which data can tolerate them. <Src id="primer-aws" />
- **Autoscaling reacts with a delay**, so sudden spikes still need headroom. <Src id="wiki-autoscaling" />

## Interview tips

- Grow the design out loud, and name the bottleneck that justifies each new box.
- Keep web servers stateless early; it unlocks everything after.
- Say "it depends on measurements" and mention monitoring, rather than drawing the final diagram first.
