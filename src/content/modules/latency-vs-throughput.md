---
slug: latency-vs-throughput
title: Latency vs throughput
section: start-here
upgraded: true
readFirst:
  - performance-vs-scalability
sources:
  - id: primer
    title: The System Design Primer
    url: https://github.com/donnemartin/system-design-primer#latency-vs-throughput
    license: CC BY 4.0
    use: reworded
  - id: primer-numbers
    title: The System Design Primer, latency numbers
    url: https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know
    license: CC BY 4.0
    use: copied
  - id: wiki-little
    title: Wikipedia, Little's law
    url: https://en.wikipedia.org/wiki/Little%27s_law
    license: CC BY-SA 4.0
    use: quoted
  - id: wiki-throughput
    title: Wikipedia, Network throughput
    url: https://en.wikipedia.org/wiki/Network_throughput
    license: CC BY-SA 4.0
    use: reworded
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
  - prompt: In the worked example, a server needs 10 ms of work per request. Using the rule latency ≈ service time / (1 − utilisation), what is the average latency at 90% busy?
    options:
      - About 11 ms
      - About 20 ms
      - About 100 ms
      - About 1 second
    correct: 2
    explanation: 10 ms / (1 − 0.9) = 100 ms. Going from 50% to 90% busy multiplies latency by five even though throughput rose by less than double.
  - prompt: In the worked example, a page calls 20 backends in parallel, each with a 1% chance of a slow response. Roughly what share of page loads hit at least one slow backend?
    options:
      - 1%
      - About 5%
      - About 18%
      - 20% exactly
    correct: 2
    explanation: The chance that all 20 are fast is 0.99^20 ≈ 0.82, so about 18% of pages see at least one slow call. Fan-out turns a backend's p99 into the page's p82.
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

**<Term id="latency">Latency</Term>** is how long one thing takes. **<Term id="throughput">Throughput</Term>** is how many things get done in a given time. Good systems push throughput up while keeping latency acceptable, and the two pull against each other as a system fills up.

## What it is

Here is the failure. A team load-tests its API and proudly reports "it handles 5,000 requests per second". In production at 4,500 per second, users complain that pages take seconds to load. Nothing is broken: the server really does complete 5,000 requests a second, but at 90% busy each request spends most of its life waiting in a queue. The team measured throughput and forgot latency.

The two words name different things:

- **Latency** is the time it takes to do one action or produce one result. <Src id="primer" /> It is measured in time units: milliseconds per request, seconds per job.
- **Throughput** is how many of those actions or results complete per unit of time. <Src id="primer" /> It is a rate: requests per second, messages per second, megabytes per second.

The usual goal is the **most throughput you can get while latency stays acceptable**. <Src id="primer" /> "Acceptable" has to be a number, and it is normally stated as a <Term id="percentile">percentile</Term>: "p99 under 200 ms at 5,000 requests per second" is a requirement, "fast" is not.

## How it works

Think of a motorway. Latency is how long one car takes to drive from one end to the other. Throughput is how many cars pass the exit each minute. Adding lanes raises throughput without making any single car faster. Raising the speed limit lowers latency, and raises throughput only as a side effect.

<LatencyThroughput />

### Throughput is not bandwidth

<Term id="bandwidth">Bandwidth</Term> is the maximum rate a channel can carry, such as a 1 Gbps network link. Throughput is the rate you actually achieve over it, and it is always lower, because of protocol overhead, retransmissions and waiting. <Src id="wiki-throughput" /> A 1 Gbps link typically moves about 100 MB/s of useful data, not the 125 MB/s the raw number suggests.

### Little's law ties them together

How many requests are in progress at once links the two. <Term id="littles-law">Little's law</Term> from queueing theory says:

> the long-term average number of customers (L) in a stationary system is equal to the long-term average effective arrival rate (λ) multiplied by the average time that a customer spends in the system (W). <Src id="wiki-little" />

In system design terms: **requests in flight = throughput × latency**. If each request takes 100 ms and a server can work on 10 at a time, it finishes at most 10 / 0.1 = 100 requests per second. You can raise throughput by doing more at once (more threads, more servers, bigger batches) even when each request is no faster. And you can run the law the other way to size a system: at 2,000 requests per second and 50 ms each, about 100 requests are in flight, so you need at least 100 worker slots, plus headroom.

