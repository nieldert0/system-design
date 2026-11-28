---
slug: availability-patterns
title: Availability patterns
section: availability
upgraded: true
readFirst:
  - consistency-patterns
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, Availability patterns
    url: https://github.com/donnemartin/system-design-primer#availability-patterns
    license: CC BY 4.0
    use: reworded
  - id: wiki-ha
    title: Wikipedia, High availability
    url: https://en.wikipedia.org/wiki/High_availability
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-split
    title: Wikipedia, Split-brain (computing)
    url: https://en.wikipedia.org/wiki/Split-brain_(computing)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What are the two complementary patterns for high availability?
    options:
      - Caching and sharding
      - Fail-over and replication
      - Polling and pushing
      - TCP and UDP
    correct: 1
    explanation: Fail-over moves traffic to a spare; replication makes sure the spare has the data.
  - prompt: In active-passive fail-over, how does the passive server know to take over?
    options:
      - A user emails it
      - Heartbeats from the active server stop arriving
      - DNS tells it
      - It always handles half the traffic
    correct: 1
    explanation: When enough heartbeats are missed, the passive server takes over the active's IP address or role.
  - prompt: Two components, each 99.9% available, are in sequence. What is the total?
    options:
      - 99.9%
      - About 99.8%
      - 99.9999%
      - 100%
    correct: 1
    explanation: In sequence, multiply. 0.999 × 0.999 ≈ 0.998.
  - prompt: The same two components are in parallel. What is the total?
    options:
      - 99.8%
      - 99.9%
      - 99.9999%
      - 50%
    correct: 2
    explanation: In parallel, the total is 1 − (0.001 × 0.001) = 0.999999, assuming they fail independently.
  - prompt: About how much downtime per year does 99.99% (four 9s) allow?
    options:
      - 8 hours 45 minutes
      - About 52 minutes
      - 8.6 seconds
      - 1 day
    correct: 1
    explanation: 0.01% of 525,600 minutes is about 52.6 minutes.
  - prompt: In the worked example, a request passes through a load balancer, an app tier, and a database in sequence, each 99.9%. Why does adding a second app server barely help?
    options:
      - App servers cannot be duplicated
      - The app tier rises to 99.9999%, but the single load balancer and single database still cap the total near 99.8%
      - Two app servers halve availability
      - Parallel components multiply their availability
    correct: 1
    explanation: The chain is only as good as its weakest links in sequence. You have to remove every single point of failure, not just one.
  - prompt: A fail-over is detected after 3 missed heartbeats sent every 2 seconds, and promotion takes 20 seconds. The service fails over 4 times a year. How much of a 99.99% budget (about 52 minutes) does that use?
    options:
      - About 2 minutes, roughly 4%
      - All of it
      - About 30 minutes
      - None, fail-over is instant
    correct: 0
    explanation: Each fail-over is 6 s to detect plus 20 s to promote, about 26 s. Four of them is about 104 s, under 4% of the budget.
  - prompt: Why does a two-node active-passive pair need a witness or a fencing mechanism?
    options:
      - To speed up heartbeats
      - Because if the link between them breaks, both may decide the other is dead and both act as primary (split-brain)
      - To store backups
      - To balance load between them
    correct: 1
    explanation: Missed heartbeats cannot tell "the other node died" from "the link died". A third vote or fencing ensures only one side acts as primary.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import FailoverFlow from '#lib/diagrams/FailoverFlow.svelte';
	import AvailabilitySeriesParallel from '#lib/diagrams/AvailabilitySeriesParallel.svelte';
</script>

High availability means the service keeps answering when parts of it fail. You get there with spare copies of everything that can break, and a fast, safe way to switch to them.

## What it is

Here is the problem. Your app runs on one server with one database. The server's disk fails at 2 a.m., and the site is down until someone wakes up, provisions a new machine, and restores last night's backup: maybe four hours, plus whatever was written since the backup. A single machine can be reliable, but sooner or later it reboots, loses a disk, or gets a bad deploy, and everything behind it stops. Any component whose failure takes the whole service down is a **single point of failure**, and availability patterns exist to remove them.

There are two complementary patterns: <Src id="primer" />

