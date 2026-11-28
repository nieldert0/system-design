---
slug: probabilistic-data-structures
title: Probabilistic data structures
section: databases
readFirst:
  - back-of-the-envelope
sources:
  - id: wiki-bloom
    title: Wikipedia, Bloom filter
    url: https://en.wikipedia.org/wiki/Bloom_filter
    license: CC BY-SA 4.0
    use: reworded
  - id: hll-paper
    title: "HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm (Flajolet et al., 2007)"
    url: https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf
    license: Paper, cited
    use: reworded
  - id: cms-paper
    title: "An Improved Data Stream Summary: The Count-Min Sketch and its Applications (Cormode and Muthukrishnan, 2005)"
    url: http://dimacs.rutgers.edu/~graham/pubs/papers/cm-full.pdf
    license: Paper, cited
    use: reworded
  - id: redis-hll
    title: Redis docs, HyperLogLog
    url: https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/
    license: Documentation, cited
    use: reworded
  - id: cuckoo-paper
    title: "Cuckoo Filter: Practically Better Than Bloom (Fan et al., CoNEXT 2014)"
    url: https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf
    license: Paper, cited
    use: reworded
quiz:
  - prompt: A Bloom filter answers "maybe present" for a key. What do you know?
    options:
      - The key is definitely in the set
      - The key is probably in the set, so you must check the real store to be sure
      - The key is definitely not in the set
      - The filter is full
    correct: 1
    explanation: Bloom filters have false positives but never false negatives, so "maybe" must be confirmed and "no" can be trusted.
  - prompt: About how many bits per item does a Bloom filter need for a 1% false-positive rate, and how many hash functions?
    options:
      - 1 bit and 1 hash
      - About 9.6 bits and 7 hashes
      - About 64 bits and 2 hashes
      - About 100 bits and 20 hashes
    correct: 1
    explanation: m/n = −ln(0.01)/(ln 2)² ≈ 9.6 and k = (m/n)·ln 2 ≈ 6.6, rounded to 7.
  - prompt: In the worked example, 19,980 of the 20,000 checks per second are for URLs that are not blocked, and the filter has a 1% false-positive rate. About how many database lookups per second remain?
    options:
      - 20,000
      - About 220
      - About 20
      - 0
    correct: 1
    explanation: 19,980 × 0.01 ≈ 200 false positives plus the 20 real hits must still go to the database.
  - prompt: The same filter, sized for 1M URLs, ends up holding 2M. What happens?
    options:
      - New inserts fail
      - It starts returning false negatives
      - The false-positive rate climbs from about 1% to about 16%, so database lookups rise roughly fifteenfold
      - Nothing, Bloom filters grow automatically
    correct: 2
    explanation: With half the bits per item (about 4.8) and still 7 hashes, (1 − e^(−7/4.79))^7 ≈ 0.157. It never gives false negatives, it just says "maybe" far more often.
  - prompt: Why does Redis's HyperLogLog use 12 KB and have a standard error of about 0.81%?
    options:
      - It stores a sample of 1,500 items
      - It has 16,384 six-bit registers (12,288 bytes) and the error is 1.04/√16384 = 1.04/128
      - It compresses the full set with gzip
      - It keeps one bit per possible user
    correct: 1
    explanation: 16,384 × 6 bits = 98,304 bits = 12,288 bytes, and 1.04/128 ≈ 0.81%.
  - prompt: You have a daily HyperLogLog of unique visitors for each of 7 days. How do you get weekly unique visitors?
    options:
      - Add the seven daily counts
      - Merge the seven sketches by taking the maximum of each register, then estimate the merged sketch
      - Average the seven counts
      - It cannot be done without the raw IDs
    correct: 1
    explanation: Adding counts double-counts people who came on several days. Register-wise max gives the sketch of the union (PFMERGE in Redis).
  - prompt: A count-min sketch has width 2,719 and depth 5 and has seen 10 million clicks. A URL with 100 real clicks reads as 4,000. Is the sketch broken?
    options:
      - Yes, counts must be exact
      - No; it only overestimates, by up to about εN = 10,000 with 99% probability, which swamps small counts but is small next to heavy hitters
      - Yes, it should underestimate
      - No, it means the URL had 4,000 clicks
    correct: 1
    explanation: Collisions only add, and the bound is relative to the total stream, so the sketch is accurate for big counts and noisy for the long tail.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import BloomFilterFlow from '#lib/diagrams/BloomFilterFlow.svelte';
</script>

