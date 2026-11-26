---
slug: indexes-and-sql-tuning
title: Indexes and SQL tuning
section: databases
readFirst:
  - relational-and-acid
sources:
  - id: primer
    title: The System Design Primer, SQL tuning
    url: https://github.com/donnemartin/system-design-primer#sql-tuning
    license: CC BY 4.0
    use: copied
  - id: wiki-index
    title: Wikipedia, Database index
    url: https://en.wikipedia.org/wiki/Database_index
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What should you do before tuning SQL?
    options:
      - Add indexes on every column
      - Benchmark and profile to find the real bottlenecks
      - Switch to NoSQL
      - Disable transactions
    correct: 1
    explanation: Simulate load and use tools like the slow query log to find what is actually slow.
  - prompt: How are most database indexes stored?
    options:
      - As a linked list
      - As a self-balancing B-tree that keeps data sorted, with logarithmic searches
      - As a hash in the browser
      - As a CSV file
    correct: 1
    explanation: B-trees allow searches, sequential access, inserts and deletes in logarithmic time.
  - prompt: What is the cost of adding an index?
    options:
      - None
      - More space, and slower writes because the index must be updated too
      - Slower reads
      - Lost data
    correct: 1
    explanation: Indexes speed reads at the expense of storage and write speed.
  - prompt: Which column type should store currency?
    options:
      - FLOAT
      - DECIMAL
      - TEXT
      - BLOB
    correct: 1
    explanation: DECIMAL avoids floating point representation errors.
  - prompt: You have an index on (country, city). Which query can use it well?
    options:
      - WHERE city = 'Paris'
      - WHERE country = 'FR' AND city = 'Paris'
      - WHERE name = 'Ana'
      - ORDER BY created_at
    correct: 1
    explanation: A composite index is used left to right; it helps when the leading column is filtered.
  - prompt: Where should large files such as images go?
    options:
      - In a BLOB column
      - Elsewhere (e.g. object storage), storing only their location in the database
      - In a VARCHAR(255)
      - In the index
    correct: 1
    explanation: Avoid storing large BLOBs; store where to get the object instead.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Most slow databases are slow because of a few bad queries. Indexes and small schema fixes usually help far more than new hardware.

## What it is

SQL tuning is a broad topic and many books have been written as reference. It's important to **benchmark** and **profile** to simulate and uncover bottlenecks. <Src id="primer" />

- **Benchmark** - Simulate high-load situations with tools such as ab.
- **Profile** - Enable tools such as the slow query log to help track performance issues.

An **<Term id="index">index</Term>** is an extra data structure that lets the database find rows without scanning the whole table, like the index at the back of a book. <Src id="wiki-index" />

## How it works

**Use good indices.** <Src id="primer" />

- Columns that you are querying (`SELECT`, `GROUP BY`, `ORDER BY`, `JOIN`) could be faster with indices.
- Indices are usually represented as self-balancing B-tree that keeps data sorted and allows searches, sequential access, insertions, and deletions in logarithmic time.
- Placing an index can keep the data in memory, requiring more space.
- Writes could also be slower since the index also needs to be updated.
- When loading large amounts of data, it might be faster to disable indices, load the data, then rebuild the indices.

A **composite index** on several columns, such as `(country, city)`, is sorted by the first column, then the second. It helps queries that filter on the leading columns, but not one that filters only on `city`. Use `EXPLAIN` to see whether a query uses an index or scans the table. <Src id="wiki-index" />

**Tighten up the schema.** <Src id="primer" />

- Use `CHAR` instead of `VARCHAR` for fixed-length fields.
- Use `TEXT` for large blocks of text such as blog posts.
- Use `INT` for larger numbers up to 2^32 or 4 billion.
- Use `DECIMAL` for currency to avoid floating point representation errors.
- Avoid storing large `BLOBS`, store the location of where to get the object instead.
- Set the `NOT NULL` constraint where applicable to improve search performance.

**Other fixes.** Denormalize where performance demands it, to avoid expensive joins. Break up a table by putting hot spots in a separate table to help keep it in memory. In some cases, the query <Term id="cache">cache</Term> could lead to performance issues. <Src id="primer" />

## Trade-offs

- **Indexes speed reads and slow writes.** Index what you query, not everything.
- **Every index uses memory and disk.** On write-heavy tables, a few targeted indexes beat many.
- **Schema tweaks are cheap early, costly later** on big tables, where migrations lock or take hours.

## Interview tips

- When a read path is slow, first say which index serves it, including column order.
- Mention `EXPLAIN` and the slow query log to show you'd measure before changing things.
- Keep large blobs out of the database; store a pointer to <Term id="object-storage">object storage</Term>.