- **<Term id="failover">Fail-over</Term>**: keep a spare ready and move traffic to it when the main one fails.
- **<Term id="replication">Replication</Term>**: keep copies of the data on several machines, so the spare has something to serve.

Fail-over without replication gives you a running server with no data; replication without fail-over gives you a safe copy that nobody is talking to. You need both.

Availability is measured as the share of time the service answers correctly, usually written as a number of nines: 99.9% is "three nines", 99.99% is "four nines". A company often promises a figure to customers in a service level agreement (SLA), with refunds if it misses. The useful way to read a target is as a **downtime budget**: how many minutes a year you are allowed to be down. <Src id="primer" /> <Src id="wiki-ha" />

| Availability | Per year | Per month | Per week | Per day |
|---|---|---|---|---|
| 99% (two 9s) | 3d 15h 39m | 7h 18m | 1h 41m | 14m 24s |
| 99.9% (three 9s) | 8h 45m 57s | 43m 50s | 10m 5s | 1m 26s |
| 99.99% (four 9s) | 52m 36s | 4m 23s | 1m 1s | 8.6s |
| 99.999% (five 9s) | 5m 15s | 26s | 6s | 0.9s |

Four nines allows about one 4-minute outage a month. That is too short for a human to notice an alert, log in, and fix things, which is why higher targets require automatic fail-over.

## How it works

### Active-passive

One server (the active, or primary) handles all traffic. A second (the passive, or standby) waits. The two exchange <Term id="heartbeat">heartbeats</Term>, small "I'm alive" messages every second or two. If the standby misses several in a row, it assumes the active is dead, takes over its <Term id="ip-address">IP address</Term> or role, and starts serving. <Src id="primer" />

How long users are down depends on how ready the standby is:

- **Hot standby** is running, has current data from replication, and can take over in seconds.
- **Warm standby** is running but needs to catch up or start services, usually a minute or two.
- **Cold standby** is switched off or not yet provisioned and needs minutes to hours.

<FailoverFlow />

Active-passive is simple and avoids two servers fighting over the same data, but the standby's capacity sits idle, and any writes the active accepted but had not yet replicated are lost when it dies.

### Active-active

Every server handles traffic, and the load is spread across them. If one fails, the others absorb its share. For public-facing servers, <Term id="dns">DNS</Term> or a <Term id="load-balancer">load balancer</Term> needs to know about all of them; for internal servers, the calling services or a [service discovery](/modules/service-discovery) system do. <Src id="primer" />

This is the normal pattern for <Term id="stateless">stateless</Term> app servers: run several behind a [load balancer](/modules/load-balancers), and its health checks remove a dead one within seconds. It is much harder for databases, because two nodes that both accept writes to the same data can conflict; see [consistency patterns](/modules/consistency-patterns) and the [CAP theorem](/modules/cap-theorem). One important rule: each node must run below its limit, so the survivors can absorb a failed node's load. With 2 active nodes, each must stay under 50%.

### Split-brain and fencing

Missed heartbeats cannot tell "the other server died" from "the link between us died". In the second case, a naive standby promotes itself while the old primary is still running and accepting writes, and you have two primaries writing different data. This is <Term id="split-brain">split-brain</Term>, and it can corrupt data far worse than a short outage. <Src id="wiki-split" />

Two defences are standard. A third voter (a witness, or a coordination service such as etcd or ZooKeeper) means a node can only become primary with a majority of votes, so at most one side of a broken link can win. <Term id="fencing">Fencing</Term> makes sure the old primary cannot keep writing: cut its power, revoke its access to the storage, or reject its writes because they carry an older term number.

### Availability in numbers

A request usually passes through several components. How their availability combines depends on how they are arranged. <Src id="primer" />

- **In sequence** (the request needs all of them), availability multiplies and goes down: A(total) = A(foo) × A(bar). Two 99.9% components in sequence give 99.8%.
- **In parallel** (any one is enough), the chance that all fail at once multiplies, so availability goes up: A(total) = 1 − (1 − A(foo)) × (1 − A(bar)). Two 99.9% components in parallel give 99.9999%.

<AvailabilitySeriesParallel />

