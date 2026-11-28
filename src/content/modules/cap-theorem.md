---
slug: cap-theorem
title: CAP theorem
section: availability
upgraded: true
readFirst:
  - how-the-internet-works
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, CAP theorem
    url: https://github.com/donnemartin/system-design-primer#cap-theorem
    license: CC BY 4.0
    use: reworded
  - id: wiki-pacelc
    title: Wikipedia, PACELC design principle
    url: https://en.wikipedia.org/wiki/PACELC_design_principle
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-cap
    title: Wikipedia, CAP theorem
    url: https://en.wikipedia.org/wiki/CAP_theorem
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In CAP, what does consistency mean?
    options:
      - The data is valid according to the schema
      - Every read receives the most recent write or an error
      - Every request gets a response
      - Writes are fast
    correct: 1
    explanation: CAP consistency is about reads seeing the latest write (linearizability). It is not the C in ACID, which is about constraints.
  - prompt: Why is "pick CA" not a real option for a system running on more than one machine?
    options:
      - CA systems are too expensive
      - Networks drop and delay messages, so partitions will happen and the system must still decide how to behave during one
      - CA is illegal under GDPR
      - Consistency and availability are the same thing
    correct: 1
    explanation: You cannot opt out of partitions. The only choice is what to give up when one happens.
  - prompt: During a partition, a CP system typically...
    options:
      - Returns possibly stale data
      - Returns an error or times out rather than risk stale data
      - Ignores writes but acknowledges them
      - Drops the partition permanently
    correct: 1
    explanation: CP prefers correctness, so the side that cannot reach a majority refuses requests.
  - prompt: In the worked example, a 5-node cluster in two data centres splits 3 and 2. With majority quorums, what happens to a write sent to the 2-node side?
    options:
      - It succeeds and is merged later
      - It fails or times out, because 2 nodes cannot form a majority of 5
      - It succeeds because any node can accept writes
      - It is forwarded over the broken link
    correct: 1
    explanation: A majority of 5 is 3. The minority side cannot commit anything, which is exactly the CP behaviour.
  - prompt: In the same example, the store is switched to AP (any node accepts writes). Both sides change the same seat booking during the 90-second split. What must happen when the link comes back?
    options:
      - Nothing, the writes cannot conflict
      - The two versions must be reconciled, for example with last-write-wins or application merge logic, and one booking may be lost or the seat oversold
      - The cluster deletes both writes
      - The minority side's writes are automatically rejected with an error to the user
    correct: 1
    explanation: AP keeps answering on both sides, so conflicting writes are accepted and have to be resolved afterwards. For seats, that means overselling, which is why booking is usually CP.
  - prompt: What does PACELC add to CAP?
    options:
      - Nothing
      - Even without a partition, there is a trade-off between latency and consistency
      - A fourth guarantee called durability
      - That CAP is wrong
    correct: 1
    explanation: Else (no partition), choose Latency or Consistency, because waiting for replicas to agree costs round trips.
  - prompt: A cross-region database waits for a majority of 3 regions on each write, and the nearest other region is 70 ms away round trip. What is the rough floor on write latency, even with no failures?
    options:
      - About 1 ms
      - About 70 ms, one round trip to the nearest other region to reach 2 of 3
      - About 210 ms
      - Zero, because there is no partition
    correct: 1
    explanation: The leader plus one other region make a majority, so each write waits at least one 70 ms round trip. That is the "else, latency or consistency" half of PACELC.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CapPartitionFlow from '#lib/diagrams/CapPartitionFlow.svelte';
</script>

When a network splits your servers apart, each side must choose: refuse to answer, or answer with data that might be out of date. That choice is the CAP theorem, and it is the reason "make it always correct and always up" is not a design you can actually build.

## What it is

