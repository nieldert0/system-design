---
slug: multi-region-and-disaster-recovery
title: Multi-region and disaster recovery
section: architecture
readFirst:
  - replication
  - availability-patterns
sources:
  - id: aws-dr
    title: AWS Whitepaper, Disaster Recovery of Workloads on AWS
    url: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
    license: All rights reserved
    use: reworded
  - id: wiki-dr
    title: Wikipedia, Disaster recovery
    url: https://en.wikipedia.org/wiki/Disaster_recovery
    license: CC BY-SA 4.0
    use: reworded
  - id: aws-ddb-global
    title: AWS, DynamoDB global tables
    url: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html
    license: All rights reserved
    use: reworded
  - id: google-sre
    title: Google SRE Book, Data integrity
    url: https://sre.google/sre-book/data-integrity/
    license: CC BY-NC-ND 4.0
    use: reworded
quiz:
  - prompt: What do RPO and RTO measure?
    options:
      - Request rate and timeout
      - RPO is how much recent data you can afford to lose; RTO is how long you can be down
      - Both measure downtime
      - Replica count and throughput
    correct: 1
    explanation: Recovery point is data, recovery time is downtime.
  - prompt: Which DR strategy has the lowest cost and the longest RTO?
    options:
      - Active-active
      - Backup and restore
      - Warm standby
      - Pilot light
    correct: 1
    explanation: Nothing runs in the second region until disaster, so you rebuild from backups, taking hours.
  - prompt: In the worked example, replication lag is 1 s and the primary takes 2,000 writes/s. About how many writes are lost on failover?
    options:
      - None
      - About 2,000
      - About 20,000
      - All writes since the last backup
    correct: 1
    explanation: Writes in the lag window, 2,000/s × 1 s, never reached the standby.
  - prompt: Why is the DNS TTL part of RTO?
    options:
      - It is not
      - Clients cache the old record until the TTL expires, so they keep hitting the dead region for up to that long
      - TTL controls replication
      - DNS servers fail with the region
    correct: 1
    explanation: A 60 s TTL adds up to 60 s, and some resolvers hold records longer than the TTL.
  - prompt: Two regions accept writes to the same user's profile at the same moment with last-writer-wins. What happens?
    options:
      - Both writes are merged
      - One write silently overwrites the other
      - The database rejects both
      - Writes are serialised globally
    correct: 1
    explanation: LWW keeps the write with the later timestamp; the other is lost without error.
  - prompt: The business wants RPO of zero for payments across regions. What does that cost?
    options:
      - Nothing
      - Synchronous cross-region replication or consensus, adding at least one cross-region round trip (tens of ms) to every commit
      - Daily backups
      - A shorter DNS TTL
    correct: 1
    explanation: Zero data loss means a commit waits for another region to have it.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RegionFailoverFlow from '#lib/diagrams/RegionFailoverFlow.svelte';
</script>

Multi-region design runs a system in more than one geographic region, so a disaster in one does not take it down, and users far away get lower latency. Disaster recovery is the plan for getting back up when a region, a database, or your own mistake destroys service or data. Both start from two numbers: how much data you can lose, and how long you can be down.

## What it is

Here is the problem. Your service runs in one cloud region, spread across three [availability zones](/modules/scaling-on-aws). That survives a single data centre losing power. But whole-region incidents happen: a bad configuration push to a regional control plane, a networking failure, a storm. And some disasters are not about hardware at all: an engineer runs a migration that drops a table, and the replicas faithfully drop it too. If the only copy of your system and data lives in one region, or every copy shares one mistake, you are down until it is fixed.

**Disaster recovery (DR)** is deciding, ahead of time, how you will recover, and paying for it. Two targets drive every decision: <Src id="wiki-dr" />

- **<Term id="rpo">RPO</Term> (recovery point objective):** the most data, measured in time, that you can afford to lose. An RPO of 1 hour means losing the last hour of writes is acceptable.
- **<Term id="rto">RTO</Term> (recovery time objective):** the longest you can be down. An RTO of 15 minutes means service must be back within 15 minutes of the disaster.

Lower RPO and RTO cost more. The right answer differs per system: a payments ledger may need an RPO near zero, while an analytics dashboard can lose a day.

**Multi-region** is one way to meet tight targets: run copies of the system in two or more regions, with data replicated between them. It also serves users nearer to where they are. But it brings the hardest problems in distributed systems, because regions are tens to hundreds of milliseconds apart and the links between them can fail.

## How it works

### The four DR strategies

AWS describes four strategies, from cheapest to most expensive. They apply to any cloud. <Src id="aws-dr" />

