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
---

<script>
	import Src from '#lib/components/Src.svelte';
</script>

**Latency** is how long one thing takes. **Throughput** is how many things get done in a given time. Good systems push throughput up while keeping latency acceptable.

## What it is

**Latency** is the time to perform some action or to produce some result. <Src id="primer" />

**Throughput** is the number of such actions or results per unit of time. <Src id="primer" />

Generally, you should aim for **maximal throughput** with **acceptable latency**. <Src id="primer" />

## How it works

Think of a motorway. Latency is how long one car takes to drive from one end to the other. Throughput is how many cars pass the exit each minute. Adding lanes raises throughput without making any single car faster. Raising the speed limit lowers latency, and only raises throughput as a side effect.

The two are measured in different units:

- **Latency** is a time: milliseconds per request, or seconds per job.
- **Throughput** is a rate: requests per second, messages per second, or megabytes per second.

Don't confuse throughput with bandwidth. Bandwidth is the maximum achievable speed or capacity. Throughput is the actual speed or capacity achieved and is always less than bandwidth. <Src id="wiki-throughput" />

They are linked by how much work is in flight at once. If every request takes 100 ms and the server works on 10 requests at a time, it finishes about 10 / 0.1 = 100 requests per second. This is Little's law from queueing theory:

> the long-term average number of customers (L) in a stationary system is equal to the long-term average effective arrival rate (λ) multiplied by the average time that a customer spends in the system (W). <Src id="wiki-little" />

In system design terms: *work in flight = throughput × latency*. You can raise throughput by doing more at once (more threads, more servers, bigger batches) even when each request is no faster.

### Latency grows as a system fills up

A server at 30% load answers almost at once. At 90% load, new requests wait in a queue behind the ones already being served, so latency climbs steeply even though throughput barely rises. Pushing a system near 100% busy is the usual way to get high throughput *and* bad latency.

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
- **Caching** and **moving data closer** (a CDN, a replica in the user's region) lower latency, and often raise throughput too because the slow backend does less work.

## Interview tips

- Say which one the design is optimising. A chat app cares about latency. A nightly analytics job cares about throughput.
- Put numbers on both: "p99 under 200 ms at 5,000 requests per second" is a requirement; "fast" is not.
- Expect the follow-up "what happens at 10× traffic?" Talk about queueing, headroom and where you'd add capacity.
- When you add a queue, a batch or a cache, name the effect on latency and on throughput.
- Mention tail latency (p99) when a request fans out to many services.