Here is the problem. You run a booking database on two servers in two data centres, copying every write from one to the other. One afternoon the fibre between the data centres is cut. Both servers are healthy, users can still reach each of them, but the servers cannot reach each other. A user in Paris books seat 14C on server A. A second later a user in Frankfurt asks server B whether 14C is free. Server B has two honest options: say "I can't answer right now" (an error or a timeout), or say "it looks free" from its last known copy, which may be wrong. There is no third option that is both instant and guaranteed correct, because the information B needs is on the other side of a broken link.

That situation is a <Term id="network-partition">network partition</Term>, and the CAP theorem says that a system which stores data on more than one machine can guarantee at most two of these three properties: <Src id="primer" /> <Src id="wiki-cap" />

- **Consistency (C)**: every read gets the most recent write, or an error. Formally this is <Term id="linearizability">linearizability</Term>: the system behaves as if there were one copy of the data. Note that this is not the C in <Term id="acid">ACID</Term>, which means "constraints such as foreign keys still hold".
- **Availability (A)**: every request sent to a working node gets a real answer, not an error, though the answer may be stale.
- **Partition tolerance (P)**: the system keeps operating even when messages between nodes are lost or delayed for any length of time.

Networks do drop packets, switches do fail, and cloud zones do lose links, so a multi-machine system cannot opt out of partitions. That turns CAP into a narrower and more useful statement: **when a partition happens, you choose between consistency and availability**. When there is no partition, you can have both. <Src id="primer" />

This module covers that choice and its cousin PACELC. [Consistency patterns](/modules/consistency-patterns) goes into the levels between "strongly consistent" and "anything goes", and [Availability patterns](/modules/availability-patterns) covers how systems stay up in the first place.

## How it works

### CP: refuse rather than be wrong

A <Term id="cp">CP system</Term> keeps a single correct answer and gives up availability on the side of the partition that cannot confirm it. The usual mechanism is a <Term id="quorum">quorum</Term>: a write only counts once a majority of replicas have stored it, and a read only answers once it has checked with a majority. During a partition, at most one side can contain a majority, so only that side keeps working. Requests to the minority side wait and then fail with a timeout or an explicit error. <Src id="primer" />

CP fits data where a wrong answer is worse than no answer: account balances, inventory counts, unique usernames, leader election, locks. The cost is that some users see errors during the partition, and every write pays for the round trips to a majority even on a good day.

### AP: answer with what you have

An <Term id="ap">AP system</Term> lets every reachable node keep answering from its own copy. Reads may be stale, and writes accepted on both sides of the split are later copied across when the link heals. If two sides changed the same item, the system has to reconcile them: keep the newer one by timestamp (<Term id="last-write-wins">last-write-wins</Term>), keep both and let the application merge them, or use a data type designed to merge automatically, such as a counter that adds the increments from both sides. <Src id="primer" />

AP fits data where a stale answer is better than none: social feeds, like counts, shopping carts, product catalogues, <Term id="dns">DNS</Term>. The promise it does make is <Term id="eventual-consistency">eventual consistency</Term>: stop writing, and all copies converge.

<CapPartitionFlow />

### PACELC: the trade-off that exists every day

Partitions are rare, and CAP says nothing about the other 99.9% of the time. PACELC fills that gap: if there is a **P**artition, choose **A**vailability or **C**onsistency; **E**lse, choose **L**atency or **C**onsistency. <Src id="wiki-pacelc" />

The "else" half matters because consistency is never free. To make sure a read sees the latest write, a replica has to check with others, and that check costs a network round trip on every request. A system that skips the check and answers locally is faster but may be stale. So systems are often described with two letters on each side: DynamoDB and Cassandra in their default settings are PA/EL (available in a partition, low latency otherwise), while Spanner and etcd are PC/EC (consistent in both cases, and they pay latency for it).

### It is a dial, not a label

Many databases let you pick per request. In Cassandra, a client sets a consistency level on each query; in MongoDB, it sets a read and write concern. The same cluster can serve a CP-style write for a payment and an AP-style read for a feed. That is why "is this database CP or AP?" is usually the wrong question; "how is this operation configured?" is the right one.