| Strategy | What runs in the second region | Typical RPO | Typical RTO |
|---|---|---|---|
| Backup and restore | Only backups | Hours (since the last backup) | Hours to a day |
| Pilot light | Replicated data, servers off or minimal | Seconds to minutes | Tens of minutes |
| Warm standby | A scaled-down full copy, running | Seconds | Minutes |
| Active-active | A full copy, serving traffic | Near zero to seconds | Near zero to minutes |

- **Backup and restore** copies snapshots to another region. To recover, you build infrastructure from code and restore data. It is cheap and slow.
- **Pilot light** keeps the database replicated and running, but application servers are off or minimal. Recovery means starting and scaling them.
- **Warm standby** runs everything in the second region at small scale. Recovery means promoting the database and scaling up.
- **Active-active** serves real traffic from every region. Losing one means moving its users to the others.

### Active-passive

In **active-passive** (pilot light and warm standby are forms of it), one region takes all writes and the other is a replica. Replication across regions is almost always **asynchronous**, because waiting for a commit to cross a continent would add a round trip of tens of milliseconds to every write. So the standby is always slightly behind. That lag is your RPO: whatever had not reached the standby when the primary died is lost. <Src id="aws-dr" />

<Term id="failover">Failover</Term> is a sequence: detect the failure, decide to fail over (often a human decision, because a false alarm causes its own outage), promote the standby database to accept writes, scale up compute, and move traffic, usually by changing DNS or a global load balancer. Each step adds to RTO.

The decision step matters. If the primary is only unreachable, not dead, and comes back after you promoted the standby, both think they are primary: <Term id="split-brain">split brain</Term>. The old primary must be fenced off (cut from traffic and writes) before or as you promote.

<RegionFailoverFlow />

### Active-active

In **active-active**, every region serves reads and writes. Users go to the nearest region, so latency is low, and a regional loss needs only traffic to move. The hard part is writes. <Src id="aws-ddb-global" />

- **Partition users by home region.** Each user's data has one home region that takes its writes (a European user's profile lives in the EU region). Other regions forward or read replicas. Conflicts cannot happen, and this is the most common design.
- **Multi-writer with conflict resolution.** Any region accepts writes to any item, replicated asynchronously. When two regions update the same item at once, something must win. DynamoDB global tables use <Term id="last-write-wins">last writer wins</Term>, so one update silently disappears. That is fine for a profile picture, not for a bank balance.
- **Global consensus.** A database such as Google Spanner or CockroachDB places replicas in several regions and commits only when a [quorum](/modules/consistency-patterns) agrees. Writes are consistent everywhere and RPO is zero, but every write pays at least one cross-region round trip.

### What else must be in the second region

The database is the obvious part. A failover also fails if the second region is missing secrets, container images, DNS records, certificates, or capacity quota for the scaled-up fleet, or if a "global" dependency (an identity provider, a feature-flag service) actually lives only in the dead region. Everything should be defined as code and deployed to both regions by the same pipeline.

### Backups still matter

Replication copies mistakes. A dropped table or a bug that corrupts rows is replicated to every region within a second. Protection from that comes from **point-in-time backups** kept apart from production, and from testing restores. Google's SRE book makes the point bluntly: nobody really wants backups, they want restores, and an untested backup is a hope, not a plan. <Src id="google-sre" />

## Worked example

A ticketing service runs warm standby: primary in **us-east-1**, standby in **us-west-2**. The targets are **RPO 5 seconds** and **RTO 15 minutes**. Peak load is **2,000 writes per second**. The database replicates asynchronously with typical lag of **about 1 second**, and the standby runs at 20% of the primary's compute.

**Step 1, the normal day.** All traffic goes to us-east-1. The standby database applies changes about 1 s behind. A dashboard alarms if lag exceeds 3 s, because at that point the RPO target is at risk.

**Step 2, the failure.** At 14:00:00 us-east-1 has a regional network failure. Health checks from three outside locations hit the public endpoint every 30 seconds. The rule is to page when checks fail **3 times in a row**, so the page goes out at about 14:01:30. The on-call engineer confirms it is regional, not a bad deploy, by 14:05.

**Step 3, data loss.** When the primary went dark, about 1 second of writes had not reached us-west-2. At 2,000 writes/s that is about **2,000 lost writes**, mostly ticket holds and a few purchases. That is within the 5 s RPO. Purchases are also recorded by the payment provider, so the team reconciles those afterwards against the provider's records.

**Step 4, promotion and fencing.** At 14:05 the engineer runs the failover runbook. It first fences the old primary (revoking its write credentials so it cannot accept writes if it comes back), then promotes the us-west-2 replica. Promotion takes about **1 minute**.

**Step 5, scaling and traffic.** The standby fleet is at 20% size. Autoscaling to 100% takes about **6 minutes**, since new instances must boot and pass health checks. Meanwhile DNS is switched to us-west-2. The record has a **60 s TTL**, so most clients follow within a minute, though some resolvers and long-lived connections take longer. Load shedding protects the small fleet while it grows.