### Latency grows as a system fills up

A server at 30% load answers almost at once, because a new request rarely finds another one ahead of it. At 90% load, a new request usually arrives while others are being served and has to wait. A handy rule of thumb from simple queueing models is:

*average latency ≈ service time / (1 − utilisation)*

where service time is how long the work itself takes and <Term id="utilisation">utilisation</Term> is the fraction of time the server is busy. At 50% busy, latency is twice the service time. At 90%, ten times. At 99%, a hundred times. Real systems differ in the details, but the shape, a curve that bends sharply upward as you approach 100%, holds almost everywhere. That is why pushing a system to full utilisation is the usual way to get high throughput *and* bad latency.

<QueueWalkthrough />

### Look at the slow requests, not the average

An average hides the requests that hurt. Teams report latency as percentiles: **p50** (the median), **p95**, and **p99** (the slowest 1 in 100). The slow end is called <Term id="tail-latency">tail latency</Term>. It matters most when one user action fans out to many services: the page is as slow as its slowest call, so a rare slow response in each backend becomes a common slow page.

### Rough numbers to reason with

Handy metrics, as the Primer lists them: <Src id="primer-numbers" />

- Read sequentially from HDD at 30 MB/s
- Read sequentially from 1 Gbps Ethernet at 100 MB/s
- Read sequentially from SSD at 1 GB/s
- Read sequentially from main memory at 4 GB/s
- 6-7 world-wide round trips per second
- 2,000 round trips per second within a data center

[Back-of-the-envelope numbers](/modules/back-of-the-envelope) has the full table and shows how to use it.

## Worked example

A search API runs on servers where each request needs **10 ms of CPU** (its service time). Each server works on one request per core and has 8 cores. The target is **p99 under 100 ms** at a peak of **4,000 requests per second**.

**Step 1, the ceiling.** One core can complete at most 1 / 0.01 s = 100 requests per second, so one 8-core server tops out at **800 requests per second**. That is its throughput at 100% busy, which we will never want to run at.

**Step 2, latency as load rises.** Using average latency ≈ 10 ms / (1 − utilisation):

- At 400 requests/s per server (50% busy): about **20 ms**.
- At 640 requests/s (80% busy): about **50 ms**.
- At 720 requests/s (90% busy): about **100 ms** on average, so the p99 is far above it.

From 50% to 90% busy, throughput rose by 80% but average latency rose by 400%. The p99 grows faster still, often to several times the average.

**Step 3, size the fleet.** To keep p99 under 100 ms, aim for average latency of roughly 25 ms, which means about 60% busy, or 480 requests/s per server. At 4,000 requests/s that is 4,000 / 480 ≈ **9 servers**, and 10 or 11 to survive losing one. Sizing from the throughput ceiling alone (4,000 / 800 = 5 servers) would have met the throughput number and blown the latency target.

**Step 4, check with Little's law.** At 4,000 requests/s and about 25 ms each, 4,000 × 0.025 = **100 requests are in flight** across the fleet. Ten servers with 8 cores each give 80 slots doing work, and the rest wait briefly in queues, which is consistent with the 60% plan.

**Step 5, fan-out.** The web page that calls this API also calls 19 other backends in parallel, each with a 1% chance of a slow (p99) response. The chance all 20 are fast is 0.99^20 ≈ 0.82, so about **18% of page loads** hit at least one slow backend. To make the page's p99 good, each backend needs a much better tail, for example p99.9, or the page needs a fix such as <Term id="hedged-requests">hedged requests</Term>: send a duplicate request to a second replica if the first has not answered within the p95 time, and take whichever answer comes first.

## In the real world