Probabilistic data structures answer questions about huge sets and streams ("have I seen this?", "how many distinct?", "how often?", "which are the most common?") in kilobytes or megabytes of memory, by accepting a small, bounded, known error. They show up inside databases, caches, CDNs and analytics pipelines, and they are the usual answer when an interviewer asks how to do something "at scale" without storing everything.

## What it is

Here is the problem. You want to count unique visitors to a site with 100 million visitors a day. Storing each 8-byte visitor ID in a hash set takes at least 800 MB per day before overhead, and real hash sets with pointers take two to four times that. Keeping 30 days for every page multiplies it again. Or you want to know whether a key exists in a file on disk before reading it, and the answer is usually "no", so most of your disk reads are wasted.

A **probabilistic data structure** gives up exactness for a fixed, tiny memory footprint. Instead of the items themselves, it keeps a compact summary built with hash functions, and it answers with an error you choose in advance. The four you need for interviews are:

- **<Term id="bloom-filter">Bloom filter</Term>**: "is x in the set?" It answers "definitely not" or "maybe". About 1.2 MB for a million items at a 1% <Term id="false-positive">false-positive</Term> rate. <Src id="wiki-bloom" />
- **<Term id="hyperloglog">HyperLogLog</Term>**: "how many distinct items?" About 12 KB to count billions of distinct items within about 1%. <Src id="hll-paper" />
- **<Term id="count-min-sketch">Count-min sketch</Term>**: "how many times did x occur?" It never undercounts and overcounts by a bounded amount. <Src id="cms-paper" />
- **Top-k <Term id="heavy-hitters">heavy hitters</Term>**: "which items occur most?" Usually a count-min sketch plus a small heap, or a dedicated counter algorithm.

They all rely on the same trick: a good hash function turns any item into what looks like a random number, and random numbers have statistics you can reason about precisely.

## How it works

### Bloom filter

A Bloom filter is an array of **m bits**, all zero at first, and **k independent hash functions**, each mapping an item to one of the m positions. <Src id="wiki-bloom" />

1. **Insert x:** compute the k positions h1(x) … hk(x) and set those bits to 1.
2. **Query x:** compute the same k positions. If any bit is 0, x was never inserted: the answer is **definitely not**. If all k bits are 1, the answer is **maybe**, because those bits might have been set by other items.

<BloomFilterFlow />

So a Bloom filter has **no false negatives** and a tunable rate of false positives. That shape is what makes it useful: you put it in front of something expensive (a disk read, a network call, a database query) and skip the expensive step whenever the filter says no.

**Sizing.** For n items and a target false-positive rate p, the optimal size and number of hashes are: <Src id="wiki-bloom" />

- m = −n · ln p / (ln 2)²
- k = (m / n) · ln 2

Plugging in numbers:

| Target p | Bits per item (m/n) | Hashes (k) | Memory for 1M items |
| --- | --- | --- | --- |
| 1% | 9.59 | 6.6 → 7 | about 1.2 MB |
| 0.1% | 14.4 | 10.0 → 10 | about 1.8 MB |

Each tenfold drop in the false-positive rate costs about 4.8 more bits per item (ln 10 / (ln 2)² ≈ 4.79), so accuracy is cheap. Note that the size depends on n and p, not on how big the items are: a million 2 KB URLs cost the same 1.2 MB as a million integers.

You do not need k truly separate hash functions. The standard trick computes two hashes, h1 and h2 (for example the two halves of a 128-bit MurmurHash), and uses h1 + i·h2 for i = 0 … k−1, which works as well in practice.

**What a Bloom filter cannot do.** You cannot delete, because clearing a bit might erase evidence of another item that shares it. You cannot list the items. And it degrades as it fills: past its planned n, the false-positive rate climbs fast (the worked example shows how fast).

**Variants that delete.** A **counting Bloom filter** replaces each bit with a small counter (typically 4 bits), incrementing on insert and decrementing on delete, at about four times the memory. A **<Term id="cuckoo-filter">cuckoo filter</Term>** stores a short fingerprint of each item in a cuckoo hash table; it supports deletion, and for false-positive rates below about 3% it uses less space than a Bloom filter. <Src id="cuckoo-paper" /> Its catch: inserts can fail when the table is nearly full, so you must size it with headroom.

### HyperLogLog

HyperLogLog estimates the number of distinct items, the *cardinality*, of a stream. The intuition: hash each item to a random-looking bit string and look at how many leading zeros it has. Half of all hashes start with 0, a quarter with 00, one in 2^r with r zeros. If the longest run of leading zeros you have ever seen is 20, you have probably seen around 2^20, about a million, distinct items. Duplicates do not matter, because the same item always hashes the same way. <Src id="hll-paper" />

