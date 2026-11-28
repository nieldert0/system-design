---
slug: nosql-types
title: NoSQL types
section: databases
upgraded: true
readFirst:
  - relational-and-acid
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, NoSQL
    url: https://github.com/donnemartin/system-design-primer#nosql
    license: CC BY 4.0
    use: reworded
  - id: wiki-nosql
    title: Wikipedia, NoSQL
    url: https://en.wikipedia.org/wiki/NoSQL
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-lsm
    title: Wikipedia, Log-structured merge-tree
    url: https://en.wikipedia.org/wiki/Log-structured_merge-tree
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: Which NoSQL type is essentially a distributed hash table?
    options:
      - Graph database
      - Key-value store
      - Wide column store
      - Document store
    correct: 1
    explanation: You get and put values by key, usually in O(1).
  - prompt: What does a document store add over a key-value store?
    options:
      - Joins across documents
      - The database understands the document's structure, so you can query and index fields inside it
      - Strong consistency everywhere
      - Fixed schemas
    correct: 1
    explanation: Values are JSON-like documents the database can look inside.
  - prompt: Which type is designed for traversing relationships such as friends of friends?
    options:
      - Key-value store
      - Graph database
      - Wide column store
      - Object store
    correct: 1
    explanation: Each hop follows a stored edge instead of running a join.
  - prompt: What does BASE stand for?
    options:
      - Batch, Async, Sharded, Eventual
      - Basically available, soft state, eventual consistency
      - Binary, Atomic, Serial, Exact
      - Backup, Archive, Store, Erase
    correct: 1
    explanation: It describes systems that favour availability over immediate consistency.
  - prompt: In the worked example, a chat app partitions messages by channel_id only. Why do the largest channels become a problem?
    options:
      - Cassandra cannot store large rows
      - All of a channel's messages live in one partition on the same few nodes, which grows without bound and takes all that channel's traffic
      - Messages are lost on compaction
      - Reads need a join
    correct: 1
    explanation: Adding a time bucket to the partition key, such as (channel_id, day), caps partition size and spreads a busy channel over many partitions.
  - prompt: With replication factor 3, writes at QUORUM and reads at QUORUM, why does a read always see the latest acknowledged write?
    options:
      - Because quorum reads go to the leader
      - Because 2 replicas acknowledged the write and 2 are read, and with 3 replicas any two sets of 2 overlap in at least one node
      - Because Cassandra is strongly consistent by default
      - It does not
    correct: 1
    explanation: R + W > N (2 + 2 > 3) guarantees overlap; the newest timestamp wins.
  - prompt: The team needs "messages in channel X between two dates" and "all messages by user Y". In a wide column store, what is the usual way to support the second query?
    options:
      - A join at read time
      - A second table partitioned by user_id that the app writes to as well
      - Scanning every partition
      - It cannot be supported
    correct: 1
    explanation: You model one table per query and write to both; the data is duplicated on purpose.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import NoSqlShapes from '#lib/diagrams/NoSqlShapes.svelte';
</script>

"NoSQL" covers four quite different kinds of database: key-value, document, wide column and graph. Each gives up some of what a relational database offers, usually joins and multi-row transactions, to be very good at one access pattern at a scale one relational server cannot reach.

## What it is

Here is the problem. A chat app stores 2 billion messages a day. Writes arrive at 25,000 a second and peak at 100,000, every read is "the latest 50 messages in this channel", and the service must keep taking writes when a whole data centre goes down. A single relational primary cannot take that write rate, and [sharding](/modules/federation-sharding-denormalization) it by hand means building routing, rebalancing and failover yourself. Most of what relational databases are good at, such as joins and ad hoc queries, this workload never uses.

**<Term id="nosql">NoSQL</Term>** is the family of databases built for cases like this. They store data as keys and values, documents, wide rows, or graphs instead of tables joined by foreign keys. Data is usually [denormalized](/modules/federation-sharding-denormalization), any joins are done in application code, and most systems were built from the start to spread data across many machines. Many favour <Term id="eventual-consistency">eventual consistency</Term> over full <Term id="acid">ACID</Term> transactions, though that line has blurred: MongoDB and DynamoDB now offer multi-item transactions. <Src id="primer" /> <Src id="wiki-nosql" />

