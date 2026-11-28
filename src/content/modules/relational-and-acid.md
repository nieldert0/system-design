---
slug: relational-and-acid
title: Relational databases, ACID and isolation levels
section: databases
upgraded: true
readFirst:
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, Relational database management system (RDBMS)
    url: https://github.com/donnemartin/system-design-primer#relational-database-management-system-rdbms
    license: CC BY 4.0
    use: reworded
  - id: wiki-iso
    title: Wikipedia, Isolation (database systems)
    url: https://en.wikipedia.org/wiki/Isolation_(database_systems)
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-wal
    title: Wikipedia, Write-ahead logging
    url: https://en.wikipedia.org/wiki/Write-ahead_logging
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
    explanation: On restart the database sees the transaction never committed and undoes the debit.
  - prompt: What does durability guarantee?
    options:
      - Queries are fast
      - Once a transaction has been committed, it stays committed, even after a crash
      - Data is replicated to three regions
      - Reads never block
    correct: 1
    explanation: The commit is only acknowledged after its log record is flushed to disk.
  - prompt: How does ACID consistency differ from CAP consistency?
    options:
      - They are the same
      - ACID consistency means a valid state (constraints hold); CAP consistency means reads see the latest write
      - ACID consistency is about replicas
      - CAP consistency is about foreign keys
    correct: 1
    explanation: Same word, two different ideas.
  - prompt: In the worked example, two buyers both read stock = 1 at read committed, then both run UPDATE ... SET stock = 0 and insert an order. What goes wrong?
    options:
      - Nothing, read committed prevents it
      - Both orders succeed and one item is sold twice (a lost update)
      - Both transactions deadlock forever
      - The second transaction sees a dirty read
    correct: 1
    explanation: Each read was of committed data, so read committed allows it. The fix is an atomic conditional update, SELECT ... FOR UPDATE, or serializable isolation.
  - prompt: A database commits 5,000 small transactions a second and each commit waits for a 1 ms disk flush. Why is it not limited to 1,000 commits/s?
    options:
      - Commits do not touch disk
      - Group commit flushes the log once for many waiting transactions
      - It skips durability for small transactions
      - Each commit uses a different disk
    correct: 1
    explanation: One fsync can make dozens of commit records durable at once, so throughput is not one-commit-per-flush.
  - prompt: You switch the inventory transaction to UPDATE items SET stock = stock - 1 WHERE id = 42 AND stock > 0 and check the affected row count. Why does this fix the overselling at read committed?
    options:
      - It disables concurrency
      - The check and the write happen in one statement under a row lock, so the second buyer re-checks after the first commits and updates 0 rows
      - It raises the isolation level automatically
      - It caches the stock value
    correct: 1
    explanation: The second UPDATE waits on the row lock, re-evaluates stock > 0 against the new value, and matches nothing.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RollbackFlow from '#lib/diagrams/RollbackFlow.svelte';
	import LostUpdateFlow from '#lib/diagrams/LostUpdateFlow.svelte';
</script>

A relational database stores data in tables and lets you change many rows together safely. ACID is the set of promises that makes those changes safe, and isolation levels are the dial that trades some of that safety for speed.

## What it is

Here is the problem. A money transfer is two writes: take 100 from Alice, add 100 to Bob. If the server crashes between them, 100 has vanished. If two transfers from Alice run at the same moment, both may read her balance as 150, both decide she can afford 100, and she ends up at -50. Any system where several rows must change together, under concurrent users, on machines that crash, hits these bugs.

A **relational database** (PostgreSQL, MySQL, SQL Server, Oracle) answers both. It stores data as tables of rows with a fixed set of typed columns, links tables through keys, and lets you query them with SQL, including joins across tables. Its unit of safe change is the **<Term id="transaction">transaction</Term>**: a group of statements that the database treats as one. <Src id="primer" />

Transactions come with four promises, known as **<Term id="acid">ACID</Term>**: <Src id="primer" />