## Worked example

A ticketing company runs a replicated database with **5 replicas**: 3 in data centre East and 2 in data centre West. Clients in both regions talk to their local replicas. The round trip between data centres is **40 ms**; inside a data centre it is **under 1 ms**. Peak traffic is **1,000 writes/s** and **20,000 reads/s**, split evenly between regions.

**Step 1, a normal write with quorums.** The store is configured CP: a write needs acknowledgement from a majority, which for 5 replicas is 3. A write coming in through East can reach the 3 East replicas in under 1 ms, so it commits in roughly 1 to 2 ms. A write coming in through West has only 2 local replicas, so it must wait for at least one East replica: about **40 ms**. That asymmetry is PACELC's "else, consistency costs latency" in action, and it is why teams place the majority of replicas where most writes come from.

**Step 2, the link is cut for 90 seconds.** East has 3 replicas, a majority; West has 2, a minority.

- East keeps working normally. Its 500 writes/s and 10,000 reads/s still succeed.
- West cannot reach a majority. Every write sent there waits for its timeout (say 2 s) and fails. Over 90 seconds that is 500 × 90 = **45,000 failed writes**. Its reads fail too if they also require a quorum. If West reads are allowed to answer locally, they succeed but may be up to 90 seconds stale.

Nobody gets a wrong answer and no seat is sold twice, but half the users see errors for a minute and a half. That is the CP trade.

**Step 3, the same outage under AP.** Now each replica accepts writes locally and copies them across later. Both regions keep serving all 1,000 writes/s, so there are **zero failed requests**. But suppose seat 14C is booked in East at 12:00:10 and in West at 12:00:31, both during the split. When the link heals, the system finds two versions of the seat. With last-write-wins, West's booking (the later timestamp) survives and East's customer silently loses a seat they were told they had. Over a 90-second outage on a busy on-sale, even a 0.1% collision rate on 90,000 writes is **90 double-booked seats**.

**Step 4, the decision.** The company does not have to pick one for everything. Seat reservations go through the CP path, and the West outage is handled by a clear "try again in a moment" message. The event listing pages, seat-map images, and "tickets left: about 40" counters are read AP-style from local replicas, because a number that is 30 seconds stale harms nobody. That per-feature split is the answer interviewers want to hear.

## In the real world

- **Apache Cassandra.** Each query carries a consistency level. `ONE` asks one replica (fast, AP-leaning), `QUORUM` asks a majority of all replicas, `LOCAL_QUORUM` asks a majority in the local data centre (common for multi-region apps), and `ALL` asks every replica. The replication factor is set per keyspace, typically 3 per data centre. Reads and writes both at `QUORUM` give read-your-latest-write behaviour, because a write majority and a read majority must overlap.
- **Amazon DynamoDB.** Reads are eventually consistent by default; setting `ConsistentRead: true` on a `GetItem` or `Query` returns the latest value and costs twice the read capacity. Global tables replicate across regions asynchronously and resolve conflicts with last-writer-wins, so cross-region writes are AP.
- **etcd and ZooKeeper.** These coordination stores (used by Kubernetes and Kafka, among others) are CP. They use a consensus protocol (Raft for etcd, Zab for ZooKeeper) and refuse writes when a majority is unreachable. That is why they are deployed with 3 or 5 members: 3 survives 1 failure, 5 survives 2.
- **Google Spanner.** It is formally CP, but Google runs enough redundant network that partitions are very rare, so in practice it looks highly available too. Eric Brewer, who stated CAP, describes it as "effectively CA" in his 2017 paper, while making clear that during a real partition Spanner chooses consistency.

## Trade-offs

