---
slug: back-of-the-envelope
title: Back-of-the-envelope numbers
section: start-here
upgraded: true
readFirst:
  - latency-vs-throughput
sources:
  - id: primer
    title: The System Design Primer, Appendix
    url: https://github.com/donnemartin/system-design-primer#appendix
    license: CC BY 4.0
    use: reworded
  - id: primer-latency
    title: The System Design Primer, Latency numbers every programmer should know
    url: https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: About how many seconds are in a day, rounded for estimates?
    options:
      - 10,000
      - 100,000
      - 1,000,000
      - 10,000,000
    correct: 1
    explanation: A day has 86,400 seconds; round to 100,000 (10^5) to keep the maths easy.
  - prompt: 10 million requests a day is roughly how many per second on average?
    options:
      - About 10
      - About 100
      - About 1,000
      - About 10,000
    correct: 1
    explanation: 10,000,000 / 100,000 seconds ≈ 100 requests per second on average. Peaks may be 2–10× that.
  - prompt: Which is fastest?
    options:
      - A round trip within the same data centre
      - Reading 1 MB sequentially from memory
      - An HDD seek
      - A packet from California to the Netherlands and back
    correct: 1
    explanation: Reading 1 MB from memory is about 250 µs, faster than a data centre round trip (500 µs), a disk seek (10 ms) or an intercontinental round trip (150 ms).
  - prompt: You store 1 KB per user for 100 million users. About how much storage is that?
    options:
      - 100 MB
      - 1 GB
      - 100 GB
      - 100 TB
    correct: 2
    explanation: 10^3 bytes × 10^8 users = 10^11 bytes = 100 GB.
  - prompt: In the worked example, the photo app stores about 11 PB a year including three copies. What does that tell you about the design?
    options:
      - Request rate is the hard part, so add many app servers
      - Storage dominates, so photos belong in object storage behind a CDN, with only metadata in a database
      - A single database server can hold it
      - It needs a bigger cache
    correct: 1
    explanation: Around 1,000 uploads per second at peak is modest, but petabytes a year rule out a normal database for the bytes. The estimate decides the architecture.
  - prompt: In the worked example, each viewed photo thumbnail is 50 KB and the app serves 50,000 views per second at peak. Roughly how much egress bandwidth is that?
    options:
      - About 25 Mbps
      - About 250 Mbps
      - About 2.5 Gbps
      - About 20 Gbps
    correct: 3
    explanation: 5 × 10^4 views × 5 × 10^4 bytes = 2.5 × 10^9 bytes per second, about 20 Gbps. That is why a CDN serves the images, not the origin.
  - prompt: Roughly how many round trips per second can a single client make between continents?
    options:
      - 6–7
      - 60–70
      - 2,000
      - 1 million
    correct: 0
    explanation: An intercontinental round trip takes about 150 ms, so only 6–7 fit in a second.
  - prompt: Why round numbers to powers of ten when estimating?
    options:
      - Interviewers require it
      - It keeps the arithmetic quick, and the answer only needs to be the right order of magnitude
      - Computers store numbers in base ten
      - It makes the answer exact
    correct: 1
    explanation: The goal is the right order of magnitude, fast. Rounding keeps attention on the design, not the arithmetic.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Rough estimates tell you how big a system must be before you design it. Know a handful of numbers, round hard, and aim for the right <Term id="order-of-magnitude">order of magnitude</Term>.

## What it is

Here is the failure. A candidate designs a photo-sharing service with a sharded relational database holding the images, three cache tiers and a fleet of app servers. The interviewer asks, "How much storage per year?" The candidate guesses "a few terabytes". The real answer is about 10 petabytes, which no relational database should hold, so the storage layer, the most expensive part of the system, is wrong from the start. Two minutes of arithmetic would have caught it.

A <Term id="back-of-the-envelope">back-of-the-envelope estimate</Term> is a quick, rough calculation that tells you the scale of a system before you design it. Typical questions are how long it takes to generate 100 image thumbnails from disk, or how much memory a data structure needs. <Src id="primer" /> It is not meant to be exact. It answers yes-or-no design questions in a minute or two: does this fit on one machine, do we need a <Term id="cache">cache</Term>, do we need <Term id="sharding">sharding</Term>, does a <Term id="cdn">CDN</Term> have to serve this?

Two reference tables make it fast: the **powers of two**, for sizes, and the **<Term id="latency">latency</Term> numbers every programmer should know**, for time. <Src id="primer" /> Together with a few conversion rules, they are all you need.

## How it works

### The method