- **Atomicity**: the transaction is all or nothing. Either both halves of the transfer happen, or neither does.
- **Consistency**: a transaction moves the database from one valid state to another. Rules you declared, such as `balance >= 0`, foreign keys, and unique constraints, hold before and after. This is *not* the consistency of the [CAP theorem](/modules/cap-theorem), which is about replicas returning the latest write.
- **Isolation**: transactions running at the same time do not see each other's half-finished work. In its strictest form, the result is the same as if they had run one after another.
- **Durability**: once the database says "committed", the change survives a crash or power cut.

Atomicity and durability handle crashes. Isolation handles concurrency, and it is the property with a dial on it, because full isolation is expensive.

## How it works

### Transactions and the log

You open a transaction with `BEGIN`, run reads and writes, then end with `COMMIT` (keep everything) or `ROLLBACK` (keep nothing). If any statement fails, for example a constraint is violated, you roll back and the database is as if you never started.

<RollbackFlow />

Atomicity and durability both come from the **<Term id="write-ahead-log">write-ahead log</Term>** (WAL). Before the database changes a data page, it appends a record of the change to a sequential log file. A commit is acknowledged only after the commit record is flushed to disk with `fsync`. The data pages themselves can be written later, lazily. After a crash, the database replays the log: changes from committed transactions are redone, and changes from transactions with no commit record are undone. <Src id="wiki-wal" />

Appending to a log is a sequential write, which is much faster than updating random pages, and the database can batch the flushes. If 50 transactions are waiting to commit, one flush makes all 50 durable. This is called **group commit**, and it is why a database can commit far more transactions per second than its disk can do flushes.

### Isolation levels

Full isolation, called **serializable**, means the database must prevent every interleaving that could not have happened in some one-at-a-time order. That requires either holding locks for longer or detecting conflicts and aborting transactions, and both cost throughput. So SQL defines weaker **<Term id="isolation-level">isolation levels</Term>**, each named by which anomalies it still allows: <Src id="wiki-iso" />

- **Dirty read**: you read a row another transaction wrote but has not committed. If it rolls back, you acted on data that never existed.
- **Non-repeatable read**: you read the same row twice in one transaction and get different values, because someone committed in between.
- **Phantom read**: you run the same `WHERE` query twice and get a different *set* of rows, because someone inserted or deleted a matching row.
- **Lost update**: two transactions read a value, both modify it, and the later write silently overwrites the earlier.

| Level | Prevents | Still allows |
|---|---|---|
| Read uncommitted | Almost nothing | Dirty reads |
| Read committed | Dirty reads | Non-repeatable reads, lost updates |
| Repeatable read | Non-repeatable reads | Phantoms in some databases, write skew |
| Serializable | All of the above | Nothing, but more waits and aborted transactions |

<LostUpdateFlow />

Most databases implement the middle levels with **<Term id="mvcc">MVCC</Term>** (multi-version concurrency control). A write creates a new version of the row instead of overwriting it in place, and each transaction reads from a *snapshot*: the versions that were committed when its snapshot was taken. Readers never block writers and writers never block readers. Writers still lock the rows they change, so two writers to the same row queue up. <Src id="wiki-iso" />

The standard names are loose. PostgreSQL's repeatable read is really *snapshot isolation*, which prevents phantoms but allows **write skew**: two doctors each check that "at least one other doctor is on call", both see yes, and both go off call. Each transaction changed a different row, so no write conflicted, yet the rule is broken. Only serializable catches it.

### Scaling the relational model

One relational database on one machine goes a long way, often to tens of thousands of transactions a second. Past that, the usual techniques are [replication](/modules/replication) for more reads and failover, [federation and sharding](/modules/federation-sharding-denormalization) for more writes, denormalization to avoid expensive joins, and [indexes and SQL tuning](/modules/indexes-and-sql-tuning) to make each query cheaper. <Src id="primer" /> Each of them gives up something ACID gave you for free, typically transactions that span shards.

## Worked example

