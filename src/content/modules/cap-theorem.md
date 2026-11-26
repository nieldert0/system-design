---
slug: cap-theorem
title: CAP theorem
section: availability
readFirst:
  - how-the-internet-works
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, CAP theorem
    url: https://github.com/donnemartin/system-design-primer#cap-theorem
    license: CC BY 4.0
    use: copied
  - id: wiki-pacelc
    title: Wikipedia, PACELC design principle
    url: https://en.wikipedia.org/wiki/PACELC_design_principle
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
    explanation: CAP consistency is about reads seeing the latest write. It is not the C in ACID.
  - prompt: Why must real distributed systems support partition tolerance?
    options:
      - It is required by law
      - Networks aren't reliable, so partitions will happen
      - It makes reads faster
      - It is free
    correct: 1
    explanation: Since partitions happen, the real choice is between consistency and availability during one.
  - prompt: During a partition, a CP system typically...
    options:
      - Returns possibly stale data
      - Returns an error or times out rather than risk stale data
      - Ignores writes
      - Drops the partition permanently
    correct: 1
    explanation: CP prefers correctness. Waiting for the partitioned node might result in a timeout error.
  - prompt: Which business need fits AP?
    options:
      - Bank balance transfers
      - A social feed where slightly stale likes are fine but downtime is not
      - Seat booking with no overselling
      - Unique username registration
    correct: 1
    explanation: AP suits cases that can accept eventual consistency.
  - prompt: What does PACELC add to CAP?
    options:
      - Nothing
      - Even without a partition, there is a trade-off between latency and consistency
      - A fourth guarantee called durability
      - That CAP is wrong
    correct: 1
    explanation: Else (no partition), choose Latency or Consistency.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

When a network splits your servers apart, each side must choose: refuse to answer, or answer with data that might be out of date. That choice is the CAP theorem.

## What it is

In a distributed computer system, you can only support two of the following guarantees: <Src id="primer" />

- **Consistency** - Every read receives the most recent write or an error
- **Availability** - Every request receives a response, without guarantee that it contains the most recent version of the information
- **Partition Tolerance** - The system continues to operate despite arbitrary partitioning due to network failures

*Networks aren't reliable, so you'll need to support partition tolerance. You'll need to make a software tradeoff between consistency and availability.* <Src id="primer" />

## How it works

**<Term id="cp">CP - consistency and partition tolerance</Term>.** Waiting for a response from the partitioned node might result in a timeout error. CP is a good choice if your business needs require atomic reads and writes. <Src id="primer" />

**<Term id="ap">AP - availability and partition tolerance</Term>.** Responses return the most readily available version of the data available on any node, which might not be the latest. Writes might take some time to propagate when the partition is resolved. AP is a good choice if the business needs to allow for eventual consistency or when the system needs to continue working despite external errors. <Src id="primer" />

CAP only describes behaviour during a partition. The PACELC idea extends it: if there is a Partition, choose Availability or Consistency; Else, even when all is well, choose Latency or Consistency, because waiting for replicas to agree takes time. <Src id="wiki-pacelc" />

## Trade-offs

- **CP** keeps data correct but some requests fail during a partition. Good for money, inventory, unique constraints.
- **AP** keeps serving but some reads are stale and conflicting writes must be merged later. Good for feeds, counters, carts.
- Most systems are not purely one or the other; you can choose per feature, or tune it (e.g. quorum reads and writes).

## Interview tips

- Do not say "we pick CA". Partitions are not optional, so the choice is C or A when one happens.
- Tie the choice to the product: "Payments must be CP; the like count can be AP."
- Mention PACELC to show you know the latency cost of consistency exists even without failures.
