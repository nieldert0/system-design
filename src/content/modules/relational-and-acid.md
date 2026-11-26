---
slug: relational-and-acid
title: Relational databases, ACID and isolation levels
section: databases
readFirst:
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, Relational database management system (RDBMS)
    url: https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms
    license: CC BY 4.0
    use: copied
  - id: wiki-iso
    title: Wikipedia, Isolation (database systems)
    url: https://en.wikipedia.org/wiki/Isolation_(database_systems)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does atomicity mean?
    options:
      - Each row is small
      - Each transaction is all or nothing
      - Transactions run one at a time
      - Data is stored on one disk
    correct: 1
    explanation: If any part of a transaction fails, none of it is applied.
  - prompt: A transfer debits one account and the server crashes before crediting the other. Which property prevents money disappearing?
    options:
      - Durability
      - Atomicity
      - Isolation
      - Availability
    correct: 1
    explanation: Atomicity rolls back the half-done transaction.
  - prompt: What does durability guarantee?
    options:
      - Queries are fast
      - Once a transaction has been committed, it will remain so, even after a crash
      - Data is replicated to three regions
      - Reads never block
    correct: 1
    explanation: Committed data survives crashes, usually via a write-ahead log.
  - prompt: What does isolation mean?
    options:
      - Each table is on its own server
      - Concurrent transactions give the same results as if run one after another
      - Users cannot see each other's data
      - The database has no network access
    correct: 1
    explanation: Weaker isolation levels relax this for speed and allow some anomalies.
  - prompt: How does ACID consistency differ from CAP consistency?
    options:
      - They are the same
      - ACID consistency means a valid state (constraints hold); CAP consistency means reads see the latest write
      - ACID consistency is about replicas
      - CAP consistency is about foreign keys
    correct: 1
    explanation: Same word, two different ideas.
  - prompt: Which is a technique to scale a relational database?
    options:
      - Removing all indexes
      - Replication, federation, sharding, denormalization and SQL tuning
      - Switching to UDP
      - Disabling transactions
    correct: 1
    explanation: The primer lists these as the main techniques.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RollbackFlow from '#lib/diagrams/RollbackFlow.svelte';
	import LostUpdateFlow from '#lib/diagrams/LostUpdateFlow.svelte';
</script>

A relational database stores data in tables and lets you change many rows together safely. ACID is the set of promises that makes those changes safe.

## What it is

A relational database like SQL is a collection of data items organized in tables. <Src id="primer" />

**<Term id="acid">ACID</Term>** is a set of properties of relational database transactions. <Src id="primer" />

- **Atomicity** - Each transaction is all or nothing
- **Consistency** - Any transaction will bring the database from one valid state to another
- **Isolation** - Executing transactions concurrently has the same results as if the transactions were executed serially
- **Durability** - Once a transaction has been committed, it will remain so

## How it works

A **<Term id="transaction">transaction</Term>** groups statements: `BEGIN`, several reads and writes, then `COMMIT` (keep all) or `ROLLBACK` (keep none). The database writes changes to a log before applying them, so after a crash it can redo committed work and undo the rest.

<RollbackFlow />

Full isolation (serializable) is costly, so databases offer weaker levels that allow some anomalies in exchange for speed: <Src id="wiki-iso" />

| Level | Prevents | Still allows |
|---|---|---|
| Read uncommitted | Almost nothing | Dirty reads |
| Read committed | Dirty reads | Non-repeatable reads |
| Repeatable read | Non-repeatable reads | Phantoms (in some databases) |
| Serializable | All of the above | Nothing, but more waits and retries |

A classic anomaly at weak levels is the **lost update**: two transactions read the same value, both change it, and the second write silently overwrites the first. <Src id="wiki-iso" />

<LostUpdateFlow />

There are many techniques to scale a relational database: <Term id="replication">replication</Term>, federation, <Term id="sharding">sharding</Term>, <Term id="denormalization">denormalization</Term>, and SQL tuning. <Src id="primer" />

## Trade-offs

- **Strong guarantees and flexible queries** (joins, constraints, transactions) make relational databases the safe default.
- **Write scaling is hard.** One primary handles all writes until you shard, which gives up easy joins and cross-shard transactions.
- **Stricter isolation means more contention.** Most apps run at read committed and handle the rare anomaly explicitly.

## Interview tips

- Default to a relational database unless you have a reason not to; say what the reason is.
- Point at the data that needs transactions (payments, inventory) and keep it in one database.
- Do not confuse ACID consistency (constraints hold) with CAP consistency (latest write is visible).
