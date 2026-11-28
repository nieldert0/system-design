---
slug: indexes-and-sql-tuning
title: Indexes and SQL tuning
section: databases
upgraded: true
readFirst:
  - relational-and-acid
sources:
  - id: primer
    title: The System Design Primer, SQL tuning
    url: https://github.com/donnemartin/system-design-primer#sql-tuning
    license: CC BY 4.0
    use: reworded
  - id: wiki-index
    title: Wikipedia, Database index
    url: https://en.wikipedia.org/wiki/Database_index
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-btree
    title: Wikipedia, B-tree
    url: https://en.wikipedia.org/wiki/B-tree
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does an index on a column let the database avoid?
    options:
      - Writing to disk
      - Scanning every row to find matching ones
      - Using transactions
      - Replication
    correct: 1
    explanation: The index is a sorted structure the database can search in logarithmic time.
  - prompt: What is the main cost of adding an index?
    options:
      - Reads get slower
      - Every insert, update and delete must also update the index, and it uses memory and disk
      - The table can no longer be joined
      - Queries need to name the index
    correct: 1
    explanation: Indexes trade write cost and space for read speed.
  - prompt: You have an index on (country, city). Which query cannot use it efficiently?
    options:
      - WHERE country = 'JP'
      - WHERE country = 'JP' AND city = 'Osaka'
      - WHERE city = 'Osaka'
      - WHERE country = 'JP' ORDER BY city
    correct: 2
    explanation: A composite index is sorted by its first column first, so a filter on the second column alone cannot narrow the search.
  - prompt: How do you check whether a query uses an index?
    options:
      - Run it twice and compare timings
      - Run EXPLAIN (or EXPLAIN ANALYZE) and read the plan
      - Look at the table size
      - Restart the database
    correct: 1
    explanation: The plan shows an index scan or a sequential scan, and with ANALYZE, real row counts and times.
  - prompt: In the worked example, the orders table has 50 million rows and a full scan reads about 8 GB. With a B-tree on (user_id, created_at), roughly how many pages does fetching one user's latest 20 orders read?
    options:
      - About 1 million
      - A handful, roughly 4 index pages plus up to 20 table pages
      - Exactly 1
      - 50 million
    correct: 1
    explanation: A B-tree with fan-out in the hundreds is 3 to 4 levels deep for 50 million rows, then the 20 matching entries are adjacent.
  - prompt: After adding the index, the query is fast but EXPLAIN shows it still visits 20 table rows. What makes it skip the table entirely?
    options:
      - Adding another index on created_at
      - A covering index that also includes the selected columns (status, total), so the index alone answers the query
      - Raising the isolation level
      - Using SELECT *
    correct: 1
    explanation: When every column the query needs is in the index, the database can do an index-only scan.
  - prompt: The table takes 3,000 inserts/s and already has 9 indexes. Why might dropping 4 unused ones speed up writes noticeably?
    options:
      - It will not; indexes only affect reads
      - Each insert updates every index, so 10 B-tree writes per row become 6, cutting write I/O by about 40%
      - Fewer indexes means fewer locks on reads
      - It frees the query cache
    correct: 1
    explanation: Write amplification grows with the number of indexes. Unused indexes are pure cost.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import BTreeFlow from '#lib/diagrams/BTreeFlow.svelte';
</script>

Indexes let a database find rows without reading the whole table, and SQL tuning is the habit of measuring which queries are slow and why. Together they are usually the cheapest way to make a database faster, long before you need more machines.

## What it is

Here is the problem. Your `orders` table has 50 million rows. The "My orders" page runs `SELECT ... WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20`. With no index, the database has no way to know where user 42's rows are, so it reads every row, all 8 GB, checks each one, sorts the matches, and returns 20. That takes seconds, and while it runs it pushes useful data out of memory. At 200 page views a second, the database falls over. More servers would not help much; the query is doing a million times more work than it needs.

