---
slug: federation-sharding-denormalization
title: Federation, sharding and denormalization
section: databases
upgraded: true
readFirst:
  - replication
sources:
  - id: primer
    title: The System Design Primer, Federation, Sharding and Denormalization
    url: https://github.com/donnemartin/system-design-primer#federation
    license: CC BY 4.0
    use: reworded
  - id: wiki-shard
    title: Wikipedia, Shard (database architecture)
    url: https://en.wikipedia.org/wiki/Shard_(database_architecture)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does federation split a database by?
    options:
      - By rows, using a key
      - By function, for example users, products and forums in separate databases
      - By column type
      - By region only
    correct: 1
    explanation: Each functional area gets its own database, so each takes less traffic and fits in memory more easily.
  - prompt: What does sharding split a database by?
    options:
      - By function
      - By rows, so each shard holds a subset of the data chosen by a shard key
      - By index
      - By time of day
    correct: 1
    explanation: Every shard has the same schema but different rows.
  - prompt: What does denormalization trade?
    options:
      - Read speed for write speed
      - Extra writes and duplicated data for cheaper reads with fewer joins
      - Durability for latency
      - Consistency for availability
    correct: 1
    explanation: Copies of data avoid joins at read time, but every copy must be updated on write.
  - prompt: Which is a good shard key for a multi-tenant SaaS app where almost every query is for one company?
    options:
      - created_at timestamp
      - company_id
      - A random UUID per row
      - Country
    correct: 1
    explanation: Queries hit one shard, keys have high cardinality, and joins within a company stay local.
  - prompt: In the worked example, 10,200 writes/s go to 4 hashed shards and one tenant makes up 30% of them. About how many writes/s does that tenant's shard get?
    options:
      - 2,550, because hashing spreads load evenly
      - About 4,845, its tenant's 3,060 plus a quarter of the other 7,140
      - 10,200
      - 3,060
    correct: 1
    explanation: Hashing spreads tenants, not one tenant's traffic, so that shard runs close to its 5,000 limit while the others sit near 1,800.
  - prompt: Why is "SELECT ... ORDER BY created_at LIMIT 20" across all users slow on a database sharded by user_id?
    options:
      - Sharding disables indexes
      - Every shard must be queried and the results merged (scatter-gather), so the slowest shard sets the latency
      - Only one shard has timestamps
      - It is not slow
    correct: 1
    explanation: The query does not include the shard key, so the router cannot pick one shard.
  - prompt: A feed page joins posts, users and like counts and runs 50,000 times a second, while likes change 2,000 times a second. Why does storing like_count on the posts row help?
    options:
      - It removes the need for an index
      - It turns an expensive aggregate on every read into one cheap increment per like, and reads outnumber likes 25 to 1
      - It makes writes faster
      - It enables sharding
    correct: 1
    explanation: Denormalization pays off when reads of the derived value vastly outnumber writes to it.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import FederationSplit from '#lib/diagrams/FederationSplit.svelte';
	import ShardRoutingFlow from '#lib/diagrams/ShardRoutingFlow.svelte';
</script>

Federation, sharding and denormalization are three ways to get past the limits of one database server. Federation splits the database by function, sharding splits it by rows, and denormalization copies data so reads need fewer joins.

## What it is

Here is the problem. [Replication](/modules/replication) gave you more read capacity, but every replica replays every write, so write capacity is still one machine. Your primary does 12,000 writes a second, its disk and CPU top out around 5,000, and the dataset is 4 TB on a machine with 512 GB of RAM, so most reads miss memory and go to disk. No single machine you can buy fixes that for long. You need to split the data so that each machine holds and writes only part of it.

There are two ways to split, plus one way to make reads cheaper:

- **Federation** (functional partitioning) splits the database by function. Users go in one database, products in another, forum posts in a third. Each database gets a fraction of the traffic and a smaller dataset that fits in memory better. <Src id="primer" />
- **<Term id="sharding">Sharding</Term>** (horizontal partitioning) splits one big table across many databases by row. Every shard has the same schema but different rows, chosen by a **<Term id="shard-key">shard key</Term>** such as `user_id`. Each shard takes a fraction of the reads and writes. <Src id="primer" /> <Src id="wiki-shard" />
- **<Term id="denormalization">Denormalization</Term>** stores redundant copies of data, for example a post's author name on the post row, so a read can skip a join. It gives up some write performance and storage to make reads cheap. <Src id="primer" />

Federation and sharding add capacity by adding machines. Denormalization adds none, but it is often what makes a sharded design workable, because joins across machines are expensive or impossible.

## How it works

### Federation

<FederationSplit />

Each functional area gets its own database, often owned by the service that owns that area, which is how [microservices](/modules/monolith-vs-microservices) usually arrange data. Smaller databases mean more of each dataset fits in memory, so more reads are cache hits. Writes are spread too: user signups no longer compete with product updates for the same primary's log. Each database can be replicated and tuned independently. <Src id="primer" />

The application, or a thin data-access layer, decides which database to use for each query. A query that joins users with orders now spans two databases, so it either becomes two queries joined in code, or one area keeps a copy of the fields it needs from the other. Federation stops helping when one function alone is too big, for example when the `orders` table by itself outgrows a machine. That is when you shard. <Src id="primer" />

### Sharding

<ShardRoutingFlow />

Each shard holds a subset of rows. A router (in the application, in a proxy, or in the database itself) computes which shard owns a key and sends the query there. <Src id="wiki-shard" /> There are three common ways to map keys to shards:

- **Hash sharding**: `shard = hash(user_id)` mapped onto the shards, usually with [consistent hashing](/modules/consistent-hashing) so adding a shard moves only a small share of rows. Load spreads evenly, but range scans across keys touch every shard.
- **Range sharding**: shard 1 holds ids 1 to 10 million, shard 2 the next 10 million, and so on. Range scans stay on one shard, but new rows, which usually have the highest ids or newest timestamps, all go to the last shard, so it becomes a hotspot.
- **Directory (lookup) sharding**: a small table records which shard each tenant or key lives on. It is the most flexible, because you can move one big tenant to its own shard, but the directory is one more service that must be fast and always available.

Choosing the shard key is the most important decision, because changing it later means moving every row. A good key has three properties: **high cardinality** (many distinct values, so data can spread), **even access** (no single value dominates traffic), and **query locality** (the common queries include the key, so they hit one shard). For a multi-tenant app that is usually `tenant_id`; for a consumer app, `user_id`.

Queries that do not include the shard key must ask every shard and merge the results. This is called **<Term id="scatter-gather">scatter-gather</Term>**, and its latency is set by the slowest shard. Joins across shards and transactions across shards are either unsupported or need a distributed transaction protocol, so you design the schema so that the data one request touches lives on one shard. <Src id="primer" />

Each shard is still a normal database, usually with its own replicas. A common layout is 16 shards × 1 primary and 2 replicas = 48 database servers.

### Denormalization

A **normalized** schema stores each fact once: the author's name lives only in `users`, and posts reference it by `user_id`. That keeps writes simple and data consistent, but rendering a feed means joining posts, users, and a `COUNT(*)` over likes for each post. <Src id="primer" />

Denormalization copies facts to where they are read: `author_name` and `like_count` stored on the `posts` row. Reads become a single-table lookup. Writes now have to update every copy, which is done in the same transaction where possible, with triggers, or asynchronously from a change stream. Many databases offer **materialized views**, which store the result of a query and refresh it, as a managed form of the same idea. <Src id="primer" />

It pays off when reads vastly outnumber writes, which is common: reads often outnumber writes 100 to 1 or even 1,000 to 1. A read that needs a complex join can spend most of its time on disk, so paying a little extra on each write to avoid that is usually a good trade. <Src id="primer" />