The properties of the classic NoSQL stores are often summed up as **<Term id="base">BASE</Term>**, a deliberate contrast with ACID: <Src id="primer" />

- **Basically available**: the system keeps answering, even when some nodes fail.
- **Soft state**: replicas may hold different values for a while, so the state can change without new input as replicas catch up.
- **Eventual consistency**: if writes stop, all replicas converge on the same value.

In [CAP theorem](/modules/cap-theorem) terms, BASE systems lean towards availability during a network partition. Many let you choose per request how much consistency to pay for.

## How it works

<NoSqlShapes />

### Key-value stores

The model is a hash table: `put(key, value)`, `get(key)`, `delete(key)`. The database does not look inside the value, so it can store and serve it in O(1), from memory or SSD. Some stores keep keys sorted, which lets you fetch a range of keys efficiently. Key-value stores suit simple, fast-changing data such as sessions, counters, feature flags, and the [cache](/modules/cache-strategies-and-eviction) layer in front of other databases. Anything beyond lookup by key, such as "all sessions for user 42", has to be built by the application, for example by maintaining a second key that lists them. <Src id="primer" />

Examples: Redis (in memory), Amazon DynamoDB, etcd, RocksDB (embedded).

### Document stores

A document store is a key-value store where the value is a document, usually JSON or a binary form of it, and the database understands its structure. You can query on fields inside documents (`{ "address.city": "Osaka" }`), build indexes on them, and update a single field. A document holds everything about one object, so an order with its line items and shipping address is one document read in one go, instead of three tables joined. Documents in the same collection can have different fields, which suits data whose shape changes often or varies per record, such as product catalogues with different attributes per category. <Src id="primer" />

The cost is relationships between documents. If many orders reference one customer, you either copy customer fields into each order (fast reads, updates must touch every copy) or store an id and do a second lookup, effectively a join in code.

Examples: MongoDB, Couchbase, Firestore, Amazon DocumentDB.

### Wide column stores

The model is a nested map: **row key → (column name → value)**. Columns are grouped in *column families*, the closest thing to a table. Each row can have different columns, often thousands, and each value carries a timestamp used for versioning and for resolving conflicting writes. <Src id="primer" />

In Cassandra's version, the primary key has two parts. The **<Term id="partition-key">partition key</Term>** is hashed with [consistent hashing](/modules/consistent-hashing) to decide which nodes store the row; the **clustering columns** sort rows within that partition on disk. So "all messages in channel 7, newest first" is one partition read sequentially, which is extremely fast. Bigtable and HBase keep row keys in sorted order instead, so you can scan a range of keys. <Src id="primer" />

Under the hood most wide column stores use an **<Term id="lsm-tree">LSM tree</Term>**. Writes go to an append-only commit log and an in-memory table, which is flushed to an immutable sorted file when it fills. Background *compaction* merges files. Writes never update data in place, so they are sequential and fast; a read may have to check several files, which Bloom filters keep cheap. <Src id="wiki-lsm" /> These stores are built for very large datasets, high write rates and high availability. <Src id="primer" />

The rule of data modelling is **one table per query**. You list your queries first, then design a table whose partition key and sort order answer each one with a single partition read. A second query pattern usually means a second table holding the same data, written by the application at the same time.

Examples: Apache Cassandra, ScyllaDB, HBase, Google Bigtable.

### Graph databases

The model is a graph: nodes are records, edges are relationships, and both can carry properties. Each node stores direct references to its neighbours, so following a relationship costs about the same however big the graph is, unlike a join, which must search an index. That makes many-hop questions practical: friends of friends who like jazz, how a fraudulent card connects to others, which services depend on a failing one. <Src id="primer" />

