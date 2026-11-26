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
    use: copied
  - id: wiki-ec
    title: Wikipedia, Eventual consistency
    url: https://en.wikipedia.org/wiki/Eventual_consistency
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is weak consistency?
    options:
      - After a write, reads will see it
      - After a write, reads may or may not see it
      - After a write, reads will eventually see it
      - Writes are rejected
    correct: 1
    explanation: Best effort, as in memcached or a phone call that drops audio.
  - prompt: What does eventual consistency promise?
    options:
      - Reads see writes immediately
      - After a write, reads will eventually see it, typically within milliseconds
      - Nothing at all
      - Writes are synchronous
    correct: 1
    explanation: Data is replicated asynchronously, so there is a short window of staleness.
  - prompt: Which system is a classic example of eventual consistency?
    options:
      - A bank ledger in an RDBMS
      - DNS
      - A local file system
      - A CPU register
    correct: 1
    explanation: DNS changes propagate over time through caches.
  - prompt: How is strong consistency usually achieved?
    options:
      - By replicating data synchronously
      - By using UDP
      - By caching everything
      - By skipping replication
    correct: 0
    explanation: Synchronous replication means the write is not done until replicas have it.
  - prompt: A user edits their profile and the page reloads showing the old name. Which guarantee would fix this for that user?
    options:
      - Read-your-writes
      - Weak consistency
      - Availability
      - Partition tolerance
    correct: 0
    explanation: Read-your-writes ensures a user always sees their own updates, e.g. by reading from the primary right after a write.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Once data lives in more than one place, copies can disagree for a while. Consistency patterns describe how long, and what readers see meanwhile.

## What it is

With multiple copies of the same data, we are faced with options on how to synchronize them so clients have a consistent view of the data. Recall the definition of consistency from the CAP theorem - Every read receives the most recent write or an error. <Src id="primer" />

## How it works

**Weak consistency.** After a write, reads may or may not see it. A best effort approach is taken. This approach is seen in systems such as memcached. Weak consistency works well in real time use cases such as VoIP, video chat, and realtime multiplayer games. For example, if you are on a phone call and lose reception for a few seconds, when you regain connection you do not hear what was spoken during connection loss. <Src id="primer" />

**<Term id="eventual-consistency">Eventual consistency</Term>.** After a write, reads will eventually see it (typically within milliseconds). Data is replicated asynchronously. This approach is seen in systems such as DNS and email. Eventual consistency works well in highly available systems. <Src id="primer" />

**<Term id="strong-consistency">Strong consistency</Term>.** After a write, reads will see it. Data is replicated synchronously. This approach is seen in file systems and RDBMSes. Strong consistency works well in systems that need transactions. <Src id="primer" />

Between eventual and strong there are useful middle grounds. **Read-your-writes** means a user always sees their own updates. **Monotonic reads** means a user never sees data go backwards in time. Both are cheaper than full strong consistency and fix the most visible glitches. <Src id="wiki-ec" />

## Trade-offs

| | Weak | Eventual | Strong |
|---|---|---|---|
| Read sees latest write | Maybe never | Soon | Always |
| Write latency | Lowest | Low | Highest (waits for replicas) |
| Availability under failure | High | High | Lower |
| Typical use | Live media, caches | DNS, feeds, likes | Payments, inventory |

## Interview tips

- Name the level per feature, not for the whole system.
- For eventual consistency, say how stale is acceptable ("a few seconds") and how users avoid seeing glitches (read-your-writes).
- Link strong consistency to synchronous replication and its latency cost.
