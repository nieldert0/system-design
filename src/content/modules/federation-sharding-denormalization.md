---
slug: federation-sharding-denormalization
title: Federation, sharding and denormalization
section: databases
readFirst:
  - replication
sources:
  - id: primer
    title: The System Design Primer, Federation, Sharding and Denormalization
    url: https://github.com/donnemartin/system-design-primer#federation
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What is federation?
    options:
      - Copying the whole database to many servers
      - Splitting databases by function, such as users, products and forums
      - Splitting one table's rows across servers
      - Duplicating data to avoid joins
    correct: 1
    explanation: Also called functional partitioning.
  - prompt: What is sharding?
    options:
      - Splitting databases by function
      - Distributing data so each database manages only a subset of it
      - Adding read replicas
      - Caching queries
    correct: 1
    explanation: For example, users A–M on one shard and N–Z on another.
  - prompt: A few power users make one shard much busier than others. What is this called?
    options:
      - Replication lag
      - A hot spot from lopsided data distribution
      - Denormalization
      - A partition
    correct: 1
    explanation: Rebalancing helps; consistent hashing reduces how much data moves.
  - prompt: What does denormalization trade?
    options:
      - Read speed for write speed
      - Some write performance and duplication for faster reads without joins
      - Consistency for availability
      - Disk for CPU
    correct: 1
    explanation: Redundant copies avoid expensive joins.
  - prompt: Why is denormalization attractive in most systems?
    options:
      - Reads can heavily outnumber writes, 100 to 1 or even 1000 to 1
      - Writes outnumber reads
      - Joins are free
      - It saves disk space
    correct: 0
    explanation: Paying a little on writes to save a lot on reads usually wins.
  - prompt: What becomes harder after sharding?
    options:
      - Single-key lookups
      - Joins and transactions across shards
      - Adding indexes
      - Reading one row
    correct: 1
    explanation: Data you need together might live on different shards.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

When one database cannot keep up, you split it: by function (federation), by rows (sharding), or you duplicate data so reads need fewer joins (denormalization).

## What it is

**Federation** (or functional partitioning) splits up databases by function. For example, instead of a single, monolithic database, you could have three databases: **forums**, **users**, and **products**. <Src id="primer" />

**<Term id="sharding">Sharding</Term>** distributes data across different databases such that each database can only manage a subset of the data. Taking a users database as an example, as the number of users increases, more shards are added to the cluster. <Src id="primer" />

**<Term id="denormalization">Denormalization</Term>** attempts to improve read performance at the expense of some write performance. Redundant copies of the data are written in multiple tables to avoid expensive joins. <Src id="primer" />

## How it works

**Federation** results in less read and write traffic to each database and therefore less replication lag. Smaller databases result in more data that can fit in memory, which in turn results in more cache hits due to improved cache locality. With no single central master serializing writes you can write in parallel, increasing throughput. <Src id="primer" />

**Sharding** similarly results in less read and write traffic, less replication, and more cache hits. Index size is also reduced, which generally improves performance with faster queries. If one shard goes down, the other shards are still operational, although you'll want to add some form of replication to avoid data loss. Common ways to shard a table of users is either through the user's last name initial or the user's geographic location. <Src id="primer" />

**Denormalization.** Some RDBMS such as PostgreSQL and Oracle support materialized views which handle the work of storing redundant information and keeping redundant copies consistent. Once data becomes distributed with techniques such as federation and sharding, managing joins across data centers further increases complexity. Denormalization might circumvent the need for such complex joins. In most systems, reads can heavily outnumber writes 100:1 or even 1000:1. A read resulting in a complex database join can be very expensive, spending a significant amount of time on disk operations. <Src id="primer" />

## Trade-offs

**Federation** <Src id="primer" />

- Federation is not effective if your schema requires huge functions or tables.
- You'll need to update your application logic to determine which database to read and write.
- Joining data from two databases is more complex with a server link.
- Federation adds more hardware and additional complexity.

**Sharding** <Src id="primer" />

- You'll need to update your application logic to work with shards, which could result in complex SQL queries.
- Data distribution can become lopsided in a shard. For example, a set of power users on a shard could result in increased load to that shard compared to others. Rebalancing adds additional complexity. A sharding function based on consistent hashing can reduce the amount of transferred data.
- Joining data from multiple shards is more complex.
- Sharding adds more hardware and additional complexity.

**Denormalization** <Src id="primer" />

- Data is duplicated.
- Constraints can help redundant copies of information stay in sync, which increases complexity of the database design.
- A denormalized database under heavy write load might perform worse than its normalized counterpart.

## Interview tips

- Shard last: try caching, read replicas and federation first, and say why they are not enough.
- Choose the shard key carefully and explain it: high cardinality, even spread, and most queries hit one shard.
- Call out celebrity/hot keys and how you'd handle them.