1. **Start from the requirements.** Daily active users, actions per user per day, size of each item, how long you keep data. If the interviewer has not given numbers, propose some and say them out loud.
2. **Turn daily counts into per-second rates.** A day has 86,400 seconds; call it 10^5. So 10 million requests a day is about 100 per second. A month is about 2.5 × 10^6 seconds, a year about 3 × 10^7.
3. **Allow for peaks.** Traffic is not flat. Multiply the average by 2 to 10 for the busiest hour; consumer apps are often about 3×, while flash sales and live events can be far more.
4. **Split reads from writes.** Most systems read far more than they write. The read to write ratio decides whether caching or replicas matter.
5. **Work out storage.** Items per day × size × days kept. Then multiply for <Term id="replication">replication</Term> (often ×3) and indexes or overhead (often ×1.5 to 2).
6. **Work out bandwidth.** Requests per second × bytes per response. Convert bytes to bits (×8) when comparing with network links, which are rated in bits per second.
7. **Compare with what one machine can do.** That gives you the number of servers, disks or cache nodes, and tells you which tier needs to scale.

### Useful capacities for step 7

These are rough, and fine for an interview. A modern app server handles roughly 1,000 to 10,000 simple requests per second, depending on the work. A well-indexed relational database on one machine does thousands to tens of thousands of simple queries per second. Redis does around 100,000 operations per second per node. A server has tens to a few hundred gigabytes of RAM and tens of terabytes of disk, and a 10 Gbps network card. State the figure you use; the interviewer cares that you compared, not that you remembered a benchmark.

### Powers of two

Data sizes double, so powers of two are the quickest way to reason about them. <Src id="primer" />

```
Power           Exact Value         Approx Value        Bytes
---------------------------------------------------------------
7                             128
8                             256
10                           1024   1 thousand           1 KB
16                         65,536                       64 KB
20                      1,048,576   1 million            1 MB
30                  1,073,741,824   1 billion            1 GB
32                  4,294,967,296                        4 GB
40              1,099,511,627,776   1 trillion           1 TB
```

Each step of 10 in the power is about 1,000×: KB, MB, GB, TB, then PB (petabyte, 2^50, about 10^15 bytes). For estimates, treat 2^10 as 10^3 and stop worrying about the 2.4% difference.

### Latency numbers every programmer should know

<Src id="primer-latency" />

```
Latency Comparison Numbers
--------------------------
L1 cache reference                           0.5 ns
Branch mispredict                            5   ns
L2 cache reference                           7   ns                      14x L1 cache
Mutex lock/unlock                           25   ns
Main memory reference                      100   ns                      20x L2 cache, 200x L1 cache
Compress 1K bytes with Zippy            10,000   ns       10 us
Send 1 KB bytes over 1 Gbps network     10,000   ns       10 us
Read 4 KB randomly from SSD*           150,000   ns      150 us          `1GB/sec SSD
Read 1 MB sequentially from memory     250,000   ns      250 us
Round trip within same datacenter      500,000   ns      500 us
Read 1 MB sequentially from SSD*     1,000,000   ns    1,000 us    1 ms  `1GB/sec SSD, 4X memory
HDD seek                            10,000,000   ns   10,000 us   10 ms  20x datacenter roundtrip
Read 1 MB sequentially from 1 Gbps  10,000,000   ns   10,000 us   10 ms  40x memory, 10X SSD
Read 1 MB sequentially from HDD     30,000,000   ns   30,000 us   30 ms 120x memory, 30X SSD
Send packet CA->Netherlands->CA    150,000,000   ns  150,000 us  150 ms

Notes
-----
1 ns = 10^-9 seconds
1 us = 10^-6 seconds = 1,000 ns
1 ms = 10^-3 seconds = 1,000 us = 1,000,000 ns
```

The lessons to take from it: memory is far faster than disk, sequential reads beat random ones, and a trip across the world costs about 300 times a trip inside the data centre. The exact figures are from around 2012 and modern NVMe SSDs are several times faster, but the ratios between rows, which are what you reason with, have held up well. [Latency vs throughput](/modules/latency-vs-throughput) shows how to combine these with load.

## Worked example

A photo app has **10 million daily active users**. Each uploads **2 photos a day** at about **500 KB** each, and views **50 photos a day** as 50 KB thumbnails. Photos are kept forever.

**Step 1, write rate.** 10^7 users × 2 = 2 × 10^7 uploads a day. Divided by 10^5 seconds, that is **about 200 uploads per second** on average. With a 5× peak, **about 1,000 per second**. One app server could nearly handle that, so upload request rate is not the hard part.

**Step 2, read rate.** 10^7 × 50 = 5 × 10^8 views a day, or **about 5,000 per second** on average and **25,000 to 50,000 at peak**. The read to write ratio is 25:1, so read paths deserve caching.

**Step 3, storage.** 2 × 10^7 uploads × 5 × 10^5 bytes = 10^13 bytes, **10 TB a day**. Over a year, 10 TB × 365 ≈ 3.6 PB, and with three copies about **11 PB a year**. Add thumbnails (10% of original size, so roughly another 1 PB) and metadata: 2 × 10^7 rows a day × 500 bytes = 10 GB a day, about **3.6 TB a year** of metadata.

**Step 4, bandwidth.** At the 50,000-per-second peak, 5 × 10^4 views × 5 × 10^4 bytes = 2.5 × 10^9 bytes per second, which × 8 is about **20 Gbps** of egress. Uploads at peak add 1,000 × 500 KB = 500 MB/s, about 4 Gbps of ingress.