The parallel formula assumes the copies fail independently. Two servers in the same rack, on the same power feed, running the same buggy release, are not independent, which is why real systems spread replicas across availability zones (separate data centres in one region) and roll deployments out gradually.

## Worked example

A checkout service needs **99.95% availability**, a budget of about **4 hours 23 minutes a year** (0.05% of 8,760 hours). Every request goes through a load balancer, an app server, and a database, in sequence. Assume each single component is **99.9%** available (about 8h 46m down a year).

**Step 1, one of everything.** Three components in sequence: 0.999 × 0.999 × 0.999 ≈ **99.7%**, about 26 hours of downtime a year. Six times over budget.

**Step 2, add a second app server.** The app tier becomes 1 − 0.001 × 0.001 = 99.9999%. The total is 0.999 × 0.999999 × 0.999 ≈ **99.8%**, about 17.5 hours. Better, but the single load balancer and single database still dominate. Fixing one link of a chain does little while the others stay weak.

**Step 3, make every tier redundant.** Use a managed load balancer that runs across two zones (about 99.99%), keep two app servers (99.9999%), and add a hot-standby database with automatic fail-over. The database pair is not a perfect parallel pair, because each fail-over itself causes a short outage. Say the database fails over **4 times a year**. Detection is 3 missed heartbeats at 2-second intervals, so **6 s**, and promotion takes **20 s**: about **26 s per fail-over**, or **104 s a year**. Add the small chance that both database nodes are down together, and the database tier is roughly 99.99%. Total: 0.9999 × 0.999999 × 0.9999 ≈ **99.98%**, about 1 hour 45 minutes a year. Under budget.

**Step 4, check what the budget is really spent on.** In practice, most downtime comes from bad deploys and configuration changes, not hardware. If the team ships 3 times a day and 1 deploy in 200 causes a 10-minute outage before rollback, that is about 5 bad deploys a year, or **50 minutes**, half the remaining budget. That is why availability work includes [canary releases](/modules/ci-cd-and-deployment) and fast rollback as much as redundant servers.

**Step 5, the data cost.** The standby database receives changes asynchronously, typically 100 ms behind. At 300 writes/s, a primary that dies abruptly takes roughly 300 × 0.1 = **30 acknowledged writes** with it. If checkout cannot lose an order, make the replication synchronous for that table, accepting a few extra milliseconds per write, or write orders through a durable [queue](/modules/queues-and-back-pressure) that is replayed after fail-over.

## In the real world

- **AWS RDS Multi-AZ.** Keeps a synchronous standby in a second availability zone. On failure, AWS repoints the instance's DNS name to the standby, typically in 60 to 120 seconds, so clients must reconnect and must not cache the DNS answer beyond its short <Term id="ttl">TTL</Term>. Multi-AZ DB clusters with two readable standbys cut that to under 35 seconds.
- **PostgreSQL with Patroni.** Patroni runs beside each PostgreSQL node and uses etcd, Consul, or ZooKeeper as the vote holder: the primary must keep renewing a leader key (`ttl` defaults to 30 s, `loop_wait` to 10 s). If it stops renewing, a replica with the least lag takes the key and promotes itself, and the old primary demotes itself when it notices it lost the key, which is its fencing.
- **Redis Sentinel.** A group of Sentinel processes watches the primary; once a `quorum` of them (set per monitored primary) agree it has been unreachable for `down-after-milliseconds`, they elect one Sentinel to promote a replica. Run at least three Sentinels on separate machines so a single failure cannot block or fake a decision.
- **Kubernetes.** A Deployment with several replicas is active-active for stateless pods; liveness and readiness probes (`periodSeconds` defaults to 10, `failureThreshold` to 3) restart broken pods and remove them from the load balancer, and a PodDisruptionBudget stops maintenance from taking down too many at once. See [Kubernetes](/modules/kubernetes).

## Trade-offs

| | Active-passive | Active-active |
|---|---|---|
| Hardware use | Standby idle | All nodes serve |
| Fail-over time | Seconds (hot) to hours (cold) | Near zero for stateless nodes |
| Write conflicts | None, one writer | Must be designed for if nodes share writable data |
| Typical use | Relational databases, legacy apps | Stateless app servers, caches, DNS |

