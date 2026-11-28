---
slug: sql-vs-nosql
title: SQL vs NoSQL
section: databases
upgraded: true
readFirst:
  - relational-and-acid
  - nosql-types
sources:
  - id: primer
    title: The System Design Primer, SQL or NoSQL
    url: https://github.com/donnemartin/system-design-primer#sql-or-nosql
    license: CC BY 4.0
    use: reworded
  - id: fowler-polyglot
    title: Martin Fowler, Polyglot Persistence
    url: https://martinfowler.com/bliki/PolyglotPersistence.html
    license: Article, cited
    use: reworded
quiz:
  - prompt: Which is a strong reason to choose a relational database?
    options:
      - The data has no relationships and is append-only
      - You need transactions across several related records and flexible queries with joins
      - You must store petabytes of logs
      - The schema changes every day
    correct: 1
    explanation: Joins, constraints and multi-row transactions are what relational databases do best.
  - prompt: Which data is a typical fit for a key-value store?
    options:
      - Double-entry accounting ledgers
      - Session data and shopping carts looked up by one key
      - Reports that join ten tables
      - Data that needs foreign keys
    correct: 1
    explanation: Simple lookups by key, often short-lived, are what key-value stores do cheaply.
  - prompt: What does "schema-on-read" mean?
    options:
      - The database rejects writes that do not match a schema
      - The database accepts any shape and the application interprets structure when it reads
      - The schema is stored in a cache
      - Reads are slower than writes
    correct: 1
    explanation: Document stores are schema-on-read; relational tables are schema-on-write.
  - prompt: What is polyglot persistence?
    options:
      - Using one database in several languages
      - Using different databases for different data in the same system, each chosen for its access pattern
      - Replicating SQL into NoSQL for backups
      - Writing queries in several dialects
    correct: 1
    explanation: Orders in Postgres, sessions in Redis and events in Cassandra is polyglot persistence.
  - prompt: In the worked example, orders peak at 300/s, each writing 4 rows, and one PostgreSQL primary handles about 5,000 writes/s. What is the right call?
    options:
      - Move orders to Cassandra because it scales better
      - Keep orders in PostgreSQL, which runs at about 24% of one node (1,200 writes/s), over 4 times headroom, and gives transactions with inventory and payments
      - Shard orders across 10 databases now
      - Put orders in Redis
    correct: 1
    explanation: Scale is not a reason when you are far below one node's limit, and the transactional needs point to SQL.
  - prompt: The clickstream in the worked example is 50,000 events/s, append-only, read by time range per user, and kept 90 days. Why is a wide column store a better fit than the main PostgreSQL database?
    options:
      - PostgreSQL cannot store events
      - The write rate is 10 times one primary's capacity, the data needs no joins or transactions, and partitioning by user and day matches the only read pattern
      - Wide column stores support more joins
      - It needs strong consistency
    correct: 1
    explanation: Every reason on the NoSQL list applies and none on the SQL list does.
  - prompt: A team keeps product data in both PostgreSQL and Elasticsearch. What is the main new risk?
    options:
      - None, more stores are always better
      - The two copies can disagree, so you need a reliable way to propagate changes, such as change data capture, and a plan for drift
      - PostgreSQL will stop working
      - Search will become strongly consistent
    correct: 1
    explanation: Every additional store is another copy to keep in sync, back up and operate.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Choosing between SQL and NoSQL is not about which is better but which fits each piece of data. A relational database gives structure, joins and transactions; a NoSQL store gives up some of that to scale out more easily or to fit a looser data shape. Most real systems use both.

## What it is

Here is the problem. You are designing an online shop and someone asks "which database?" Orders must never be half-written and must join to customers, products and payments. The clickstream is 50,000 events a second that nobody ever updates. Shopping carts are read and rewritten on every click and can be thrown away after a week. Product listings have different attributes per category. One answer for all of these will be wrong for some of them: a relational database straining under the clickstream, or a key-value store that cannot keep an order and its payment consistent.

The decision is between two families:

- **SQL**, meaning relational databases such as PostgreSQL and MySQL. Data lives in tables with a declared schema, linked by keys, queried with SQL including joins, and changed in <Term id="acid">ACID</Term> [transactions](/modules/relational-and-acid). The schema is enforced when you write, called *schema-on-write*.
- **<Term id="nosql">NoSQL</Term>**, meaning key-value, document, wide column and graph stores (see [NoSQL types](/modules/nosql-types)). Each is shaped around one access pattern, spreads across machines by design, and often accepts any shape of record, leaving structure to the application: **<Term id="schema-on-read">schema-on-read</Term>**.

The right answer is usually per dataset. Using several databases in one system, each chosen for its data, is called **<Term id="polyglot-persistence">polyglot persistence</Term>**. <Src id="fowler-polyglot" />

