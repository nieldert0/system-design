---
slug: sql-vs-nosql
title: SQL vs NoSQL
section: databases
readFirst:
  - relational-and-acid
  - nosql-types
sources:
  - id: primer
    title: The System Design Primer, SQL or NoSQL
    url: https://github.com/donnemartin/system-design-primer#sql-or-nosql
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: Which is a reason to pick SQL?
    options:
      - Storing petabytes of clickstream logs
      - Relational data that needs complex joins and transactions
      - Dynamic schema
      - Very high IOPS on simple keys
    correct: 1
    explanation: Joins, transactions and a strict schema are SQL's strengths.
  - prompt: Which is a reason to pick NoSQL?
    options:
      - Need for complex joins
      - Semi-structured data with a flexible schema at very high scale
      - Strict schema
      - Transactions across many tables
    correct: 1
    explanation: NoSQL suits flexible schemas and very data-intensive workloads.
  - prompt: Which data does the primer call well-suited for NoSQL?
    options:
      - Bank ledgers
      - Rapid ingest of clickstream and log data
      - Payroll
      - Tax records
    correct: 1
    explanation: Also leaderboards, shopping carts, hot tables and lookup tables.
  - prompt: An e-commerce site needs orders and payments to be exact. What is a sound default?
    options:
      - A graph database
      - A relational database for orders and payments
      - Only a cache
      - A key-value store with no persistence
    correct: 1
    explanation: Money needs transactions, which relational databases give you.
  - prompt: Can one system use both SQL and NoSQL?
    options:
      - No, you must choose one
      - Yes; pick per data type, e.g. SQL for orders and a key-value store for sessions
      - Only in microservices
      - Only on AWS
    correct: 1
    explanation: Using several stores, each for what it is best at, is common.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Choose the database by the shape of the data and the queries you will run. SQL is the safe default; <Term id="nosql">NoSQL</Term> wins for specific scale or flexibility needs.

## What it is

The choice is not about which is better but which fits. A relational database gives structure, joins and transactions. A NoSQL store gives up some of that to scale more easily or to fit a looser data shape. <Src id="primer" />

## How it works

Reasons for **SQL**: <Src id="primer" />

- Structured data
- Strict schema
- Relational data
- Need for complex joins
- Transactions
- Clear patterns for scaling
- More established: developers, community, code, tools, etc
- Lookups by index are very fast

Reasons for **NoSQL**: <Src id="primer" />

- Semi-structured data
- Dynamic or flexible schema
- Non-relational data
- No need for complex joins
- Store many TB (or PB) of data
- Very data intensive workload
- Very high <Term id="throughput">throughput</Term> for IOPS

Sample data well-suited for NoSQL: <Src id="primer" />

- Rapid ingest of clickstream and log data
- Leaderboard or scoring data
- Temporary data, such as a shopping cart
- Frequently accessed ('hot') tables
- Metadata/lookup tables

## Trade-offs

- **SQL** gives correctness and flexible queries; scaling writes beyond one machine takes <Term id="sharding">sharding</Term> work.
- **NoSQL** scales out more easily and handles flexible data; you design around fixed queries and often give up transactions.
- **Using both** is normal, but every extra store is more to run, back up and keep consistent.

## Interview tips

- Start with SQL and switch only for a stated reason (scale, schema flexibility, access pattern).
- Split by data: "orders in Postgres, sessions in Redis, events in Cassandra."
- Avoid "NoSQL because it scales"; modern relational databases go a long way with replicas and sharding.