- **Cost against nines.** Every extra nine costs roughly an order of magnitude more: more replicas, more zones or regions, more automation, more testing. Pick the target from what downtime actually costs the business.
- **Fail-over speed against false alarms.** Aggressive heartbeats (miss 1 second and fail over) cut downtime, but a short network blip or a long garbage-collection pause then triggers an unnecessary fail-over, which is itself an outage. Most systems wait for several missed beats.
- **Availability against durability.** Asynchronous replication keeps writes fast and the primary available, but loses the last few writes on fail-over. Synchronous replication loses nothing, but a slow or dead standby can stall writes. <Src id="primer" />
- **Complexity.** Fail-over adds hardware, configuration, and failure modes of its own, such as split-brain. A fail-over path that has never been tested often fails when it is finally needed. <Src id="primer" />

## Interview tips

- Ask for the availability target, convert it to a downtime budget, then remove single points of failure until the math reaches it.
- Count the chain: every service a request passes through in sequence lowers the total, including third-party APIs you call.
- Say how fail-over is detected (heartbeats or health checks), how long it takes, and how split-brain is avoided (majority vote or fencing).
- Mention that capacity must survive a failure: N + 1 nodes, each running below the level where the others can absorb its load.

**Common mistakes:**

- Adding redundancy to one tier and forgetting the single database or load balancer behind it, as in step 2 of the worked example.
- Treating two copies as independent when they share a rack, a zone, a power supply, or a deploy, so they fail together.
- Running two active nodes at 70% each, so when one fails the other is pushed to 140% and also falls over.
- Relying on manual fail-over for a four-nines target. A 4-minute monthly budget is gone before a human has read the page.
- Building a two-node cluster with no witness, which cannot tell a dead peer from a broken link and invites split-brain.

## Common follow-up questions

### How do you go from 99.9% to 99.99%?

Find what the current downtime is spent on and remove it. Usually that means automatic fail-over instead of manual, redundancy across availability zones rather than within one, safer deploys (canaries, automatic rollback), and removing hidden sequence dependencies such as a single config service every request calls. Each step is roughly ten times the effort of the last nine.

### How do clients find the new primary after a fail-over?

One of three ways: a floating IP address that moves to the new primary, a DNS name that is updated (with a short TTL, as RDS does), or a proxy or service discovery layer that always points at the current leader (for example HAProxy checking Patroni's REST endpoint). Clients must also time out and retry after the connection drops, because the fail-over only helps clients that reconnect.

### What is the difference between availability and durability?

Availability is whether the service answers right now; durability is whether data you were told was saved is still there later. A system can be available but lose recent writes (async fail-over), or durable but unavailable (a synchronous replica that is down stalls writes). Object stores advertise eleven nines of durability while promising far fewer nines of availability.

### When would you go multi-region?

When a full region outage would cost more than running in two regions, or when a regulation demands it. It is a big step: cross-region round trips are tens of milliseconds, so writes either accept that latency (strong consistency) or accept conflicts (active-active with async replication). Many teams start with active-passive across regions: a warm standby region that takes over in minutes.

### How do you know your fail-over works?

Test it on purpose. Teams run regular game days where they kill a primary or a zone in a controlled way, and some, like Netflix with Chaos Monkey, randomly terminate production instances all the time so that every service is forced to tolerate it. An untested fail-over is a hope, not a design.

## Go deeper

- [Google SRE book: Embracing risk](https://sre.google/sre-book/embracing-risk/): how Google picks availability targets and spends error budgets instead of chasing 100%.
- [AWS Builders' Library: Static stability using Availability Zones](https://aws.amazon.com/builders-library/static-stability-using-availability-zones/): designing so that losing a zone needs no reaction at all, including the over-provisioning maths.
- [GitHub October 21 post-incident analysis](https://github.blog/2018-10-30-oct21-post-incident-analysis/): a 43-second network partition, an automatic cross-region fail-over, and 24 hours of degraded service, told step by step.
- [PostgreSQL: High availability, load balancing, and replication](https://www.postgresql.org/docs/current/high-availability.html): the official comparison of shared disk, log shipping, and synchronous replication options.
