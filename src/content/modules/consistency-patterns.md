---
slug: consistency-patterns
title: Consistency patterns
section: availability
readFirst:
  - cap-theorem
sources:
  - id: primer
    title: The System Design Primer, Consistency patterns
    url: https://github.com/donnemartin/system-design-primer#consistency-patterns
    license: CC BY 4.0
    use: reworded
  - id: wiki-ec
    title: Wikipedia, Eventual consistency
    url: https://en.wikipedia.org/wiki/Eventual_consistency
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-models
    title: Wikipedia, Consistency model
    url: https://en.wikipedia.org/wiki/Consistency_model
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is weak consistency?
    options:
      - After a write, reads will see it
      - After a write, reads may or may not see it, and there is no promise they ever will
      - After a write, reads will eventually see it
      - Writes are rejected
    correct: 1
    explanation: Best effort, as in a memcached entry that may be evicted or a phone call that drops audio.
  - prompt: What does eventual consistency promise?
    options:
      - Reads see writes immediately
      - If writes stop, every replica converges to the same value, usually within milliseconds to seconds
      - Nothing at all
      - Writes are synchronous
    correct: 1
    explanation: Data is replicated asynchronously, so there is a window of staleness, but it closes.
  - prompt: How is strong consistency usually achieved?
    options:
      - By replicating synchronously or reading from a majority or the leader
      - By using UDP
      - By caching everything
      - By skipping replication
    correct: 0
    explanation: The write is not acknowledged until enough replicas have it, or reads are routed to where the latest value is guaranteed to be.
  - prompt: A user edits their profile and the page reloads showing the old name. Which guarantee would fix this for that user?
    options:
      - Read-your-writes
      - Weak consistency
      - Availability
      - Partition tolerance
    correct: 0
    explanation: Read-your-writes ensures a user always sees their own updates, for example by reading from the primary right after a write.
  - prompt: In the worked example, replicas lag the primary by 200 ms on average and the profile page reloads 80 ms after the save. Roughly what share of reloads show the old name if reads go to a random replica?
    options:
      - None, 80 ms is fast
      - Almost all of them, because the reload arrives before the typical replica has applied the write
      - Exactly half
      - Only reloads during a partition
    correct: 1
    explanation: The read lands inside the lag window, so the replica usually still holds the old row. Routing that user's reads to the primary for a few seconds fixes it.
  - prompt: In the same example, the team pins a user's reads to the primary for 5 seconds after any write. Writes are 200/s and each user reads 10 times in that window. How many extra reads/s land on the primary?
    options:
      - 200
      - About 2,000
      - 20,000
      - 0
    correct: 1
    explanation: 200 writers/s × 10 reads each over the window = about 2,000 reads/s moved to the primary, a small fraction of the 50,000 total.
  - prompt: A user refreshes a comment thread twice. The first refresh shows a reply, the second does not. Which guarantee is being violated?
    options:
      - Read-your-writes
      - Monotonic reads
      - Linearizability of writes
      - Durability
    correct: 1
    explanation: The two reads hit replicas with different lag, so time appeared to go backwards. Sticking the user to one replica gives monotonic reads.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import ConsistencyFlow from '#lib/diagrams/ConsistencyFlow.svelte';
</script>

Once data lives in more than one place, copies can disagree for a while. Consistency patterns describe how long they can disagree, and what a reader is allowed to see meanwhile.

## What it is

Here is the problem. You add two read replicas to a database so it can serve more traffic, and the replicas copy changes from the primary a fraction of a second behind it. A user changes their display name, the save succeeds, and the page reloads with the old name. Nothing is broken: the reload simply hit a replica that had not caught up yet. That delay is <Term id="replication-lag">replication lag</Term>, and every system with more than one copy of data has to decide what readers see while it lasts.

A **consistency model** is that decision, written as a promise to clients. The [CAP theorem](/modules/cap-theorem) defines the strongest version, "every read receives the most recent write or an error". Most real features do not need that, and paying for it everywhere would make the system slower and less available. So systems offer a ladder of weaker promises and let each feature choose. <Src id="primer" /> <Src id="wiki-models" />

The three classic rungs are:

- **Weak consistency**: after a write, a read may or may not see it, and nothing promises it ever will.
- **<Term id="eventual-consistency">Eventual consistency</Term>**: after a write, reads may be stale for a while, but if writes stop, every copy converges to the same value.
- **<Term id="strong-consistency">Strong consistency</Term>**: after a write is acknowledged, every read sees it.

Between eventual and strong sit the **session guarantees**, which fix the glitches users actually notice at a fraction of the cost. They are the most useful part of this module in practice.

## How it works

### Weak consistency

The system makes a best effort and moves on. A <Term id="cache">cache</Term> such as memcached is weakly consistent with the database behind it: an entry may be stale, evicted, or missing, and the cache does not try to fix that. Real-time media works the same way. If your video call drops for three seconds, you do not get those three seconds replayed when it comes back; you rejoin the live stream. That is the right choice when old data is worthless. <Src id="primer" />

