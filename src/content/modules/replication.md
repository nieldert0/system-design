---
slug: replication
title: Replication
section: databases
upgraded: true
readFirst:
  - relational-and-acid
  - availability-patterns
sources:
  - id: primer
    title: The System Design Primer, Master-slave and master-master replication
    url: https://github.com/donnemartin/system-design-primer#master-slave-replication
    license: CC BY 4.0
    use: reworded
  - id: wiki-repl
    title: Wikipedia, Replication (computing)
    url: https://en.wikipedia.org/wiki/Replication_(computing)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In primary-replica replication, which node handles writes?
    options:
      - Every replica
      - Only the primary
      - The load balancer
      - None; writes are cached
    correct: 1
    explanation: The primary takes all writes and streams them to replicas, which serve reads.
  - prompt: The primary goes offline in a primary-replica setup. What happens until a replica is promoted?
    options:
      - The system stops entirely
      - It can keep serving reads, but writes fail
      - Replicas accept writes automatically
      - Data is deleted
    correct: 1
    explanation: Replicas keep serving reads; writes wait for a new primary.
  - prompt: What is replication lag?
    options:
      - The time to promote a replica
      - The delay before a write on the primary shows up on a replica
      - The time to boot a server
      - DNS propagation
    correct: 1
    explanation: Reads from a lagging replica can return stale data.
  - prompt: What is the main downside of multi-primary replication?
    options:
      - Reads are impossible
      - Two primaries can accept conflicting writes to the same row, which must be resolved
      - It needs no load balancer
      - Only one node can fail
    correct: 1
    explanation: Conflict resolution is the price of writing in more than one place.
  - prompt: In the worked example, each node handles about 6,000 queries/s. Why does adding more replicas stop helping once writes reach 6,000/s?
    options:
      - Replicas cannot serve reads
      - Every replica must replay every write, so each one is fully busy replaying and has no capacity left for reads
      - Five replicas exceed the network limit
      - The primary stops replicating after four replicas
    correct: 1
    explanation: Replication spreads reads, never writes. Past that point you need sharding.
  - prompt: A user updates their profile and the next page load shows the old name. The app reads from async replicas with about 300 ms of lag. What is the cheapest correct fix?
    options:
      - Make all replication synchronous
      - Route that user's reads to the primary for a short window after they write (read-your-writes)
      - Remove all replicas
      - Add a CDN
    correct: 1
    explanation: Only the writer needs to see their write immediately; everyone else can tolerate a little lag.
  - prompt: An async primary acknowledged 400 writes/s and its best replica was 500 ms behind when the primary's disk failed. Roughly how many acknowledged writes are lost on failover?
    options:
      - None
      - About 200
      - About 4,000
      - All of them
    correct: 1
    explanation: 400 writes/s × 0.5 s ≈ 200 writes existed only on the dead primary.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import PromoteReplicaFlow from '#lib/diagrams/PromoteReplicaFlow.svelte';
	import AsyncReplicaFlow from '#lib/diagrams/AsyncReplicaFlow.svelte';
</script>

Replication keeps copies of the same database on several machines, so you can spread reads across them and survive losing one. The hard parts are what a reader sees while copies are behind, and what happens to writes when the main copy dies.

## What it is

Here is the problem. Your app runs on one database server. It does 18,000 reads a second, the server tops out around 6,000, and if its disk dies you lose every write since the last backup, possibly hours of orders. You need more capacity for reads, and you need a second copy of the data that is never far behind.

**<Term id="replication">Replication</Term>** solves both by copying every write from one database node to others. This site says **primary and replica**; older docs, including the Primer, say master and slave. <Src id="primer" /> There are two main layouts:

- **Primary-replica (single leader).** One primary takes every write and streams the changes to one or more replicas. Replicas apply the same changes in the same order and serve reads.
- **Primary-primary (multi-primary).** Several nodes accept writes and send their changes to each other.

A third family, **leaderless replication** (Dynamo, Cassandra), lets clients write to several replicas directly and read from several to find the newest value. It is covered in [NoSQL types](/modules/nosql-types) and [consistent hashing](/modules/consistent-hashing).

Replication copies data; it does not split it. Every replica holds everything, so replicas add read capacity and resilience but no write capacity. Splitting the data is [sharding](/modules/federation-sharding-denormalization), and the two are usually combined.

## How it works

### Primary-replica

The primary records each change in its log (in PostgreSQL the <Term id="write-ahead-log">write-ahead log</Term>, in MySQL the binary log) and replicas pull that log over a connection and replay it. Because they apply the same changes in the same order, each replica is a copy of the primary as it was a moment ago. Replicas can feed further replicas in a tree, which keeps the primary from serving dozens of connections. <Src id="primer" />

The application, or a proxy in front of the database, sends writes to the primary and spreads reads across the replicas, much like a [load balancer](/modules/load-balancers) spreads requests across web servers.