An **<Term id="index">index</Term>** is an extra data structure, kept in sync with the table, that stores a column's values in sorted order with a pointer to each row. Like the index at the back of a book, it lets the database jump straight to the matching entries instead of reading every page. <Src id="wiki-index" />

**SQL tuning** is the wider practice of making queries cheaper: choosing the right indexes, fixing queries that defeat them, and tightening the schema. It starts with measurement, because intuition about what is slow is often wrong. <Src id="primer" />

- **Benchmark**: simulate high load with tools such as `ab`, `wrk` or `pgbench` to see where performance breaks. <Src id="primer" />
- **Profile**: turn on the database's slow query log or query statistics to see which real queries cost the most time in total. <Src id="primer" />

## How it works

### B-tree indexes

Most indexes are a **<Term id="b-tree">B-tree</Term>**, a tree that stays balanced as rows are added and keeps keys in sorted order. Each node is one disk page (8 KB in PostgreSQL, 16 KB in MySQL InnoDB) and holds hundreds of keys, so the tree is very wide and very shallow. Finding a key means reading one page per level, from the root down to a leaf. Leaves are linked in order, so after finding the first match the database can read neighbouring entries for a range or an `ORDER BY` without searching again. Search, insert and delete all take logarithmic time. <Src id="wiki-btree" /> <Src id="primer" />

<BTreeFlow />

The fan-out is what makes it fast. With about 300 keys per page, 3 levels cover 300³ = 27 million entries and 4 levels cover 8 billion. The top levels are small and hot, so they stay in memory, and a lookup typically costs one or two actual disk reads.

### What to index

Index the columns that queries filter, join, group and sort on: columns in `WHERE`, `JOIN ... ON`, `GROUP BY` and `ORDER BY`. <Src id="primer" /> Three ideas cover most cases:

- **<Term id="composite-index">Composite indexes</Term>** span several columns, such as `(user_id, created_at)`. Entries are sorted by the first column, then by the second within each value of the first. So the index serves `WHERE user_id = ?`, and `WHERE user_id = ? ORDER BY created_at`, but not `WHERE created_at > ?` on its own, just as a phone book sorted by surname then first name cannot find everyone called Ana. Put the equality columns first, then the range or sort column.
- **<Term id="covering-index">Covering indexes</Term>** also store the columns the query selects, for example `(user_id, created_at) INCLUDE (status, total)`. The database answers from the index alone, an *index-only scan*, and never touches the table.
- **Selectivity.** An index helps when it narrows the search to a small share of rows. An index on `status` with three values, where 90% of rows are `'shipped'`, rarely helps for `status = 'shipped'`; scanning is cheaper than jumping to 90% of rows one by one.

Some query patterns stop an index being used even when one exists: wrapping the column in a function (`WHERE LOWER(email) = ?` with an index on `email`), a leading wildcard (`LIKE '%son'`), or comparing a column with a value of a different type. The fix is to rewrite the query or index the expression itself.

### What indexes cost

Every index is a copy of some columns, so it uses disk and, to be fast, memory. <Src id="primer" /> Every `INSERT`, `UPDATE` of an indexed column, and `DELETE` must update every index on the table, so writes get slower as indexes pile up. <Src id="primer" /> When bulk-loading a large table, it is often faster to drop indexes, load, and rebuild them once. <Src id="primer" />

### Reading a query plan

The **<Term id="query-planner">query planner</Term>** decides how to run each query: which index to use, in which order to join tables, whether to sort or read an index already in order. It decides using statistics about each table, such as row counts and how values are distributed. `EXPLAIN` shows the plan it chose and `EXPLAIN ANALYZE` also runs the query and shows real times and row counts. The words to look for are *Seq Scan* or *type: ALL* (reading the whole table), *Index Scan* (using an index), *Index Only Scan* (covering index), and a big gap between estimated and actual rows, which means the statistics are stale and the planner is guessing.

### Tightening the schema