One such estimate is very noisy, so HyperLogLog splits the stream into **m buckets, called registers**:

1. Hash the item to 64 bits.
2. Use the first b bits to pick a register (m = 2^b registers).
3. Count the leading zeros in the remaining bits, plus one, and store it in that register if it is bigger than what is there.
4. To estimate, combine all registers with a harmonic mean, scale by m and a correction constant, and apply small-range and large-range corrections.

The standard error is about **1.04 / √m**. More registers means more accuracy: 4× the memory halves the error. Each register only has to hold a number up to 64, so 6 bits is enough. <Src id="hll-paper" />

Two HyperLogLogs built with the same hash and m can be **merged** by taking the maximum of each register. The result is exactly the sketch you would have built from the union of both streams. That is what makes HLL useful in distributed systems: each server or each hour builds its own sketch, and you combine them later. What you cannot do is subtract or intersect reliably; intersections via inclusion-exclusion (|A| + |B| − |A ∪ B|) have errors relative to the union, which swamp small overlaps.

### Count-min sketch

A count-min sketch estimates how often each item appears in a stream. It is a grid of counters with **d rows** (depth) and **w columns** (width), and one hash function per row. <Src id="cms-paper" />

1. **Increment x:** in each row i, add 1 to the counter at column hᵢ(x).
2. **Query x:** read the d counters x maps to and return the **minimum**.

Every counter x touches holds x's true count plus whatever other items collided into it, so each one is an overestimate, and the minimum is the least wrong. The sketch never undercounts.

The guarantee: with w = ⌈e / ε⌉ and d = ⌈ln(1/δ)⌉, the estimate is at most the true count plus **ε·N**, where N is the total of all increments, with probability at least 1 − δ. Width controls how big the error is; depth controls how often you exceed it. <Src id="cms-paper" />

The error is relative to the *whole stream*, not to the item. For an item with a large count, εN is a small fraction. For a rare item, εN can be bigger than its true count. So count-min sketches are good at answering "how big are the big ones?" and bad at the long tail. A common refinement, *conservative update*, only increments the counters that are currently at the minimum, which reduces overcounting without changing memory.

### Top-k heavy hitters

To find the k most frequent items in a stream, keep a count-min sketch for counts plus a **min-heap of size k** for candidates. On each item, increment the sketch, read its estimate, and if it beats the smallest count in the heap, insert it (or update it if already there) and evict the smallest. Memory is the sketch plus k entries.

The deterministic alternatives are **Misra-Gries** and **Space-Saving**, which keep exactly k counters: when a new item arrives and all counters are taken, Space-Saving replaces the item with the smallest count and inherits that count plus one. Any item that appears more than N/k times is guaranteed to be in the list. These are what most "trending" and "top talkers" features use under the hood.

At large scale this becomes a sharded job: each node keeps its own sketch and heap for a time window, and an aggregator merges sketches (count-min sketches with the same hashes merge by adding counters cell by cell) and recomputes the top k. See [pub/sub and event streaming](/modules/pub-sub-and-event-streaming) for the pipeline around it.

## Worked example

A link-redirect service, a bit like the [URL shortener](/modules/url-shortener), handles **20,000 redirects/s**. It needs three things: block malicious links, report daily unique visitors, and show the top links of the last hour.

**Step 1, size a Bloom filter for the block list.** There are **1 million** blocked URLs, stored in a database where each lookup costs about 2 ms. Only about 1 in 1,000 redirects is for a blocked link, so 20 of the 20,000 per second, and 19,980 are not.

- Target p = 1%: m/n = −ln(0.01)/(ln 2)² = 4.605 / 0.4805 ≈ **9.59 bits per item**.
- m = 9.59 × 1,000,000 ≈ 9.59 million bits ≈ **1.2 MB**, small enough to keep in every web server's memory.
- k = 9.59 × 0.693 ≈ 6.6, rounded to **7 hashes**. Check: (1 − e^(−7/9.59))^7 = (1 − 0.482)^7 = 0.518^7 ≈ 0.0100, so 1.0%.

**Step 2, see the saving.** Without the filter, every redirect hits the database: 20,000 lookups/s. With it, the 19,980 clean URLs pass through the filter and about 1% of them, 19,980 × 0.01 ≈ **200 false positives**, still go to the database, plus the 20 real blocked links. That is about **220 lookups/s, a 99% cut**, and no blocked link ever slips past, because there are no false negatives.