If the primary fails, reads keep working from the replicas but writes fail until a replica is promoted. **<Term id="failover">Failover</Term>** has three steps: detect the failure (usually missed <Term id="health-check">health checks</Term> for 10 to 30 seconds), pick the replica that is furthest ahead and promote it, and repoint writers at the new primary through DNS, a virtual IP, or a proxy. <Src id="primer" />

<PromoteReplicaFlow />

### Synchronous or asynchronous

The key setting is when the primary tells the client "committed".

- **Asynchronous**: the primary commits locally and acknowledges at once; replicas catch up later. Writes are fast and a slow replica never slows the primary. But replicas are behind, and if the primary dies, acknowledged writes that had not yet been shipped are lost.
- **Synchronous**: the primary waits until at least one replica confirms it has the change. A committed write is on two machines, so a single failure loses nothing. Every write pays one extra network round trip, and if the synchronous replica is down, writes stall unless another replica takes over that role.
- **Semi-synchronous**: the middle ground used in practice. Wait for *one* replica (often in another zone of the same region) and let the rest be asynchronous.

<AsyncReplicaFlow />

The gap between a write on the primary and its appearance on a replica is **<Term id="replication-lag">replication lag</Term>**. On a healthy system it is milliseconds. Under heavy writes, a long-running query on the replica, or a network blip, it can grow to seconds or minutes, and every read from that replica is that stale. <Src id="wiki-repl" />

### What lag does to readers

Lag breaks guarantees people take for granted:

- **Reading your own writes.** A user saves a comment, the page reloads from a replica that has not received it, and the comment seems gone. The fix is **<Term id="read-your-writes">read-your-writes</Term>** consistency: route a user's reads to the primary for a short window after they write, or remember the log position of their last write and only read from a replica that has reached it.
- **Monotonic reads.** Two reloads hit two replicas with different lag, and newer data appears then disappears. Pin each user to one replica (for example by hashing the user id) so they never go back in time.

These are the consistency models from [consistency patterns](/modules/consistency-patterns), applied to one database.

### Primary-primary

With two or more writable primaries, each node accepts writes and replicates them to the others. Losing one primary does not stop writes, and primaries in different regions let users write locally. The cost is **write conflicts**: if two users change the same row on two primaries at the same time, both succeed locally, and the system must later decide which wins. <Src id="primer" />

Common resolutions are last write wins by timestamp (simple, but it silently drops one write), merging (for counters or sets), or avoiding conflicts by routing every write for a given record to the same primary. So most multi-primary systems are either loosely consistent, breaking <Term id="acid">ACID</Term> guarantees across nodes, or pay higher write <Term id="latency">latency</Term> to coordinate. <Src id="primer" />

### Split brain

The most dangerous failover bug is **<Term id="split-brain">split brain</Term>**: the old primary is not dead, only cut off from the monitor, so a replica is promoted while the old primary keeps accepting writes. Now two primaries diverge. Failover tools prevent it by *fencing* the old primary (cutting its network, revoking its virtual IP, or shutting it down) before promoting, and by requiring a majority of monitors to agree that it is down.

## Worked example

A social app does **18,000 reads/s and 2,000 writes/s** at peak. One database node handles about **6,000 queries/s** in total. Replicas run asynchronously.

**Step 1, size the replica pool.** The primary takes all 2,000 writes. Every replica must also *replay* those 2,000 writes, so each replica has about 6,000 − 2,000 = 4,000 queries/s left for reads. 18,000 ÷ 4,000 = 4.5, so you need **5 replicas**, and a sixth so that losing one does not overload the rest.

**Step 2, writes grow.** A year later writes reach **6,000/s**. Each replica now spends its whole budget replaying writes and has no room for reads, and the primary is saturated too. Adding replicas does nothing, because each new replica also replays every write. Replication has hit its ceiling; the next step is sharding writes across several primaries. This is the arithmetic behind the warning that heavy writes bog down replicas. <Src id="primer" />

**Step 3, lag shows up.** A nightly report query hogs one replica and its lag grows to **300 ms**. A user changes their display name and the next page load, served from that replica, shows the old name. Fix: for 5 seconds after any write, the app sends that user's reads to the primary. If 5% of reads come from users who wrote in the last 5 seconds, that adds about 5% of 18,000 = **900 reads/s** to the primary, which needs to be budgeted. Also move the report to a dedicated replica that serves no user traffic.

**Step 4, the primary dies.** Its disk fails while it is acknowledging **400 writes/s** (a quiet hour) and the best replica is **500 ms** behind. About 400 × 0.5 = **200 acknowledged writes** existed only on the dead primary and are lost. Detection takes 15 s and promotion 10 s, so writes are down for about **25 s** while reads keep working. If losing 200 writes is unacceptable, as for payments, make one replica in another zone semi-synchronous. Each write now waits for a cross-zone round trip of about **1 to 2 ms**, and a single-node failure loses nothing.

## In the real world