### Eventual consistency

Writes are acknowledged by one node and copied to the others in the background (asynchronous <Term id="replication">replication</Term>). Reads are fast and local and the system stays up during failures, but a read can return an older value until the copy arrives. In a healthy system the window is milliseconds; under heavy load or a [network partition](/modules/cap-theorem), it can be seconds or minutes. <Term id="dns">DNS</Term> is the textbook example: change a record and resolvers around the world pick it up as their cached copies expire. Email, social feeds, and like counters are others. <Src id="primer" /> <Src id="wiki-ec" />

"Eventually" makes no promise about the order or the duration, which is why the session guarantees below exist.

### Strong consistency

The system behaves as if there were only one copy. In its strictest form, <Term id="linearizability">linearizability</Term>, once any client has seen a value, no later read by anyone returns an older one. It is built one of two ways: the write is not acknowledged until enough replicas have stored it (synchronous replication, or a majority <Term id="quorum">quorum</Term>), or every read is routed to the one node guaranteed to have the latest value (the leader). Either way, writes or reads pay extra network round trips, and when the required replicas cannot be reached the operation fails rather than return stale data. Relational databases used for bank ledgers, inventory, and unique constraints work this way. <Src id="primer" />

<ConsistencyFlow />

### Session guarantees: the useful middle

These are promises about what one user (one session) sees, not the whole world. <Src id="wiki-models" />

- **<Term id="read-your-writes">Read-your-writes</Term>**: a user always sees their own updates. Fixes the "I saved my name and it reverted" bug.
- **Monotonic reads**: a user never sees data go backwards. If they saw a reply to their comment once, a refresh will not make it vanish.
- **Consistent prefix**: readers see writes in the order they happened, so an answer never appears before its question.
- **Causal consistency**: if one write could have caused another (you read a post, then reply to it), everyone sees them in that order. Unrelated writes can appear in any order. It combines the three above and is the strongest model that can stay available during a partition.

All of these are cheap compared with linearizability, because they only constrain where one session's reads go, not how every replica agrees.

## Worked example

A social app stores profiles in PostgreSQL with **one primary and four asynchronous replicas**. It serves **50,000 reads/s** and **200 writes/s**. Reads are spread over the replicas; writes go to the primary. Measured replication lag is **200 ms on average**, with a 99th <Term id="percentile">percentile</Term> of **2 s** during traffic spikes.

**Step 1, the bug.** Alice changes her name from "Al" to "Alice". The write commits on the primary at t = 0. Her browser reloads the profile at t = 80 ms, and the read goes to a random replica. With an average lag of 200 ms, most replicas will not have applied the change at 80 ms, so most of these reloads show "Al". To Alice, the save looks broken. This is what eventual consistency looks like from the user's side.

**Step 2, fix it with strong consistency everywhere.** Send all 50,000 reads/s to the primary. The bug disappears, but the primary was sized for writes plus a share of reads, and now carries everything. The four replicas become pointless. This is the expensive, wrong fix.

**Step 3, fix it with read-your-writes.** After any write, the app stores a "last wrote at" timestamp in the user's session and routes that user's reads to the primary for the next **5 seconds** (comfortably above the 2 s p99 lag). Load on the primary: 200 writers a second, each making about 10 reads in their 5-second window, is **about 2,000 reads/s**, or 4% of total reads. The other 48,000 reads/s stay on replicas. Alice sees her new name immediately. Bob, viewing her profile from another session, may see "Al" for a few hundred milliseconds, which nobody will notice.

A sharper version avoids the timer: the primary returns the write's position in its log (in PostgreSQL, the LSN), the app keeps it in the session, and a replica only serves that session once it has replayed past that position.

**Step 4, the second glitch.** Bob refreshes a comment thread twice. The first request hits replica 1 (50 ms behind) and shows Alice's new reply. The second hits replica 3 (1.5 s behind) and the reply is gone. That is a violation of monotonic reads. Fix: pin each session to one replica by hashing the user id, and only move it if that replica fails. No extra load anywhere.

**Step 5, where strong consistency really is needed.** Usernames must be unique. Two people try to claim "alice" 100 ms apart. If the check "does this name exist?" reads a lagging replica, both checks pass and both inserts are attempted. Here the check and the insert must happen on the primary inside one <Term id="transaction">transaction</Term> with a unique index, so the second insert fails cleanly. One feature, one model.

## In the real world