Graph databases are weaker at scanning or aggregating the whole dataset and are harder to spread across machines, because cutting a graph into shards cuts edges.

Examples: Neo4j (query language Cypher), Amazon Neptune, JanusGraph.

### Tunable consistency

Leaderless stores such as Cassandra and Dynamo-style systems keep each item on N replicas and let each request choose how many must answer. If a write waits for W replicas and a read asks R replicas, then when **R + W > N** the read set and the write set must overlap, so at least one replica in every read has the latest write. With N = 3, W = 2 and R = 2, that **<Term id="quorum">quorum</Term>** rule holds and the system tolerates one replica being down for both reads and writes. With W = 1 and R = 1, it is faster and more available but may return stale data. See [consistency patterns](/modules/consistency-patterns).

## Worked example

The chat app: **2 billion messages a day** (about 23,000/s on average, **100,000/s** at peak), each about 300 bytes. Reads are "latest 50 in a channel", about 200,000/s. Data is kept for one year. We use Cassandra with replication factor 3 across three availability zones.

**Step 1, volume.** 2 billion × 300 bytes = **600 GB a day**, about 220 TB a year, and 660 TB with three replicas before compression. At roughly 2 TB of data per node, that is around 330 nodes, or fewer with compression. This is the scale at which a wide column store pays off.

**Step 2, first schema.**

```sql
CREATE TABLE messages (
  channel_id bigint, message_id timeuuid, user_id bigint, body text,
  PRIMARY KEY ((channel_id), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```

"Latest 50" is one partition read, sorted newest first. But the biggest channel gets **5,000 messages a minute**, about 7 million a day. Its single partition grows by gigabytes each day forever, always lives on the same 3 nodes, and every compaction of it gets slower. A partition key with unbounded growth is the classic Cassandra mistake.

**Step 3, bucket the partition.** Change the key to `PRIMARY KEY ((channel_id, day), message_id)`. Each partition now holds at most one day, about 2 GB for the busiest channel and kilobytes for most. Reading the latest 50 asks today's bucket first and falls back to yesterday's if it has fewer than 50. Busy channels now spread over a new set of nodes each day. For the very largest channels, bucket by hour.

**Step 4, consistency choice.** Writes at `LOCAL_QUORUM` wait for 2 of 3 replicas, about **2 ms**; reads at `LOCAL_QUORUM` read 2 of 3. Since 2 + 2 > 3, a user always sees their own message after sending it, and the cluster survives the loss of a whole zone. Using `ONE` for both would shave about a millisecond and could show a message, then hide it on refresh, then show it again.

**Step 5, a second query.** Moderators need "all messages by user Y this week". The `messages` table cannot answer that without scanning every partition. Following one table per query, the app also writes each message to `messages_by_user`, keyed `((user_id, week), message_id)`. Writes double to 200,000/s at peak and storage doubles for that table, in exchange for a single-partition read. If the two writes can diverge, a logged batch makes both happen or neither.

## In the real world

- **Redis.** In-memory key-value store with data structures (strings, hashes, lists, sorted sets, streams). Persistence is `appendonly yes` for a log of writes, with `appendfsync everysec` (the default) risking about a second of writes on a crash, or RDB snapshots on a schedule. Redis Cluster splits keys into 16,384 hash slots.
- **Amazon DynamoDB.** Managed key-value and document store. Each item has a partition key and optional sort key; a single partition serves up to 3,000 read units and 1,000 write units a second, so a hot partition key throttles even when the table has spare capacity. Reads are eventually consistent by default; `ConsistentRead=true` costs twice as much. Global secondary indexes give extra query patterns, updated asynchronously.
- **MongoDB.** Document store with secondary indexes on any field, an aggregation pipeline, and multi-document transactions since 4.0. The write concern `w: "majority"` (the default since 5.0) waits for a majority of the replica set; read concern `"majority"` returns only majority-committed data. A single document is capped at 16 MB.
- **Apache Cassandra.** Wide column store with tunable consistency per query (`ONE`, `QUORUM`, `LOCAL_QUORUM`, `ALL`). Replication is set per keyspace, for example `NetworkTopologyStrategy` with 3 replicas per data centre. The documentation recommends keeping partitions under about 100 MB, and `compaction` strategies (size-tiered, leveled, time-window) trade write cost against read cost; time-window compaction suits time-series data with a TTL.