**Step 3, let it overfill.** A year later the block list has grown to **2 million** URLs, but nobody resized the filter. Now there are only 9.59/2 ≈ 4.79 bits per item, still with 7 hashes: (1 − e^(−7/4.79))^7 = (1 − 0.232)^7 = 0.768^7 ≈ **0.157**. The false-positive rate is now about **16%**, so about 19,960 × 0.157 ≈ 3,100 clean URLs/s go to the database, fourteen times more than before. Nothing breaks visibly, the database just gets slower. The fix is to rebuild the filter when the item count passes its design n, which is easy because the source of truth is the database. Getting back to 1% needs 2,000,000 × 9.59 bits ≈ 2.4 MB.

**Step 4, count unique visitors with HyperLogLog.** About 100 million distinct visitors a day. An exact set of 8-byte IDs is at least 100M × 8 = **800 MB per day**. A Redis HyperLogLog uses m = 16,384 registers of 6 bits: 16,384 × 6 = 98,304 bits = **12,288 bytes, about 12 KB**. The standard error is 1.04/√16,384 = 1.04/128 ≈ **0.81%**, so the estimate is typically within about ±810,000 of 100 million (one standard deviation), and within about ±1.6 million 95% of the time. For weekly uniques, merge the seven daily sketches; adding the seven daily counts would count a person who visited every day seven times. <Src id="redis-hll" />

**Step 5, top links with a count-min sketch.** About **10 million clicks an hour**. We want an error of at most ε = 0.1% of the stream with 99% confidence (δ = 0.01):

- w = ⌈e / 0.001⌉ = ⌈2,718.3⌉ = **2,719** columns.
- d = ⌈ln(1/0.01)⌉ = ⌈4.61⌉ = **5** rows.
- 2,719 × 5 = 13,595 counters × 4 bytes = 54,380 bytes ≈ **53 KB**.
- Error bound: εN = 0.001 × 10,000,000 = **10,000 clicks**, with 99% probability.

A link with 500,000 real clicks reads somewhere from 500,000 to 510,000, at most 2% off, which is plenty to rank the top 100 with a heap of 100 entries. A link with 100 real clicks might read as several thousand, which is why you never use the sketch to bill per-link traffic. For exact counts on the winners, keep exact counters for just the items currently in the heap.

## In the real world

- **Databases built on LSM trees.** Cassandra, RocksDB, HBase and others keep a Bloom filter per on-disk file, so a read for a missing key skips files instead of reading them; this is the core of how an <Term id="lsm-tree">LSM tree</Term> keeps reads cheap. In Cassandra the knob is the table option `bloom_filter_fp_chance`; in RocksDB it is the filter policy's bits per key, where 10 bits per key gives roughly a 1% false-positive rate. See [indexes and SQL tuning](/modules/indexes-and-sql-tuning) for the B-tree side of the story.
- **Redis.** HyperLogLog is built in: `PFADD`, `PFCOUNT` and `PFMERGE`, at most 12 KB per key with a standard error of 0.81%, and a sparse encoding that uses much less for small sets. Redis also ships Bloom, cuckoo, count-min sketch and top-k types (`BF.RESERVE key error_rate capacity`, `CF.*`, `CMS.*`, `TOPK.*`) in Redis Stack and Redis 8. <Src id="redis-hll" />
- **Analytics engines.** BigQuery's `APPROX_COUNT_DISTINCT` and its `HLL_COUNT` functions use HyperLogLog++, Google's improved variant; Druid, Presto/Trino (`approx_distinct`) and ClickHouse (`uniq`) offer similar approximate distinct counts that are far cheaper than `COUNT(DISTINCT ...)`.
- **Web crawlers and browsers.** A [web crawler](/modules/web-crawler) uses a Bloom filter to skip URLs it has already fetched, accepting that 1% of new URLs get skipped by mistake. Chrome's early Safe Browsing client used a similar compact local filter of bad-URL hash prefixes so it only asked Google's servers about the rare maybe.

## Trade-offs