**Step 5, what it means for the design.**

- Petabytes of photos belong in <Term id="object-storage">object storage</Term> (such as Amazon S3), never in a relational database.
- 20 Gbps of thumbnails should come from a CDN, so the origin only serves cache misses. At a 95% CDN hit ratio the origin sees about 1 Gbps.
- Metadata at a few terabytes a year and a couple of thousand writes per second fits one database primary with replicas for a year or two, with sharding by user as the planned next step.
- Uploads should go straight from the client to object storage with a pre-signed URL, so app servers never carry the 4 Gbps of upload bytes.

The conclusion matters more than the digits: storage and egress, not request rate, are the hard parts. That single sentence is what the interviewer is listening for.

## In the real world

- **Amazon S3 request rates.** AWS documents that S3 supports at least 3,500 writes and 5,500 reads per second per prefix (a key path such as `photos/2026/`), and scales by spreading keys across prefixes. In an estimate, that tells you whether your upload rate needs a sharded key layout.
- **Redis throughput.** The `redis-benchmark` tool that ships with Redis typically reports on the order of 100,000 simple operations per second per node, and more with pipelining (the `-P` flag). It is the usual figure for "how many cache nodes".
- **AWS EC2 network limits.** Instance types advertise bandwidth such as "up to 12.5 Gbps" or "25 Gbps". A 20 Gbps egress estimate immediately tells you one origin server is not enough and a CDN such as CloudFront is required.
- **Jeff Dean's numbers.** The latency table above comes from talks by Google's Jeff Dean and Peter Norvig, and Google engineers use the same style of estimate to evaluate designs before building prototypes.

## Trade-offs

- **Speed vs precision.** Rounding to powers of ten keeps you fast and is right within a factor of a few. That is enough to choose a design.
- **Average vs peak.** Designing for the average falls over at peak. Designing for the worst moment of the year wastes money the rest of the time. State which you are using.
- **Assumptions drive everything.** A different item size or retention period can change the answer by 100×. Say your assumptions out loud so the interviewer can correct them.
- **Raw vs replicated sizes.** Raw data is the smallest number. Replication, indexes, backups and free space for growth often multiply it by 3 to 6, so say which number you mean.

## Interview tips

- Do the estimate early, right after requirements. It decides whether you need sharding, caching or a CDN at all.
- Show your working: "10 million a day is about 100 per second, peak maybe 500."
- Round boldly and say so. Interviewers want orders of magnitude, not long division.
- End each estimate with what it means for the design.

**Common mistakes:**

- **Mixing bits and bytes.** Network links are rated in bits per second; storage in bytes. Forgetting the ×8 makes bandwidth look eight times smaller than it is.
- **Forgetting the peak.** 100 requests per second on average can mean 1,000 at 9 a.m.
- **Forgetting replication and retention.** 10 TB a day sounds manageable until it is 11 PB after a year with three copies.
- **Estimating and then not using it.** A number that does not change a design decision was wasted time.

## Common follow-up questions

### How many servers do you need?

Divide peak load by what one server can handle at a safe utilisation, then add spares. If one server handles 2,000 requests per second at 60% busy and the peak is 20,000, that is 10 servers, plus one or two so losing a single server does not overload the rest. Surviving a whole availability zone needs more: size so the servers left after losing the largest zone still carry the peak at a safe load. Across three zones that means 10 servers' worth in any two, so 15 in total, 5 per zone. Say the per-server figure is an assumption to be confirmed by a load test.

### Will the data fit in memory?

Estimate the working set, the part of the data that is read often, not the whole dataset. If 20% of 1 TB is hot, that is 200 GB, which fits in a cache cluster of a few nodes with 64 GB each. If the whole dataset fits in one machine's RAM, a cache may be unnecessary and an in-memory store can be the primary.

### How long would a full scan or backup take?

Divide size by throughput. Reading 10 TB sequentially from SSD at about 1 GB/s takes 10^4 seconds, almost 3 hours on one disk, or minutes when spread over 50 machines in parallel. The same arithmetic tells you how long rebuilding a failed replica takes, which affects how many copies you keep.

### How do you estimate how many IDs or codes you need?

Multiply the creation rate by the lifetime and leave a large margin. 100 million new items a month for 10 years is 1.2 × 10^10; a 64-bit integer (about 1.8 × 10^19) is plenty, and 7 base62 characters (about 3.5 × 10^12) also fit. See the [URL shortener](/modules/url-shortener) for the full version.

## Go deeper

- [The System Design Primer, Appendix](https://github.com/donnemartin/system-design-primer#appendix): the powers-of-two and latency tables, with links to the original sources.
- [Latency numbers every programmer should know, interactive](https://colin-scott.github.io/personal_website/research/interactive_latency.html): Colin Scott's version of the table that projects each number to the current year.
- [Amazon S3 performance guidelines](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html): real per-prefix request limits to plug into storage estimates.
- [Redis benchmark](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/): how to measure, and what affects, per-node cache throughput.