**Step 6, the total.** Detection 1.5 min + decision 3.5 min + promotion 1 min + scale-up 6 min + DNS about 1 min ≈ **13 minutes**, inside the 15-minute RTO, but with only 2 minutes of margin. The biggest single item is scale-up. Running the standby at 50% would cut it to a couple of minutes and cost more. That is the RTO-versus-cost dial in one number.

**Step 7, failing back.** When us-east-1 returns, its old database is behind and may contain the ~2,000 writes that never replicated. It must be rebuilt as a replica of us-west-2, not just switched back on, and the unreplicated writes reviewed. Then the team fails back at a quiet hour or simply makes us-west-2 the new primary.

## In the real world

- **AWS Route 53.** Health checks run from several AWS locations, and failover routing points a record at a secondary target when the primary's health check fails. A short TTL (for example 60 s) keeps the switch fast. AWS Global Accelerator and Route 53 Application Recovery Controller give anycast addresses and controlled, pre-checked failover.
- **Amazon Aurora Global Database.** One primary region and up to several read-only secondary regions, with storage-level replication that typically lags under a second, and a managed failover that promotes a secondary.
- **DynamoDB global tables.** Multi-region, multi-writer tables replicated asynchronously, with last-writer-wins conflict resolution. AWS has also added a multi-region strong-consistency mode for tables that need an RPO of zero. <Src id="aws-ddb-global" />
- **Google Spanner and CockroachDB.** Consensus across regions (Paxos in Spanner, Raft in CockroachDB) for consistent multi-region writes, with placement settings that keep a user's data near them to reduce latency.
- **Netflix chaos exercises.** Netflix runs regular region evacuations, moving all traffic out of an AWS region on purpose, so failover is a routine operation rather than a once-a-year emergency.

## Trade-offs

- **Cost against recovery speed.** Every step from backups to active-active roughly multiplies infrastructure cost, so match the strategy to the real RPO and RTO.
- **Latency against data loss.** Synchronous cross-region writes give RPO zero and add tens of milliseconds to every commit; asynchronous replication is fast and loses the lag window.
- **Automatic against manual failover.** Automation lowers RTO but can fail over on a false alarm or flap back and forth; many teams automate the steps and keep a human on the trigger.
- **Active-active complexity.** Conflict handling, data residency rules, and testing double. Partitioning users by home region avoids most of it.

## Interview tips

- Ask for RPO and RTO first, and let them pick the strategy.
- Say the replication lag out loud as the RPO for active-passive, and add up the failover steps as the RTO, as in the worked example.
- For active-active, say how writes for the same item are handled: home region, last writer wins, or consensus.
- Mention fencing to avoid split brain, and backups for the mistakes replication copies.

**Common mistakes:**

- Treating replication as a backup. It replicates a dropped table in a second.
- Forgetting DNS TTL and client caching when estimating RTO.
- A standby region that cannot actually take the load: missing quota, secrets, or images, never tested.
- Assuming multi-writer databases merge concurrent updates, when they usually drop one.

## Common follow-up questions

### How do you test disaster recovery?

Regularly and for real. Restore a backup into a fresh account and check the data, run game days that fail over a staging environment, and eventually do controlled production evacuations. Measure the achieved RPO and RTO each time and compare them to the targets.

### Should failover be automatic?

Detection and the mechanics should be automated; the trigger is often manual for regional failover, because a mistaken failover loses the lag window of data and can cause split brain. Within a region, between zones, failover is routinely automatic.

### How do you route users to the nearest region?

Latency-based or geolocation DNS, or an anycast global load balancer, sends users to the closest healthy region. If data is partitioned by home region, the edge forwards writes to the user's home region.

### What about data residency laws?

Some data must stay in a country or region, such as personal data under EU rules. Partition by home region and keep those users' primary data and backups there; replicate to another region only where the law allows.

### How do you fail over a stateful cache or queue?

Usually you do not replicate caches; the new region starts cold and you shed load while it warms. Queues and logs (Kafka with MirrorMaker, for example) can be mirrored, but consumers must map their offsets to the new cluster and tolerate replays.

## Go deeper

- [AWS, Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html): the four strategies with their costs, RPO, and RTO.
- [Google SRE Book, Data integrity](https://sre.google/sre-book/data-integrity/): why restores, not backups, are the goal, and how Google tests them.
- [AWS, DynamoDB global tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html): how a multi-writer table replicates and resolves conflicts.
- [Spanner, TrueTime and external consistency](https://cloud.google.com/spanner/docs/true-time-external-consistency): how Spanner keeps writes consistent across regions.