## Worked example

A B2B project-management app runs on one PostgreSQL primary. Peak load is **12,000 writes/s**; one database server handles about **5,000 writes/s**. Data is **4 TB** and growing 100 GB a month. Almost every query is scoped to one company.

**Step 1, federation first.** The app has three areas: accounts and billing (5% of writes), projects and tasks (85%), and notifications (10%). Moving accounts and notifications into their own databases takes 15% of writes, 1,800/s, off the main primary. It is now at 10,200 writes/s, still double its limit. Federation helped but cannot fix it, because one area is most of the load.

**Step 2, shard projects and tasks by `company_id`.** Every task query includes `company_id`, so each hits one shard, and joins between a company's projects and tasks stay local. With 4 shards and an even spread, each takes 10,200 ÷ 4 = **2,550 writes/s** and about 1 TB, well under the 5,000 limit. We hash `company_id` onto 64 logical shards placed on 4 physical servers, so later we can move logical shards to new servers without rehashing.

**Step 3, the whale tenant.** One enterprise customer generates **30%** of all project traffic: 3,060 writes/s. Hashing put it on shard 2, which now gets 3,060 plus a quarter of the remaining 7,140, about 1,785, for **4,845 writes/s**, just under the limit. When that customer grows by another 20%, shard 2 tips over while the others idle at 1,800. Hashing spreads *companies* evenly, not *traffic*. The fix is directory sharding for the largest tenants: a lookup table maps that company to its own dedicated shard, and everyone else stays hashed.

**Step 4, a cross-shard query.** The support dashboard wants "the 20 most recently updated tasks across all companies". It does not include `company_id`, so it must query all 5 shards and merge. If each shard answers in 20 ms but one is busy at 200 ms, the dashboard takes 200 ms. Better: feed task updates to a separate search or analytics store, built for queries across all tenants, and keep the shards for per-company traffic.

**Step 5, denormalize the board view.** The task board shows each task with its assignee's name and comment count and is loaded **50,000 times/s**, against **2,000** comment writes/s. Storing `assignee_name` and `comment_count` on the task row turns a three-table join and a count into one indexed read. Each comment write adds one `UPDATE tasks SET comment_count = comment_count + 1`, an extra 2,000 tiny writes/s spread over the shards, to save a join on 50,000 reads/s. When a user renames themselves, a background job updates `assignee_name` on their tasks, and the board shows the old name for a few seconds.

## In the real world

- **Vitess (YouTube, Slack, GitHub).** Shards MySQL behind a proxy, `vtgate`, so the app sees one database. The shard key is defined by a *vindex* in the VSchema (`hash`, `xxhash`, or a lookup vindex), and resharding splits key ranges online with `Reshard` workflows while traffic continues.
- **Citus (PostgreSQL extension).** `create_distributed_table('tasks', 'company_id')` hashes rows into shards (`citus.shard_count`, default 32) across worker nodes. Tables distributed on the same column are *co-located*, so joins on `company_id` run locally on each worker; small tables can be copied to every node with `create_reference_table`.
- **MongoDB.** `sh.shardCollection()` with a hashed or ranged shard key splits data into chunks, and a balancer moves chunks between shards in the background. Queries without the shard key are broadcast to every shard by `mongos`. Since version 5.0 you can change a collection's shard key with `reshardCollection`, a costly copy.
- **Instagram's early sharding.** They mapped thousands of logical shards, implemented as PostgreSQL schemas, onto a few physical servers, and generated ids that embed the logical shard number, so any id says where its row lives. Moving logical shards to new machines needed no rehashing.

## Trade-offs

| Technique | Adds write capacity | Breaks | Main cost |
| --- | --- | --- | --- |
| Federation | Yes, per function | Joins across functions | App must route by function |
| Sharding | Yes, per shard | Cross-shard joins and transactions | Shard key choice, rebalancing |
| Denormalization | No | Single source of truth | Extra writes, keeping copies in sync |