Smaller rows mean more rows per page and more of the table in memory. <Src id="primer" />

- Use the smallest type that fits: `INT` (4 bytes, up to about 2 billion signed) rather than `BIGINT` where values stay small, and `BIGINT` for ids that will grow past that.
- Use `DECIMAL` for money, never floating point, which cannot represent 0.10 exactly.
- Use `TEXT` for long text such as blog posts, and fixed-width `CHAR` only for truly fixed-length codes. (In PostgreSQL, `CHAR` has no speed advantage over `VARCHAR`.)
- Keep large binary objects out of the table; store them in [object storage](/modules/object-storage) and keep the URL.
- Declare `NOT NULL` where a value is required; it documents intent and lets the planner make better choices.

Beyond indexes, the other tuning levers are [denormalization](/modules/federation-sharding-denormalization) to avoid expensive joins, moving hot columns into a separate small table so it stays in memory, and caching results in front of the database. <Src id="primer" />

## Worked example

The `orders` table: **50 million rows**, about 160 bytes each, so **8 GB** on disk. The server has 16 GB of RAM, with the database's buffer cache using 4 GB. The "My orders" query runs **200 times a second**:

```sql
SELECT id, status, total, created_at
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 20;
```

**Step 1, measure.** The slow query log (or `pg_stat_statements`) shows this query at an average of **2.1 s**, and 200/s × 2.1 s means it alone would need 420 seconds of database time every second. `EXPLAIN ANALYZE` shows `Seq Scan on orders`, rows removed by filter: 49,999,950. The table does not fit in the 4 GB cache, so every scan reads from disk and evicts other data.

**Step 2, single-column index.** `CREATE INDEX ON orders (user_id)`. The plan becomes an index scan: find user 42's entries (about 50 orders), fetch those 50 rows from the table, sort them by date, return 20. B-tree depth for 50 million entries is 4, so that is about 4 index pages plus up to 50 table pages. Time drops to **about 3 ms**, 700 times faster.

**Step 3, composite index.** A power user with 40,000 orders still takes 300 ms, because the database fetches and sorts all 40,000 to return 20. Replace the index with `(user_id, created_at)`. Now entries for user 42 are already in date order; the database walks to the newest end and reads exactly 20 entries. Time is about **1 ms** for every user, however many orders they have.

**Step 4, covering index.** The query still visits 20 table rows for `status` and `total`. `CREATE INDEX ON orders (user_id, created_at) INCLUDE (status, total)` in PostgreSQL (in MySQL, add them as trailing key columns) gives an index-only scan, about **0.3 ms**. The index is roughly 2.5 GB, which fits in cache alongside the hot part of the table.

**Step 5, the write bill.** The table takes **3,000 inserts/s** and has accumulated **9 indexes** over the years, so each insert does 1 table write plus 9 index writes. Index usage statistics (`pg_stat_user_indexes.idx_scan = 0`) show 4 indexes have not been used in a month. Dropping them takes each insert from 10 page writes to 6, about **40% less write I/O**, and frees around 6 GB of disk and cache.

The database went from collapsing to idle without new hardware. Only after this kind of tuning does it make sense to reach for [replication](/modules/replication) or a [cache](/modules/cache-strategies-and-eviction).

## In the real world

- **PostgreSQL.** Default index type is B-tree; others are GIN (for arrays, JSONB and full-text search), GiST (geometric and range data), BRIN (tiny indexes for huge, naturally ordered tables such as logs), and hash. `CREATE INDEX CONCURRENTLY` builds without blocking writes. `pg_stat_statements` ranks queries by total time, and `log_min_duration_statement` (off by default, `-1`) logs any query slower than the given milliseconds. `ANALYZE` refreshes planner statistics; autovacuum runs it automatically.
- **MySQL InnoDB.** Tables are stored *as* a B-tree ordered by the primary key (a clustered index), and every secondary index stores the primary key as its row pointer. That makes a short primary key important, since it is copied into every index. The slow query log is enabled with `slow_query_log = ON` and `long_query_time` (default 10 seconds, usually lowered to around 1). The old query cache the Primer warns about was removed in MySQL 8.0.
- **SQL Server.** Has clustered and nonclustered indexes, and `INCLUDE` columns for covering indexes. Its missing-index views (`sys.dm_db_missing_index_details`) suggest indexes from real workload, and Query Store keeps plan history so you can spot a plan that suddenly got worse.
- **Amazon RDS Performance Insights.** Shows database load broken down by query and wait type, a hosted version of the profiling step, on RDS and Aurora for PostgreSQL and MySQL.

