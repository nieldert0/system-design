---
slug: back-of-the-envelope
title: Back-of-the-envelope numbers
section: start-here
readFirst:
  - latency-vs-throughput
sources:
  - id: primer
    title: The System Design Primer, Appendix
    url: https://github.com/donnemartin/system-design-primer#appendix
    license: CC BY 4.0
    use: copied
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
  - prompt: About how much is 2^30 bytes?
    options:
      - 1 KB
      - 1 MB
      - 1 GB
      - 1 TB
    correct: 2
    explanation: 2^10 is about a thousand (KB), 2^20 about a million (MB), and 2^30 about a billion (GB).
  - prompt: You store 1 KB per user for 100 million users. About how much storage is that?
    options:
      - 100 MB
      - 1 GB
      - 100 GB
      - 100 TB
    correct: 2
    explanation: 10^3 bytes × 10^8 users = 10^11 bytes = 100 GB.
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

Rough estimates tell you how big a system must be before you design it. Know a handful of numbers, round hard, and aim for the right order of magnitude.

## What it is

You'll sometimes be asked to do 'back-of-the-envelope' estimates. For example, you might need to determine how long it will take to generate 100 image thumbnails from disk or how much memory a data structure will take. The **Powers of two table** and **<Term id="latency">Latency</Term> numbers every programmer should know** are handy references. <Src id="primer" />

A <Term id="back-of-the-envelope">back-of-the-envelope estimate</Term> is not meant to be exact. It answers questions like "does this fit on one machine?" or "do we need a <Term id="cache">cache</Term>?" in a minute or two.

## How it works

### The method

1. **Start from the requirements.** Daily active users, actions per user per day, size of each item, how long you keep data.
2. **Turn daily counts into per-second rates.** A day has 86,400 seconds; call it 10^5. So 10 million requests a day is about 100 per second.
3. **Allow for peaks.** Traffic is not flat. Multiply the average by 2–10 for the busiest hour.
4. **Work out storage.** Items per day × size × days kept. Then add <Term id="replication">replication</Term> (often ×3).
5. **Compare with what one machine can do.** That gives you the number of servers, disks or cache nodes.

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
Read 4 KB randomly from SSD*           150,000   ns      150 us          ~1GB/sec SSD
Read 1 MB sequentially from memory     250,000   ns      250 us
Round trip within same datacenter      500,000   ns      500 us
Read 1 MB sequentially from SSD*     1,000,000   ns    1,000 us    1 ms  ~1GB/sec SSD, 4X memory
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

The lessons to take from it: memory is far faster than disk, sequential reads beat random ones, and a trip across the world costs about 300 times a trip inside the data centre.

### A worked example

A photo app has 10 million daily users who each upload 2 photos of 500 KB.

- Uploads: 10^7 users × 2 = 2 × 10^7 photos a day, or about 200 per second on average, maybe 1,000 at peak.
- Storage per day: 2 × 10^7 × 500 KB = 10^13 bytes = 10 TB a day.
- Storage per year: about 3.6 PB, or about 11 PB with three copies.

The conclusion matters more than the digits: storage, not request rate, is the hard part, so the design should lean on <Term id="object-storage">object storage</Term> and a <Term id="cdn">CDN</Term>.

## Trade-offs

- **Speed vs precision.** Rounding to powers of ten keeps you fast and is right within a factor of a few. That is enough to choose a design.
- **Average vs peak.** Designing for the average falls over at peak. Designing for the worst moment of the year wastes money the rest of the time. State which you are using.
- **Assumptions drive everything.** A different item size or retention period can change the answer by 100×. Say your assumptions out loud so the interviewer can correct them.

## Interview tips

- Do the estimate early, right after requirements. It decides whether you need <Term id="sharding">sharding</Term>, caching or a CDN at all.
- Show your working: "10 million a day is about 100 per second, peak maybe 500."
- Round boldly and say so. Interviewers want orders of magnitude, not long division.
- End each estimate with what it means for the design.