- **PostgreSQL streaming replication.** Replicas stream the WAL from the primary. `synchronous_commit` and `synchronous_standby_names` choose which standbys a commit waits for, for example `ANY 1 (r1, r2)` to wait for either. `hot_standby_feedback` stops the primary removing old rows a replica's query still needs, at the cost of table bloat. Lag is visible in `pg_stat_replication`. Automatic failover is not built in; tools like Patroni provide it, using etcd or Consul to elect a leader.
- **MySQL.** Replicas read the binary log, asynchronously by default. The semi-synchronous plugin with `rpl_semi_sync_source_wait_for_replica_count` makes commits wait for N replicas. `replica_parallel_workers` applies changes on several threads, addressing the single-threaded replay bottleneck. Group Replication adds a Paxos-based mode with automatic failover.
- **Amazon Aurora.** Separates compute from storage: the storage layer keeps six copies across three availability zones and treats a write as durable once four acknowledge. Up to 15 read replicas share that storage, so replica lag is usually under 100 ms and failover typically takes around 30 seconds.
- **Redis.** Replicas copy the primary asynchronously; Redis Sentinel monitors it and starts a failover once a configured `quorum` of sentinels agree it is down. Because replication is asynchronous, failover can lose recent writes, which is fine for a cache.

## Trade-offs

| Choice | Write latency | Data loss on primary failure | Read staleness |
| --- | --- | --- | --- |
| Async primary-replica | Lowest | Up to the lag window | Up to the lag |
| Semi-sync (one replica) | + one round trip | None for a single failure | Up to the lag on async replicas |
| Fully synchronous | + slowest replica | None | None on sync replicas |
| Multi-primary | Low locally | Depends on mode | Conflicts possible |

- **Replicas scale reads, not writes.** Every replica replays every write, so write capacity stays at one node. <Src id="primer" />
- **More replicas mean more to ship and more lag,** and some databases replay on fewer threads than the primary used to write. <Src id="primer" />
- **Failover adds moving parts:** detection, fencing, promotion and client repointing all have to work under stress, on more hardware. <Src id="primer" />

## Interview tips

- For read-heavy workloads, add read replicas first; it is the simplest scale-out step. Do the arithmetic: reads per replica after subtracting replayed writes.
- Name the replication mode and what it means for data loss: "async, so we accept losing under a second of writes on failover", or "semi-sync to a second zone for payments".
- Bring up replication lag unprompted and solve read-your-writes for the user who just wrote.
- Say how failover works, including fencing to avoid split brain.

**Common mistakes:**

- Claiming replicas scale writes. They do not; each replica does the full write load.
- Assuming replicas are current, then reading your own write from one and showing the user stale data.
- Treating replication as a backup. A bad `DELETE` replicates to every copy within milliseconds; you still need point-in-time backups.
- Automatic failover without fencing, which can leave two primaries accepting writes.

## Common follow-up questions

### How do you decide which replica to promote?

The one with the most of the log applied, so the fewest writes are lost. Tools compare each replica's log position (PostgreSQL's LSN, MySQL's GTID set) and pick the highest, then repoint the others to follow it. With semi-sync, the synchronous replica is the natural choice because it is guaranteed to have every acknowledged write.

### How does replication work across regions?

Usually asynchronously, because a synchronous write across an ocean adds 70 to 150 ms. Each region gets read replicas for local reads, and writes still go to one primary region. If a region must accept writes locally, you move to multi-primary with a conflict strategy, or give each user a home region that owns their data.

### Can a replica fall so far behind that it never catches up?

Yes, if it applies writes more slowly than the primary produces them, for example because replay is single-threaded or the replica has a slower disk. Lag then grows without bound. The fixes are parallel apply, matching hardware, moving heavy queries off that replica, or rebuilding it from a fresh snapshot.

### Replication or backups?

Both, because they protect against different things. Replication protects against a machine dying and keeps you running. Backups with point-in-time recovery protect against mistakes and corruption, which replication copies faithfully. A dropped table is gone from every replica in milliseconds but is still in last night's backup plus the archived log.

## Go deeper

- [PostgreSQL: High availability, load balancing, and replication](https://www.postgresql.org/docs/current/high-availability.html): the trade-offs of each replication method and how streaming and synchronous replication are configured.
- [MySQL: Semisynchronous replication](https://dev.mysql.com/doc/refman/8.4/en/replication-semisync.html): what the primary waits for, and what happens when replicas time out.
- [Amazon Aurora design considerations (SIGMOD 2017)](https://www.amazon.science/publications/amazon-aurora-design-considerations-for-high-throughput-cloud-native-relational-databases): quorum writes to six storage copies instead of shipping whole pages to replicas.
- [GitHub: MySQL high availability at GitHub](https://github.blog/engineering/infrastructure/mysql-high-availability-at-github/): a real failover design with Orchestrator, Consul and semi-sync, including how it avoids split brain.