## How it works

### Reasons to choose SQL

<Src id="primer" />

- **Structured data with a strict schema.** The database rejects a row with a missing required field or a wrong type, so bad data is caught at the door.
- **Relational data and complex joins.** Customers, orders, line items and products relate to each other, and new questions ("revenue by category last month") can be answered with a query instead of a new table.
- **Transactions.** Several rows across several tables change together or not at all: create the order, reserve stock, record the payment.
- **Clear patterns for scaling.** [Indexes](/modules/indexes-and-sql-tuning), [replicas](/modules/replication), then [federation and sharding](/modules/federation-sharding-denormalization) are a well-trodden path.
- **Maturity.** Decades of tools, documentation, people who know it, and ORMs in every language.
- **Fast lookups by index.** A B-tree lookup on millions of rows takes a few page reads.

### Reasons to choose NoSQL

<Src id="primer" />

- **Semi-structured data or a schema that changes often.** Records of the same kind have different fields, as with product attributes per category, or the shape evolves weekly.
- **Non-relational data with no need for complex joins.** Each request reads one item or one partition.
- **Very large volumes.** Many terabytes or petabytes, more than one machine can hold, where built-in partitioning saves you building it.
- **Very high write or I/O throughput.** Hundreds of thousands of writes a second, spread over many nodes.
- **Availability across failures.** Leaderless stores keep accepting writes when nodes or a data centre fail.

Data that typically fits NoSQL: <Src id="primer" />

- Rapid ingest of clickstream and log data.
- Leaderboards and scores (a Redis sorted set does this natively).
- Temporary data, such as shopping carts and sessions.
- Very frequently accessed, "hot" lookup tables.
- Metadata and lookup tables keyed by id.

### How to decide

A useful order of questions:

1. **What are the queries?** List the reads and writes with their rates. If most reads are by one key or one partition, NoSQL fits. If they join several entities or change unpredictably, SQL fits.
2. **What must be atomic?** If one business action changes several records that must stay consistent, prefer SQL, or keep those records in one document.
3. **How big and how fast?** Compare the peak write rate and size with what one well-tuned relational primary handles, roughly thousands to tens of thousands of writes a second and a few terabytes. Far below that, scale is not a reason.
4. **How varied is the shape?** Many optional or per-record fields suggest a document store, or a JSON column in a relational database.
5. **What can the team run?** Every database is backups, upgrades, monitoring and on-call. One well-run database often beats three half-understood ones.

The line has blurred. PostgreSQL stores and indexes JSON (`jsonb`), so flexible fields no longer force a document store. MongoDB and DynamoDB offer multi-item transactions. Distributed SQL databases such as CockroachDB, Spanner and YugabyteDB scale writes horizontally while keeping SQL and transactions. So the question is less "SQL or NoSQL" and more "which guarantees and access patterns does this data need".

## Worked example

An online shop with 2 million daily users. We go through its data one dataset at a time.

**Orders, payments, inventory.** Peak is about **300 orders/s**, each a transaction writing one row to each of 4 tables, so about **1,200 writes/s**. One PostgreSQL primary handles around **5,000 writes/s**, so we are using about 24% of a node, more than 4 times headroom. The data is relational, the queries vary (support, finance, refunds), and "order created but stock not reserved" is a real bug. **Decision: PostgreSQL**, with read replicas for reporting. Scale gives no reason to move.

**Product catalogue.** 5 million products; a shoe has sizes and widths, a TV has panel type and refresh rate. That is about 2,000 different attributes overall, most products using 20. Options: a document store, or PostgreSQL with common columns plus a `jsonb` attributes column with a GIN index. Products join to orders and inventory, and the volume is small. **Decision: PostgreSQL with `jsonb`**, avoiding a second database for the core data. Full-text and faceted search go to Elasticsearch, fed from PostgreSQL by **change data capture**, a stream of row changes read from the database's log.

**Shopping carts and sessions.** Read and rewritten on every page view, about **40,000 operations/s** at peak, always by `cart:{user_id}`, expiring after 7 days of inactivity. No joins, no cross-cart transactions. **Decision: Redis** with a 7-day <Term id="ttl">TTL</Term>, or DynamoDB if carts must survive a cache failure. When a user checks out, the cart becomes an order in PostgreSQL in one transaction.

**Clickstream.** **50,000 events/s**, about 500 bytes each, so about 2 TB a day; append-only; read as "this user's events in a time range" for recommendations; kept 90 days, about **180 TB**. That is 10 times one primary's write capacity and far beyond one machine's disk, with no joins or updates. **Decision: Cassandra**, partitioned by `(user_id, day)` with a 90-day TTL, or a stream to object storage for batch analytics.