A shop sells a limited sneaker drop: item 42 has **stock = 1**. Two buyers click "Buy" within 5 ms of each other. The app runs at **read committed**, which is the default in PostgreSQL, SQL Server and Oracle.

**Step 1, the naive code.** Each request runs:

```sql
BEGIN;
SELECT stock FROM items WHERE id = 42;     -- returns 1
-- app checks stock > 0, it is
UPDATE items SET stock = 0 WHERE id = 42;
INSERT INTO orders (item_id, user_id) VALUES (42, :user);
COMMIT;
```

**Step 2, the interleaving.** Buyer A's `SELECT` reads 1. Buyer B's `SELECT` reads 1 too, because A has not committed yet and B sees only committed data. A updates the row and commits. B's `UPDATE` was waiting on A's row lock; once A commits, it proceeds and sets stock to 0 again. B inserts an order and commits. Two orders, one sneaker. No anomaly that read committed promises to prevent occurred, because every read saw committed data. This is a lost update.

**Step 3, three fixes.**

- **Atomic conditional update**: `UPDATE items SET stock = stock - 1 WHERE id = 42 AND stock > 0` and check the affected row count. B's statement waits for A's lock, re-evaluates `stock > 0` against the committed value 0, and updates **0 rows**, so the app tells B it is sold out. One round trip, no extra locking. This is the best fix here.
- **Pessimistic lock**: `SELECT stock FROM items WHERE id = 42 FOR UPDATE`. B's select now waits until A commits and then reads 0. It costs a held lock for the length of the transaction.
- **Serializable isolation**: PostgreSQL detects that the two transactions conflict and aborts B with a serialization failure (SQLSTATE `40001`). The app must catch that and retry. It is the most general fix, but every transaction must be retry-safe.