- **Memory against exactness.** You save two to five orders of magnitude of memory, and you get a known error, not a wrong answer at random. Use them where an approximate answer is acceptable: analytics, pre-filters, caches. Never use them where money or correctness depends on the exact value.
- **One-sided errors.** Bloom filters only err towards "maybe", count-min sketches only towards "more". Design so that the one-sided error is the harmless one: a false positive costs one extra lookup, not a wrong decision.
- **Sized in advance.** Bloom and cuckoo filters must know n up front. Scalable Bloom filters chain new, larger filters as you fill, at the cost of more memory and slightly slower lookups.
- **Deletion costs extra.** Plain Bloom filters cannot delete; counting Bloom filters can at about four times the memory, cuckoo filters can at a risk of failed inserts near capacity.
- **Mergeable, not subtractable.** HLLs and count-min sketches merge cleanly across shards and time windows, which is their big advantage in distributed systems, but intersection and difference queries are unreliable.

## Interview tips

- Reach for a Bloom filter whenever you see "check if we've seen this before" at scale: crawled URLs, taken usernames, articles already shown to a user, keys not on disk.
- Say the sizing out loud: "about 10 bits per item for 1%, 7 hashes, so a billion items is about 1.2 GB." That one sentence shows you know the trade-off is real and cheap.
- For "count unique users", say HyperLogLog, 12 KB per counter, about 1% error, and mergeable across days and servers.
- For "top trending" or "most frequent", say count-min sketch plus a heap, and mention that the sketch overcounts rare items.

**Common mistakes:**

- **Claiming a Bloom filter can say "yes".** It can only say "definitely not" or "maybe". If you skip the confirmation step, a false positive becomes a wrong answer, for example telling a new user their unique username is taken.
- **Forgetting the filter fills up.** A filter sized for 1M items holding 2M has a 16% false-positive rate, not 1%. Plan when to rebuild or use a scalable filter.
- **Adding HyperLogLog counts across days or shards.** Distinct counts are not additive; merge the sketches instead.
- **Trusting count-min sketch counts for rare items.** The error is a fraction of the whole stream, so small counts are mostly noise.
- **Deleting from a plain Bloom filter** by clearing bits, which silently creates false negatives for other items.

## Common follow-up questions

### How would you make a Bloom filter work across many servers?

If the set changes rarely, build it centrally from the source of truth and ship the bit array to every server, rebuilding on a schedule; at 1.2 MB per million items that is cheap. If the set changes constantly, keep it in a shared store such as Redis with the Bloom module, or [shard](/modules/federation-sharding-denormalization) the key space and keep one filter per shard, so each server only queries the filter for keys it owns.

### What if you need to delete items?

Use a counting Bloom filter (counters instead of bits, about four times the memory) or a cuckoo filter, which stores fingerprints and can remove them. A common simpler answer is to rebuild the filter periodically from the source of truth, which also fixes overfilling. For time-based sets, keep one filter per time window and drop old windows whole.

### How accurate is HyperLogLog for small counts?

Raw HLL is biased for small cardinalities, so implementations switch to a different method there: the original paper uses linear counting on empty registers, and Redis and HyperLogLog++ use a sparse representation that is close to exact for small sets. In practice, a Redis HLL with a few hundred items gives nearly exact answers and uses well under 12 KB.

### How do you compute trending topics over a sliding window?

Keep one count-min sketch and heap per small bucket, say one minute, and for "last hour" merge the last 60 sketches by adding counters cell by cell, then recompute the top k. Because merge is just addition, you can also subtract the bucket that falls out of the window from a running total. To weight recent minutes more, multiply older counts by a decay factor.

### Bloom filter or a cache of known-absent keys?

A negative [cache](/modules/cache-strategies-and-eviction) stores each absent key exactly, so its size grows with the number of distinct misses and it can be flooded by random keys. A Bloom filter stores the set of *present* keys at about 10 bits each and answers "absent" for any key not in it, including ones never seen before. For sets of a known size with mostly-negative lookups, the filter is smaller and safer.

## Go deeper

- [Network Applications of Bloom Filters: A Survey (Broder and Mitzenmacher)](https://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf): the derivation of the sizing formulas and a tour of uses in networking and storage.
- [HyperLogLog in Practice (Heule, Nunkesser and Hall, Google)](https://research.google/pubs/hyperloglog-in-practice-algorithmic-engineering-of-a-state-of-the-art-cardinality-estimation-algorithm/): the HyperLogLog++ improvements behind BigQuery, including bias correction and the sparse encoding.
- [An Improved Data Stream Summary: The Count-Min Sketch](http://dimacs.rutgers.edu/~graham/pubs/papers/cm-full.pdf): the original paper, short and readable, with the error bounds and heavy-hitter uses.
- [Redis probabilistic data types](https://redis.io/docs/latest/develop/data-types/probabilistic/): the commands and parameters for HyperLogLog, Bloom, cuckoo, count-min sketch and top-k in a system you can try today.