**Result.** Four stores: PostgreSQL, Elasticsearch, Redis and Cassandra. That is polyglot persistence, and each extra store is a real cost: the catalogue now exists in two places, so CDC lag means a price change can take a second or two to appear in search results. We accept that because it buys something, and we did not add a fifth store for the catalogue itself.

## In the real world

- **PostgreSQL as a flexible default.** `jsonb` columns with GIN indexes give document-like storage inside a relational database, and operators like `@>` query inside JSON. Many teams that "need NoSQL for flexible schema" find this is enough.
- **Amazon DynamoDB.** A key-value and document store whose design guidance is to model all access patterns up front, often in a single table with composite sort keys. On-demand capacity mode charges per request and scales without capacity planning, which is why it is popular for spiky workloads like carts and sessions.
- **Uber's Schemaless and Docstore.** Uber built a document-style store on top of sharded MySQL for its trip data, keeping MySQL's reliability while getting schema flexibility and horizontal scale. It shows that "NoSQL versus SQL" can be a layering choice.
- **Discord.** Moved message history from MongoDB to Cassandra in 2017 when the data outgrew memory on one replica set, then to ScyllaDB in 2022. User accounts and billing stayed in relational databases. One company, different stores per dataset.

## Trade-offs

| | SQL | NoSQL |
|---|---|---|
| Schema | Enforced on write | Flexible, enforced by the app |
| Queries | Ad hoc, joins | Designed per access pattern |
| Transactions | Multi-row, multi-table | Usually per item or partition |
| Scaling writes | Vertical, then sharding work | Horizontal by design |
| Consistency | Strong on the primary | Often eventual or tunable |

- **SQL** gives correctness and flexible queries; scaling writes past one machine takes sharding work.
- **NoSQL** scales out more easily and handles flexible data; you design around fixed queries and often give up transactions.
- **Using both** is normal, but every extra store is more to run, back up, secure and keep consistent.

## Interview tips

- Start with SQL and switch only for a stated reason: write rate past one node, data size, a key-only access pattern, or a genuinely variable shape.
- Split by data and say it in one line: "orders in PostgreSQL, sessions in Redis, events in Cassandra".
- Back the reason with a number. "300 orders/s is about 1,200 writes/s, so one Postgres primary is plenty" is more convincing than any adjective.
- Say how data moves between stores, for example CDC into search, and what lag that implies.

**Common mistakes:**

- "NoSQL because it scales", without checking that the load is beyond a single relational node. Modern relational databases go a long way with indexes, replicas and sharding.
- Choosing a NoSQL store for data that needs multi-record transactions, then rebuilding transactions badly in application code.
- Picking a document store only for schema flexibility when a `jsonb` column would do, and getting a second database to run.
- Adding a new store for every dataset, so the team operates five databases and understands none of them deeply.

## Common follow-up questions

### Can you start with SQL and move to NoSQL later?

Yes, and that is the usual path. Start with a relational database, find the dataset that outgrows it (often events, logs or feeds), and move just that one. The migration is: dual-write or stream changes to the new store, backfill history, compare results, switch reads, then stop the old writes. Moving the other way is harder, because NoSQL data often lacks the structure a relational schema needs.

### Is NoSQL faster than SQL?

Not in general. A single-key read from a well-indexed relational table and from a key-value store both take about a millisecond. NoSQL stores are faster at scale for the patterns they are designed for, because they partition across nodes and skip work like joins and constraint checks. For an ad hoc query, a relational database is usually much faster, because a NoSQL store may have to scan everything.

### How do you keep two stores consistent?

Have one source of truth and derive the others from it. Write to the primary store, then propagate changes with change data capture from its log (for example Debezium into Kafka) rather than writing to both from the app, which loses updates when one write fails. Accept and monitor the lag, and have a way to rebuild the derived store from the source.

### What about NewSQL or distributed SQL?

Databases such as Google Spanner, CockroachDB and YugabyteDB keep SQL and ACID transactions while partitioning and replicating data across nodes automatically, so writes scale horizontally. The costs are higher write latency, because each commit needs a consensus round between replicas, often a few milliseconds and more across regions, and less mature tooling than PostgreSQL or MySQL. They fit when you need both relational guarantees and more write capacity than one primary.

## Go deeper

- [Martin Fowler: Polyglot Persistence](https://martinfowler.com/bliki/PolyglotPersistence.html): the case for different stores per dataset, and its operational cost.
- [AWS: What is NoSQL?](https://aws.amazon.com/nosql/): a vendor overview of NoSQL types with use cases, useful for matching data to a store.
- [PostgreSQL: JSON types](https://www.postgresql.org/docs/current/datatype-json.html): how `jsonb` stores and indexes semi-structured data inside a relational table.
- [Discord: How Discord stores billions of messages](https://discord.com/blog/how-discord-stores-billions-of-messages): why they moved message history from MongoDB to Cassandra while other data stayed relational.