**Step 4, what durability costs.** Say each order transaction does 3 writes and the disk takes **1 ms** per `fsync`. Without batching, one connection can commit at most 1,000 transactions a second. During the drop, 200 connections are committing at once. With group commit, one flush picks up every commit record waiting at that moment, say 20, so the log disk sustains roughly **20,000 commits a second** with the same 1 ms flushes. If you turned durability off (PostgreSQL's `synchronous_commit = off`), commits return before the flush and a crash could lose the last few hundred milliseconds of orders. For a sneaker shop that is a refund problem; for a bank it is unacceptable.

**Step 5, the money check.** At 2,000 orders a second on one PostgreSQL primary, the shop is well inside a single node's range, so there is no need to shard. Keep orders and inventory in the same database so this one transaction covers both. Splitting them across services would turn a 5-line transaction into a [distributed transaction](/modules/consistency-patterns) problem.

## In the real world

- **PostgreSQL.** Default isolation is read committed (`default_transaction_isolation`). Repeatable read is snapshot isolation, and serializable uses Serializable Snapshot Isolation, which aborts transactions with error `40001` that the app must retry. Durability is tuned with `synchronous_commit` (`on` by default; `off` risks losing recent commits but never corrupts data) and the WAL with `wal_level` and `commit_delay` for group commit.
- **MySQL with InnoDB.** Default isolation is **repeatable read**, not read committed, which surprises people coming from PostgreSQL. InnoDB uses MVCC plus *gap locks* on index ranges to block phantoms in locking reads. Durability is `innodb_flush_log_at_trx_commit`: `1` (default) flushes the redo log on every commit, `2` writes to the OS but flushes once a second, `0` risks a second of commits even on a MySQL crash.
- **SQL Server.** Read committed by default, using locks unless you enable `READ_COMMITTED_SNAPSHOT`, which switches it to MVCC-style row versions so readers stop blocking writers. Many teams turn that on.
- **CockroachDB and Google Spanner.** Distributed SQL databases that keep ACID across many machines. CockroachDB defaults to serializable and tells clients to retry on error `40001`. Spanner uses synchronized clocks (TrueTime) to give externally consistent transactions across regions, at the price of a few milliseconds of commit wait.

## Trade-offs

- **Strong guarantees and flexible queries.** Joins, constraints and transactions make relational databases the safe default for most business data.
- **Write scaling is hard.** One primary takes every write until you shard, and sharding gives up easy joins and cross-shard transactions.
- **Stricter isolation means more contention.** Serializable costs aborted transactions and retries; read committed is faster but leaves lost updates and write skew to you.
- **Durability costs latency.** Every commit waits for a disk flush, and with synchronous replication, for another machine too. Relaxing it buys throughput with a window of possible loss.
- **Fixed schema.** Columns and types are declared up front, which catches bad data early but makes schema changes on huge tables a planned operation.

## Interview tips

- Default to a relational database unless you have a reason not to, and say the reason (write volume beyond one node, schema-less documents, extreme scale). See [SQL or NoSQL](/modules/sql-vs-nosql).
- Point at the data that needs transactions (payments, inventory, bookings) and keep it in one database so a local transaction covers it.
- When two users can change the same row, say how you prevent lost updates: an atomic conditional update, `SELECT ... FOR UPDATE`, or an optimistic version column.
- Name the isolation level you assume. Saying "read committed, plus a conditional update for stock" shows you know where the default stops protecting you.

**Common mistakes:**

- Assuming a transaction makes read-then-write logic safe. At read committed it does not; two transactions can both pass the check.
- Confusing ACID consistency (constraints hold) with CAP consistency (the latest write is visible on every replica).
- Assuming every database has the same default isolation. MySQL InnoDB uses repeatable read, PostgreSQL uses read committed.
- Using serializable isolation without retry logic, so serialization failures turn into user-facing errors.

## Common follow-up questions

### How does the database survive a crash halfway through a transaction?

Through the write-ahead log. Every change is logged before it touches data pages, and a commit is acknowledged only once its commit record is on disk. On restart, the database replays the log: it redoes committed transactions whose pages had not been written yet and undoes changes from transactions that never committed. So the half-done transfer is rolled back and committed ones are kept.

### What is the difference between optimistic and pessimistic locking?

Pessimistic locking takes a lock before reading (`SELECT ... FOR UPDATE`), so others wait. It suits high contention, where conflicts are likely. Optimistic locking reads without locks, stores a `version` column, and updates with `WHERE id = 42 AND version = 7`. If 0 rows change, someone else won, and you re-read and retry. It suits low contention, such as users editing their own profile, because nobody waits.

### Why not always use serializable?

Because it costs throughput. Under contention, transactions wait on locks or get aborted and retried, and every code path must handle a retry. Most workloads only have a few places that need it, such as stock or seat counts, and those can be fixed with conditional updates or row locks while the rest runs at read committed.

### How do you get ACID across two databases or two services?

You mostly avoid needing it. Two-phase commit exists, but a coordinator failure can leave participants blocked holding locks. The common alternative is a **saga**: a sequence of local transactions, each with a compensating action (refund the payment if shipping fails), usually driven by a [message queue](/modules/queues-and-back-pressure). You get eventual consistency instead of atomicity.

### What is a deadlock and how is it resolved?

Two transactions each hold a lock the other needs, so neither can proceed. Databases detect the cycle and abort one victim, which gets an error and should retry. You make deadlocks rarer by always locking rows in the same order, for example by ascending id, and by keeping transactions short.

## Go deeper

- [PostgreSQL: Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html): exactly which anomalies each level allows in PostgreSQL, with examples of serialization failures.
- [MySQL: InnoDB transaction isolation levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html): how repeatable read, consistent reads and gap locks work in InnoDB.
- [A Critique of ANSI SQL Isolation Levels (Berenson et al., 1995)](https://arxiv.org/abs/cs/0701157): the paper that defined snapshot isolation and showed why the standard's level definitions are ambiguous.
- [Jepsen: Consistency models](https://jepsen.io/consistency): a map of isolation and consistency models and how they relate, from the team that tests real databases.
