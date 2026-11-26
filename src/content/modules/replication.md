---
slug: replication
title: Replication
section: databases
readFirst:
  - relational-and-acid
  - availability-patterns
sources:
  - id: primer
    title: The System Design Primer, Master-slave and master-master replication
    url: https://github.com/donnemartin/system-design-primer#master-slave-replication
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: In primary-replica replication, which node handles writes?
    options:
      - Every replica
      - Only the primary
      - The load balancer
      - None; writes are cached
    correct: 1
    explanation: The primary serves reads and writes and copies writes to replicas, which serve only reads.
  - prompt: The primary goes offline in a primary-replica setup. What happens until a replica is promoted?
    options:
      - The system stops entirely
      - It can keep running in read-only mode
      - Replicas accept writes automatically
      - Data is deleted
    correct: 1
    explanation: Replicas keep serving reads; writes wait for a new primary.
  - prompt: What is a downside of primary-primary (multi-primary) replication?
    options:
      - Reads are impossible
      - Write conflicts must be resolved, and you either loosen consistency or add write latency
      - It needs no load balancer
      - Only one node can fail
    correct: 1
    explanation: Two writable nodes can accept conflicting writes.
  - prompt: What is replication lag?
    options:
      - The time to promote a replica
      - The delay before a write on the primary shows up on replicas
      - The time to boot a server
      - DNS propagation
    correct: 1
    explanation: Reads from a lagging replica can return stale data.
  - prompt: Why can adding many replicas hurt?
    options:
      - It cannot
      - More replicas to replicate to leads to greater replication lag, and heavy writes bog replicas down
      - Replicas cannot serve reads
      - It lowers availability
    correct: 1
    explanation: Every write is replayed on every replica.
  - prompt: How can data be lost with asynchronous replication?
    options:
      - It cannot
      - The primary fails before newly written data reaches the replicas
      - Replicas delete data
      - Reads overwrite writes
    correct: 1
    explanation: Writes acknowledged but not yet replicated die with the primary.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Replication keeps copies of the same database on several machines, so you can spread reads and survive losing one.

## What it is

**<Term id="replication">Replication</Term>** copies every write from one database node to others. There are two main layouts. This site says **primary/replica**; older docs, including the Primer, call it master/slave. <Src id="primer" />

- **Primary-replica:** one primary takes writes, replicas copy them and serve reads.
- **Primary-primary (multi-primary):** several nodes take writes and coordinate with each other.

## How it works

**Primary-replica.** The primary serves reads and writes, replicating writes to one or more replicas, which serve only reads. Replicas can also replicate to further replicas in a tree. If the primary goes offline, the system can keep running in read-only mode until a replica is promoted to primary or a new primary is provisioned. Promoting a replica needs extra logic. <Src id="primer" />

**Primary-primary.** Both primaries serve reads and writes and coordinate with each other on writes. If either goes down, the system can keep going with both reads and writes. You need a load balancer or application logic to decide where to write. Most such systems are either loosely consistent (breaking ACID) or have higher write latency because of synchronisation, and conflict resolution matters more as you add write nodes and latency grows. <Src id="primer" />

**Synchronous vs asynchronous.** With synchronous replication, the primary waits for replicas before confirming a write: no data loss, slower writes. With asynchronous replication, it confirms first: fast, but replicas lag and recent writes can be lost.

## Trade-offs

Downsides that apply to both layouts: <Src id="primer" />

- Data can be lost if the primary fails before newly written data reaches the other nodes.
- Writes are replayed on the read replicas. With many writes, replicas get bogged down replaying them and can serve fewer reads.
- The more read replicas, the more you have to replicate, which leads to greater replication lag.
- On some systems the primary writes with many threads in parallel, while replicas replay writes sequentially on one thread.
- Replication adds more hardware and additional complexity.

## Interview tips

- For read-heavy workloads, add read replicas first; it is the simplest scale-out step.
- Address replication lag: route a user's reads to the primary right after they write (read-your-writes).
- Say how fail-over works: health check, promote a replica, repoint writes.
