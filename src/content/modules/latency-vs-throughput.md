---
slug: latency-vs-throughput
title: Latency vs throughput
section: start-here
readFirst:
  - performance-vs-scalability
sources:
  - id: primer
    title: The System Design Primer
    url: https://github.com/donnemartin/system-design-primer#latency-vs-throughput
    license: CC BY 4.0
    use: copied
  - id: primer-numbers
    title: The System Design Primer, latency numbers
    url: https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know
    license: CC BY 4.0
    use: copied
  - id: wiki-little
    title: Wikipedia, Little's law
    url: https://en.wikipedia.org/wiki/Little%27s_law
    license: CC BY-SA 4.0
    use: copied
  - id: wiki-throughput
    title: Wikipedia, Network throughput
    url: https://en.wikipedia.org/wiki/Network_throughput
    license: CC BY-SA 4.0
    use: copied
quiz:
  - prompt: A service handles 2,000 requests per second, and each request takes 50 ms. What is 2,000 requests per second?
    options:
      - Its latency
      - Its throughput
      - Its bandwidth
      - Its p99
    correct: 1
    explanation: Throughput is a rate, actions per unit of time. Latency is how long each one takes (50 ms).
  - prompt: Each request takes 100 ms and the server works on 20 requests at once. Roughly what throughput does it reach?
    options:
      - 20 requests per second
      - 100 requests per second
      - 200 requests per second
      - 2,000 requests per second
    correct: 2
    explanation: Little's law gives throughput = work in flight / latency = 20 / 0.1 s = 200 per second.
  - prompt: A server goes from 50% to 95% busy. What usually happens to latency?
    options:
      - It stays flat until the server hits 100%
      - It climbs steeply, because requests wait in a queue
      - It drops, because the server is warmed up
      - It changes only if throughput falls
    correct: 1
    explanation: Near full load, new requests queue behind the ones being served, so waiting time grows fast.
  - prompt: Why do teams report p99 latency and not only the average?
    options:
      - The average is harder to compute
      - p99 is always lower than the average
      - The average hides the slow requests users actually feel
      - p99 measures throughput as well
    correct: 2
    explanation: A few very slow requests barely move the average but hurt users, especially when one page calls many services.
  - prompt: You batch 100 writes into one disk write. What is the usual effect?
    options:
      - Higher throughput, higher latency for each write
      - Lower throughput, lower latency for each write
      - Higher throughput, lower latency for each write
      - No change to either
    correct: 0
    explanation: One disk write carries many items, so throughput rises, but each item waits for the batch to fill.
  - prompt: How does throughput relate to bandwidth?
    options:
      - They are the same thing
      - Throughput is the capacity; bandwidth is what you achieve
      - Bandwidth is the maximum capacity; throughput is what you actually achieve, always less
      - Throughput is measured in milliseconds
    correct: 2
    explanation: Bandwidth is the ceiling of a channel. Throughput is the real rate delivered, which is always below it.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import LatencyThroughput from '#lib/diagrams/LatencyThroughput.svelte';
	import QueueWalkthrough from '#lib/diagrams/QueueWalkthrough.svelte';
</script>

**<Term id="latency">Latency</Term>** is how long one thing takes. **<Term id="throughput">Throughput</Term>** is how many things get done in a given time. Good systems push throughput up while keeping latency acceptable.

## What it is

**<Term id="latency">Latency</Term>** is the time to perform some action or to produce some result. <Src id="primer" />

**Throughput** is the number of such actions or results per unit of time. <Src id="primer" />

Generally, you should aim for **maximal throughput** with **acceptable latency**. <Src id="primer" />

## How it works

Think of a motorway. Latency is how long one car takes to drive from one end to the other. Throughput is how many cars pass the exit each minute. Adding lanes raises throughput without making any single car faster. Raising the speed limit lowers latency, and only raises throughput as a side effect.

<LatencyThroughput />

The two are measured in different units:

- **Latency** is a time: milliseconds per request, or seconds per job.
- **Throughput** is a rate: requests per second, messages per second, or megabytes per second.

Don't confuse throughput with <Term id="bandwidth">bandwidth</Term>. Bandwidth is the maximum achievable speed or capacity. Throughput is the actual speed or capacity achieved and is always less than bandwidth. <Src id="wiki-throughput" />

They are linked by how much work is in flight at once. If every request takes 100 ms and the server works on 10 requests at a time, it finishes about 10 / 0.1 = 100 requests per second. This is <Term id="littles-law">Little's law</Term> from queueing theory:

> the long-term average number of customers (L) in a stationary system is equal to the long-term average effective arrival rate (λ) multiplied by the average time that a customer spends in the system (W). <Src id="wiki-little" />

In system design terms: *work in flight = throughput × latency*. You can raise throughput by doing more at once (more threads, more servers, bigger batches) even when each request is no faster.

### Latency grows as a system fills up

A server at 30% load answers almost at once. At 90% load, new requests wait in a queue behind the ones already being served, so latency climbs steeply even though throughput barely rises. Pushing a system near 100% busy is the usual way to get high throughput *and* bad latency.

<QueueWalkthrough />

### Look at the slow requests, not the average

An average hides the requests that hurt. Teams report latency as percentiles: **p50** (the median), **p95** and **p99** (the slowest 1 in 100). If one page load calls 20 services, the chance that at least one of them hits its p99 is high, so the tail decides how the page feels.

### Rough numbers to reason with

Handy metrics, as the Primer lists them: <Src id="primer-numbers" />

- Read sequentially from HDD at 30 MB/s
- Read sequentially from 1 Gbps Ethernet at 100 MB/s
- Read sequentially from SSD at 1 GB/s
- Read sequentially from main memory at 4 GB/s
- 6-7 world-wide round trips per second
- 2,000 round trips per second within a data center

## Trade-offs

- **Batching** raises throughput (one disk write or network call carries many items) but each item waits for the batch to fill, so latency rises.
- **Queues** absorb bursts and keep throughput steady, but every item waiting in the queue adds latency.
- **Running hot** (high utilisation) gets the most work out of each server but makes latency spiky. Leaving headroom costs money and buys predictable latency.
- **Parallelism** (more servers or threads) raises throughput. It only lowers latency when one request can be split across them.
- **Caching** and **moving data closer** (a <Term id="cdn">CDN</Term>, a replica in the user's region) lower latency, and often raise throughput too because the slow backend does less work.

## Interview tips

- Say which one the design is optimising. A chat app cares about latency. A nightly analytics job cares about throughput.
- Put numbers on both: "p99 under 200 ms at 5,000 requests per second" is a requirement; "fast" is not.
- Expect the follow-up "what happens at 10× traffic?" Talk about queueing, headroom and where you'd add capacity.
- When you add a queue, a batch or a <Term id="cache">cache</Term>, name the effect on latency and on throughput.
- Mention tail latency (p99) when a request fans out to many services.