**Federation** <Src id="primer" />

- Does not help if one function or one table is too big on its own.
- Application logic must know which database to read and write.
- Joining data from two databases needs code or a server link.
- More hardware and more moving parts.

**Sharding** <Src id="primer" />

- Application logic or a proxy must route by shard, and queries without the shard key fan out to every shard.
- Load can be lopsided: a few power users or one large tenant can overload a shard. Rebalancing is extra work; consistent hashing reduces how much data moves.
- Cross-shard joins and transactions are complex or unavailable.
- More hardware and more moving parts.

**Denormalization** <Src id="primer" />

- Data is duplicated, so copies can disagree for a while.
- Keeping copies in sync needs constraints, triggers or jobs, which makes the design more complex.
- Under heavy writes, a denormalized schema can be slower than a normalized one.

## Interview tips

- Shard last: try caching, read replicas, federation and query tuning first, and say why they are not enough with numbers.
- State the shard key and defend it: high cardinality, even access, and most queries include it.
- Raise hot keys and large tenants yourself, and say how you would isolate them (dedicated shards, directory sharding).
- Use more logical shards than servers from day one, so growth is moving shards, not rehashing rows.

**Common mistakes:**

- Sharding by a timestamp or auto-increment id with range sharding, which sends every new write to the last shard.
- Choosing a shard key the main queries do not include, so most requests become scatter-gather.
- Assuming hashing balances load. It balances keys; one huge tenant or celebrity still lands on one shard.
- Denormalizing write-heavy data, so every write fans out into many updates.

## Common follow-up questions

### How do you reshard when a shard gets full?

Ideally, you never rehash rows: you start with many logical shards (say 256) on a few servers and move whole logical shards to new servers. The move is copy the shard, stream changes made during the copy, briefly pause writes to it, switch the routing entry, and resume. Vitess and MongoDB automate this; with homegrown sharding it is a planned migration.

### How do you generate unique ids across shards?

Not with each shard's auto-increment, which collides. Use UUIDs (simple, but random and 128 bits), or a Snowflake-style 64-bit id made of a timestamp, a machine or shard number, and a sequence. Embedding the shard number in the id, as Instagram did, also tells you where a row lives without a lookup.

### How do you handle a query that needs data from every shard?

Avoid it on the hot path. Scatter-gather is fine for rare admin queries. For frequent ones, maintain a separate read model: stream changes into a search index, an analytics store, or a denormalized table sharded by the other key. For example, keep orders sharded by `user_id` and a copy sharded by `merchant_id` for the merchant dashboard.

### When would you denormalize instead of adding a cache?

When the expensive part is the join itself and the data is read on almost every request, so storing the result as part of the row is simpler than invalidating a [cache](/modules/cache-strategies-and-eviction). A cache keeps the normalized source of truth and adds a layer that can be stale; denormalization changes the source of truth. Many systems do both.

### How do you do a transaction across two shards?

Avoid needing one by choosing a shard key that keeps related rows together. When unavoidable, use two-phase commit if the database supports it (Citus and Vitess have options), or a saga of local transactions with compensating actions. See [relational databases and ACID](/modules/relational-and-acid).

## Go deeper

- [Vitess: Sharding](https://vitess.io/docs/reference/features/sharding/): key ranges, vindexes, and how resharding works on a live MySQL fleet.
- [Citus: Choosing a distribution column](https://docs.citusdata.com/en/stable/sharding/data_modeling.html): concrete advice on shard keys for multi-tenant and real-time apps, with co-location.
- [Instagram: Sharding and IDs at Instagram](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c): logical shards on PostgreSQL schemas and ids that encode their shard.
- [MongoDB: Choose a shard key](https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/): cardinality, frequency and monotonic keys, explained with examples of bad choices.