## Trade-offs

- **Indexes speed reads and slow writes.** Index what you query, not everything.
- **Every index uses memory and disk.** On write-heavy tables, a few well-chosen composite indexes beat many single-column ones.
- **Column order matters.** One composite index can serve several queries if its leading columns match them; the wrong order serves none.
- **Schema changes are cheap early and costly later.** On big tables, adding a column or index can lock or take hours unless done online.

## Interview tips

- When a read path is slow, say which index serves it, including the column order, and why.
- Mention `EXPLAIN` and the slow query log to show you measure before you change things.
- Estimate with B-tree depth: millions of rows means 3 to 4 page reads per lookup, which is why indexed lookups are milliseconds.
- Keep large blobs out of the database; store a pointer to object storage.

**Common mistakes:**

- Putting the range column first in a composite index, `(created_at, user_id)`, so the equality filter on `user_id` cannot narrow the search.
- Indexing every column "just in case", which multiplies write cost and memory use.
- Wrapping an indexed column in a function, such as `WHERE DATE(created_at) = ...`, which stops the index being used.
- Indexing a low-selectivity column like a boolean and expecting it to help.

## Common follow-up questions

### Why not index every column?

Because each index is paid for on every write and in memory. Ten indexes mean ten extra structures to update per insert, and indexes that do not fit in memory make both reads and writes hit disk. Index for the queries you actually run, prefer composite indexes that serve several of them, and drop indexes the statistics show are unused.

### When does the database ignore an index you created?

When it estimates a scan is cheaper, which is true when the filter matches a large share of rows, when the table is tiny, or when statistics are stale and the estimate is wrong. It also cannot use it when the query wraps the column in a function, casts it, or uses a leading wildcard. `EXPLAIN ANALYZE` shows which case you are in.

### B-tree or hash index?

A hash index answers only equality (`=`), but a B-tree answers equality, ranges, prefixes and sorted order, at nearly the same lookup cost. So B-tree is almost always the right default. Hash structures shine in key-value stores, where every lookup is by exact key.

### How do LSM trees differ from B-trees?

An LSM tree (used by Cassandra, RocksDB and others) buffers writes in memory and flushes them as sorted files, merging files in the background. Writes are sequential and very fast, but a read may check several files, helped by Bloom filters. B-trees update pages in place, giving steadier reads at the cost of slower random writes. See [NoSQL types](/modules/nosql-types).

### How do you add an index to a huge table in production?

Build it online so writes keep flowing: `CREATE INDEX CONCURRENTLY` in PostgreSQL, `ALGORITHM=INPLACE, LOCK=NONE` in MySQL, or a tool like gh-ost or pt-online-schema-change. Do it at low traffic, watch replication lag, because replicas build the index too, and check the plan afterwards.

## Go deeper

- [Use The Index, Luke](https://use-the-index-luke.com/): a free, practical book on SQL indexing for developers, covering composite indexes, ordering and index-only scans across databases.
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html): how to read a plan, with costs, rows and the ANALYZE output explained.
- [PostgreSQL: Index types](https://www.postgresql.org/docs/current/indexes-types.html): when to use B-tree, hash, GIN, GiST and BRIN.
- [MySQL: The slow query log](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html): enabling it, the thresholds, and summarising it with mysqldumpslow.