- **Google's "The Tail at Scale".** Dean and Barroso's paper showed that in a service fanning out to 100 servers, a 1-in-100 slow server makes 63% of user requests slow, and described hedged and tied requests as fixes. Google's search and Bigtable use these to cut tail latency at the cost of a few percent more load.
- **Kafka producer batching.** Kafka trades latency for throughput through two settings: `linger.ms` (how long the producer waits to fill a batch; it has long defaulted to 0 and is 5 ms in recent versions) and `batch.size` (default 16 KB). Raising `linger.ms` to 10 to 50 ms often multiplies throughput, and adds that much latency to each message.
- **Nginx and TCP's Nagle algorithm.** Nagle's algorithm batches small TCP writes to save packets, which adds latency to interactive traffic. Nginx enables `tcp_nodelay` on keep-alive connections by default to turn it off, choosing latency over a little network efficiency.
- **Service level objectives.** Google's SRE practice writes latency targets as percentiles with a throughput context, such as "99% of requests under 300 ms, measured over 28 days", and alerts when the error budget burns too fast. Prometheus histograms and the `histogram_quantile` function are the common way to compute those percentiles.

## Trade-offs

- **Batching** raises throughput (one disk write or network call carries many items) but each item waits for the batch to fill, so latency rises.
- **Queues** absorb bursts and keep throughput steady, but every item waiting in the queue adds latency. [Queues and back-pressure](/modules/queues-and-back-pressure) covers how to keep them bounded.
- **Running hot** (high utilisation) gets the most work out of each server but makes latency spiky. Leaving headroom costs money and buys predictable latency.
- **Parallelism** (more servers or threads) raises throughput. It only lowers latency when one request can be split across them.
- **Caching** and **moving data closer** (a <Term id="cdn">CDN</Term>, a replica in the user's region) lower latency, and often raise throughput too because the slow backend does less work.
- **Hedged requests** cut tail latency but add load, so cap them at a few percent of traffic.

## Interview tips

- Say which one the design is optimising. A chat app cares about latency. A nightly analytics job cares about throughput.
- Put numbers on both: "p99 under 200 ms at 5,000 requests per second" is a requirement; "fast" is not.
- Expect the follow-up "what happens at 10× traffic?" Talk about queueing, headroom and where you'd add capacity.
- When you add a queue, a batch or a <Term id="cache">cache</Term>, name the effect on latency and on throughput.
- Mention tail latency (p99) when a request fans out to many services.

**Common mistakes:**

- **Sizing servers from peak throughput alone.** A server that can do 800 requests per second at 100% busy gives terrible latency at 750. Size for 50 to 70% utilisation.
- **Reporting averages.** An average of 40 ms can hide a p99 of 2 seconds. Always quote percentiles.
- **Averaging percentiles across servers.** The p99 of a fleet is not the mean of each server's p99; compute it from the combined distribution (for example merged histograms).
- **Confusing bandwidth with throughput.** A 10 Gbps link does not mean 10 Gbps of application data per second.

## Common follow-up questions

### How would you lower latency without hurting throughput?

Remove work rather than reorder it: cache hot results, add an index, move data closer to users with a CDN or regional replica, and cut sequential round trips by batching or parallelising calls within one request. These shrink service time, which lowers latency and, by Little's law, raises throughput for the same number of workers.

### Why does latency spike long before CPU reaches 100%?

Because arrivals are bursty. Even at 70% average load, short bursts briefly exceed capacity and build a queue, and the closer the average gets to 100%, the longer those queues take to drain. Other shared resources (a connection pool, a lock, disk I/O) can also saturate before CPU does.

### What is the difference between p99 and maximum latency, and which should you target?

p99 is the latency that 99% of requests beat; the maximum is the single worst request, often a garbage-collection pause or a retry, and it is too noisy to target. Most teams set objectives on p99 or p99.9 and investigate the maximum only when it is part of a pattern.

### When is it right to trade latency for throughput?

When nobody is waiting on each individual item: log shipping, analytics pipelines, email sending, bulk imports. There, large batches and deep queues are cheap. For anything a user is waiting on, keep batches small and queues short.

## Go deeper

- [The Tail at Scale (Dean and Barroso, CACM 2013)](https://research.google/pubs/the-tail-at-scale/): why fan-out makes tail latency dominate, and the hedged-request techniques Google uses.
- [Google SRE book, Service Level Objectives](https://sre.google/sre-book/service-level-objectives/): how to express latency targets as percentiles and why averages mislead.
- [Kafka producer configuration](https://kafka.apache.org/documentation/#producerconfigs): `linger.ms`, `batch.size` and the other knobs that trade latency for throughput.
- [Wikipedia, Little's law](https://en.wikipedia.org/wiki/Little%27s_law): the statement, the proof sketch and examples of using it to size systems.