## Trade-offs

| Type | Great at | Weak at | Examples |
|---|---|---|---|
| Key-value | Fast lookups by key | Queries by anything else | Redis, DynamoDB |
| Document | Flexible, nested objects read together | Relationships across documents | MongoDB, Couchbase |
| Wide column | Huge, write-heavy data, reads by partition | Ad hoc queries, aggregates | Cassandra, HBase |
| Graph | Multi-hop relationship queries | Whole-dataset scans, sharding | Neo4j, Neptune |

- Most give up joins and multi-row transactions for scale, speed or flexibility, and the application takes on the work.
- You design the schema around your queries, so a new query pattern can mean a new table and a backfill.
- Tunable consistency is a feature and a trap: weaker settings are faster but let users see stale data.

## Interview tips

- Name the type, not just "NoSQL": "a wide column store like Cassandra for the message history, partitioned by channel and day".
- Justify it with the access pattern: lookup by key, a document read whole, a time range in a partition, or relationship hops.
- State the partition key and check it for unbounded growth and hot keys.
- Say how you handle what you gave up: joins in the app, duplicate tables per query, eventual consistency in the UI.

**Common mistakes:**

- Choosing a partition key that grows forever or concentrates traffic, such as `channel_id` alone for a chat app.
- Expecting ad hoc queries to work. A filter on a column that is not part of the key scans the whole cluster or is refused.
- Treating "NoSQL" as one thing and comparing it to SQL as a whole, instead of choosing a specific type for a specific access pattern.
- Using `ONE` for both reads and writes and then being surprised that users do not see their own writes.

## Common follow-up questions

### How do you do a join in a NoSQL database?

Mostly, you avoid needing one. Embed related data in the same document or partition when it is read together, duplicate fields that are read often, and keep one table per query. When you must combine data, fetch from both in application code, which is fine for small sets and expensive for big ones. If most of your queries are joins, that is a sign the data belongs in a relational database.

### What is a hot partition and how do you fix it?

One partition key that gets far more traffic than the rest, for example one celebrity's feed or today's date as a key. Because all its data lives on the same few replicas, those nodes saturate while others idle, and in DynamoDB the partition gets throttled. Fix it by adding a component to the key, such as a time bucket or a random suffix from 0 to 9, and reading all suffixes when needed, or by caching the hot item.

### Why are writes so fast in Cassandra?

Because a write is an append to the commit log plus an insert into an in-memory table, with no read and no in-place update. Sorting and merging happen later in compaction. That makes writes sequential I/O, so a node can take tens of thousands per second. The cost moves to reads, which may consult several files, and to compaction, which uses background disk and CPU.

### Can NoSQL databases do transactions?

Some, within limits. MongoDB has multi-document ACID transactions, DynamoDB has `TransactWriteItems` for up to 100 items, and Cassandra has lightweight transactions (`IF NOT EXISTS`, using Paxos) for compare-and-set on one partition, at several times the latency of a normal write. None are designed for every request to be a big transaction; if that is your workload, use SQL.

## Go deeper

- [Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf): the paper behind leaderless replication, quorums and vector clocks.
- [Bigtable: A Distributed Storage System for Structured Data (OSDI 2006)](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/): the original wide column design, with sorted row keys and SSTables.
- [Cassandra: Data modeling](https://cassandra.apache.org/doc/latest/cassandra/developing/data-modeling/index.html): the query-first method, partition sizing and denormalized tables, worked through.
- [Discord: How Discord stores trillions of messages](https://discord.com/blog/how-discord-stores-trillions-of-messages): a real chat history on Cassandra then ScyllaDB, with channel-and-bucket partitioning and hot-partition fixes.