| | CP | AP |
|---|---|---|
| During a partition | Minority side returns errors or timeouts | Every side keeps answering |
| Reads | Always the latest write | May be stale |
| Conflicting writes | Impossible, one side refuses | Possible, resolved after healing |
| Normal-day latency | Higher, waits for a majority | Lower, can answer locally |
| Good for | Balances, inventory, unique names, locks | Feeds, counters, carts, catalogues |

- **Correctness against uptime.** CP pushes the failure to users as errors; AP pushes it into the data as conflicts you must merge. Ask which is cheaper to fix: an annoyed user retrying, or a double-sold seat.
- **Latency against freshness.** Even with no failures, reading from a majority or a leader is slower than reading a local copy. Many systems read locally by default and offer a strongly consistent read as an option.
- **Operational complexity.** AP needs conflict resolution designed in from the start; CP needs enough replicas in the right places that one data centre failing does not lose the majority.

## Interview tips

- Do not say "we pick CA". Partitions are not optional, so the choice is C or A when one happens.
- Choose per feature, out loud: "Payments and seat holds are CP; the like count and the feed are AP."
- Name the mechanism. "CP via majority quorum, so a 5-node cluster survives 2 failures" is far stronger than "it's consistent".
- Mention PACELC to show you know consistency costs latency even without failures, and put numbers on it (one cross-region round trip per write).

**Common mistakes:**

- Treating CAP consistency as ACID consistency. They are different ideas that share a letter.
- Calling a whole database "CP" or "AP". Most are configurable per query, and the default is often not the strongest option (DynamoDB reads are eventually consistent unless you ask).
- Forgetting that availability in CAP means every node answers. A CP system can still have excellent uptime in practice; it just refuses on the minority side during a split.
- Assuming partitions only mean cables being cut. A long garbage-collection pause or an overloaded node that stops responding looks exactly like a partition to everyone else.

## Common follow-up questions

### If partitions are rare, why does CAP matter so much?

Because the rare event decides your worst day. A partition of a few minutes once a quarter is enough to oversell inventory or lose writes if you have not planned for it. And thanks to PACELC, the same choice shows up every day as latency: a consistent read across regions costs a round trip on every request.

### How does a quorum guarantee you read the latest write?

With N replicas, if a write waits for W acknowledgements and a read asks R replicas, and W + R is greater than N, then every read set overlaps every write set in at least one replica, so at least one replica in the read holds the newest value. With N = 3, W = 2, R = 2 the sets must share a node. With W = 1, R = 1, they may not, and the read can be stale.

### Can a system be both CP and highly available?

Yes, in practice. CAP availability is a strict, every-node definition. A CP system with replicas spread over three zones, where the majority survives any single zone failure, can have 99.99% uptime. It only fails requests for clients stuck on the minority side, and with good routing those clients can be sent to the majority.

### What happens to an AP system when the partition heals?

The replicas exchange what they missed, using mechanisms such as hinted handoff (a node stores writes meant for an unreachable peer and replays them later) and anti-entropy repair (replicas compare data and copy the differences). Conflicting versions of the same item are resolved by last-write-wins, version vectors that detect the conflict, or application merge logic.

### Where does a leader-based database such as PostgreSQL with replicas fit?

Writes go to one primary, so writes are CP-like: if the primary is cut off, writes stop until a failover. Reads from asynchronous replicas are AP-like: they keep working and may lag. That is why the same database can appear on both sides of the CAP diagram depending on which operation you ask about.

## Go deeper

- [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/): Eric Brewer, who coined CAP, on why "two of three" is misleading and how to manage partitions explicitly.
- [Please stop calling databases CP or AP](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html): Martin Kleppmann on the precise definitions and why real databases rarely fit either label.
- [Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services](https://users.ece.cmu.edu/~adrian/731-sp04/readings/GL-cap.pdf): the Gilbert and Lynch paper that turned CAP into a proven theorem.
- [Consistency Tradeoffs in Modern Distributed Database System Design](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf): Daniel Abadi's PACELC paper, with Dynamo, Cassandra, and others classified.