- **PostgreSQL.** Replication is asynchronous by default. `synchronous_standby_names` lists replicas that must confirm a commit, and `synchronous_commit` sets how far they must get: `remote_write`, `on` (flushed to disk), or `remote_apply` (visible to reads on the replica, which gives read-your-writes from that replica). `pg_current_wal_lsn()` on the primary and `pg_last_wal_replay_lsn()` on a replica are what apps compare to route sessions.
- **Amazon DynamoDB.** `GetItem` and `Query` are eventually consistent by default and strongly consistent with `ConsistentRead: true`, which costs twice the read capacity units and is not available on global secondary indexes.
- **MongoDB.** `writeConcern: { w: "majority" }` waits for a majority of replica-set members; `readConcern: "majority"` only returns data a majority has acknowledged, so it cannot be rolled back. Causally consistent sessions give read-your-writes and monotonic reads when the client reads from secondaries.
- **Apache Cassandra.** Per-query consistency levels (`ONE`, `QUORUM`, `LOCAL_QUORUM`, `ALL`). Writing and reading at `QUORUM` with a replication factor of 3 (2 + 2 is greater than 3) gives strong reads; `ONE` and `ONE` gives eventual consistency at the lowest latency.

## Trade-offs

| | Weak | Eventual | Session guarantees | Strong |
|---|---|---|---|---|
| Read sees latest write | Maybe never | Soon | Own writes, in order | Always |
| Write <Term id="latency">latency</Term> | Lowest | Low | Low | Highest (waits for replicas) |
| Availability under failure | High | High | High | Lower |
| Typical use | Live media, caches | DNS, feeds, likes | Profiles, comments, carts | Payments, inventory, unique names |

- **Freshness against latency.** Every step up the ladder adds a round trip somewhere: to a majority, to the leader, or to a replica that must catch up first.
- **Freshness against availability.** Strong reads fail when the replicas they need are unreachable; eventual reads keep working.
- **Simplicity against cost.** "Everything strong" is easy to reason about but wastes replicas and caps throughput. Per-feature choices cost some design effort and save a lot of hardware.

## Interview tips

- Name the level per feature, not for the whole system: "profile edits use read-your-writes; the follower count is eventual; username claims are strongly consistent."
- For eventual consistency, quote how stale is acceptable ("a few seconds") and how the user avoids seeing it (read-your-writes, sticky replicas).
- Link strong consistency to synchronous replication or quorum reads, and say what it costs in latency.
- Bring up replication lag with a number. It shows you know this is a measurable property, not an abstract one.

**Common mistakes:**

- Routing all reads to the primary to "fix" stale reads, which throws away the replicas instead of fixing the one user who noticed.
- Doing a uniqueness check on a replica and the insert on the primary. The check is stale, so duplicates slip through; it needs a unique constraint on the primary.
- Assuming eventual means "within milliseconds". Under load or a partition, lag can reach seconds or minutes, so design for the p99, not the average.
- Load-balancing a user's reads across replicas at random, which breaks monotonic reads for free.

## Common follow-up questions

### How do you implement read-your-writes without sending everything to the primary?

Track the user's last write in their session, either as a timestamp or, better, as the write's log position. Route that user's reads to the primary, or to any replica that has replayed past that position, until the replicas have caught up. Everyone else keeps reading from replicas.

### What is the difference between strong consistency and linearizability?

People use "strong consistency" loosely for any model where reads see acknowledged writes. Linearizability is the precise version: operations appear to happen at a single instant between their start and finish, in an order consistent with real time across all clients. Serializability, from database [transactions](/modules/relational-and-acid), is a different guarantee about groups of operations; a database can offer one without the other.

### How do eventually consistent systems handle two conflicting writes?

They detect and resolve them. Last-write-wins keeps the version with the later timestamp, which is simple but silently drops the other write and depends on clocks. Version vectors (a counter per replica attached to each value) detect that two versions are concurrent so the application can merge them, as Dynamo did with shopping carts. CRDTs are data types, such as counters and sets, whose merges are mathematically guaranteed to converge.

### How stale can an eventually consistent read actually be?

Measure it. Replicas expose their lag (in PostgreSQL, compare log positions; in MySQL, `Seconds_Behind_Source`), and you can alert on the p99. Healthy single-region replicas usually lag milliseconds; cross-region replicas lag at least the one-way network delay, around 30 to 100 ms; a replica under heavy load or recovering from an outage can be minutes behind.

### Does a cache in front of the database change the consistency model?

Yes, it makes it weaker unless you manage it. A cached value is a replica with its own lag, bounded only by its <Term id="ttl">TTL</Term> and by how reliably writes invalidate it. See [cache strategies](/modules/cache-strategies-and-eviction) for delete-on-write and the races it avoids.

## Go deeper

- [Jepsen: consistency models](https://jepsen.io/consistency): a clickable map of every model from linearizable down to read-uncommitted, and which ones can stay available.
- [Eventually Consistent - Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html): Amazon's CTO Werner Vogels on read-your-writes, monotonic reads, and the N, W, R quorum knobs.
- [Replicated Data Consistency Explained Through Baseball](https://www.microsoft.com/en-us/research/publication/replicated-data-consistency-explained-through-baseball/): Doug Terry's short paper showing which consistency each role at a ball game actually needs.
- [Cassandra: Dynamo architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html): how tunable consistency, hinted handoff, and read repair work in a production system.
