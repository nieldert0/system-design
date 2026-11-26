---
slug: availability-patterns
title: Availability patterns
section: availability
readFirst:
  - consistency-patterns
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, Availability patterns
    url: https://github.com/donnemartin/system-design-primer#availability-patterns
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What are the two complementary patterns for high availability?
    options:
      - Caching and sharding
      - Fail-over and replication
      - Polling and pushing
      - TCP and UDP
    correct: 1
    explanation: The primer names fail-over and replication.
  - prompt: In active-passive fail-over, how does the passive server know to take over?
    options:
      - A user emails it
      - Heartbeats between the servers stop arriving
      - DNS tells it
      - It always handles half the traffic
    correct: 1
    explanation: When the heartbeat is interrupted, the passive server takes over the active's IP address.
  - prompt: What decides downtime length in active-passive?
    options:
      - The DNS TTL only
      - Whether the passive server is in hot or cold standby
      - The number of users
      - The database type
    correct: 1
    explanation: Hot standby is already running; cold standby must start up first.
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
    explanation: In parallel, total is 1 − (0.001 × 0.001) = 0.999999.
  - prompt: About how much downtime per year does 99.99% (four 9s) allow?
    options:
      - 8 hours 45 minutes
      - About 52 minutes
      - 8.6 seconds
      - 1 day
    correct: 1
    explanation: Four 9s allows about 52 minutes 36 seconds per year.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

High availability means the service keeps answering when parts of it fail. You get there with spare copies and a way to switch to them.

## What it is

There are two complementary patterns to support high availability: **<Term id="failover">fail-over</Term>** and **replication**. <Src id="primer" />

Availability is often quantified by uptime (or downtime) as a percentage of time the service is available. Availability is generally measured in number of 9s--a service with 99.99% availability is described as having four 9s. <Src id="primer" />

## How it works

**Active-passive.** With active-passive fail-over, heartbeats are sent between the active and the passive server on standby. If the heartbeat is interrupted, the passive server takes over the active's IP address and resumes service. The length of downtime is determined by whether the passive server is already running in 'hot' standby or whether it needs to start up from 'cold' standby. Only the active server handles traffic. <Src id="primer" />

**Active-active.** In active-active, both servers are managing traffic, spreading the load between them. If the servers are public-facing, the DNS would need to know about the public IPs of both servers. If the servers are internal-facing, application logic would need to know about both servers. <Src id="primer" />

**Replication** keeps copies of the data on several machines; it is covered in the Databases section.

**Availability in numbers.** <Src id="primer" />

| Downtime allowed | 99.9% (three 9s) | 99.99% (four 9s) |
|---|---|---|
| Per year | 8h 45min 57s | 52min 35.7s |
| Per month | 43m 49.7s | 4m 23s |
| Per week | 10m 4.8s | 1m 5s |
| Per day | 1m 26.4s | 8.6s |

If a service consists of multiple components prone to failure, the service's overall availability depends on whether the components are in sequence or in parallel. <Src id="primer" />

- **In sequence**, overall availability decreases: Availability (Total) = Availability (Foo) * Availability (Bar). If both `Foo` and `Bar` each had 99.9% availability, their total availability in sequence would be 99.8%. <Src id="primer" />
- **In parallel**, overall availability increases: Availability (Total) = 1 - (1 - Availability (Foo)) * (1 - Availability (Bar)). If both `Foo` and `Bar` each had 99.9% availability, their total availability in parallel would be 99.9999%. <Src id="primer" />

## Trade-offs

- Fail-over adds more hardware and additional complexity. <Src id="primer" />
- There is a potential for loss of data if the active system fails before any newly written data can be replicated to the passive. <Src id="primer" />
- Active-active uses all hardware but needs both sides to handle shared state; active-passive is simpler but leaves capacity idle.
- Every extra 9 costs roughly an order of magnitude more effort.

## Interview tips

- Ask for the availability target, then remove single points of failure until the math reaches it.
- Count the chain: every service a request passes through in sequence lowers the total.
- Mention health checks and automatic fail-over; manual fail-over at 3 a.m. eats the downtime budget.
