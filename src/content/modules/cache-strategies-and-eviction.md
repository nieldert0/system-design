---
slug: cache-strategies-and-eviction
title: Cache strategies and eviction
section: caching
upgraded: true
readFirst:
  - where-to-cache
sources:
  - id: primer
    title: The System Design Primer, When to update the cache
    url: https://github.com/donnemartin/system-design-primer#when-to-update-the-cache
    license: CC BY 4.0
    use: reworded
  - id: wiki-evict
    title: Wikipedia, Cache replacement policies
    url: https://en.wikipedia.org/wiki/Cache_replacement_policies
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-herd
    title: Wikipedia, Cache stampede
    url: https://en.wikipedia.org/wiki/Cache_stampede
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In cache-aside, who loads data into the cache on a miss?
    options:
      - The cache itself
      - The application
      - The database
      - The CDN
    correct: 1
    explanation: The application reads the database and adds the entry to the cache. That is why it is also called lazy loading.
  - prompt: In write-through, when is the database written?
    options:
      - Never
      - Synchronously, as part of the write, before it is acknowledged
      - Asynchronously later
      - Only on eviction
    correct: 1
    explanation: Writes are slower because they pay for both stores, but the cache is never behind the database.
  - prompt: What is the main risk of write-behind (write-back)?
    options:
      - Slow writes
      - Losing writes if the cache dies before it flushes them to the database
      - Stale reads
      - Too many trips per read
    correct: 1
    explanation: The write is acknowledged while it only exists in cache memory.
  - prompt: Which eviction policy removes the entry that has gone longest without being used?
    options:
      - LFU
      - LRU
      - FIFO
      - Random
    correct: 1
    explanation: Least recently used keeps whatever was touched lately and drops cold entries.
  - prompt: In the worked example, reads are 10,000/s and the hit ratio falls from 95% to 80%. What happens to database reads?
    options:
      - They rise by 15%, from 500/s to 575/s
      - They quadruple, from 500/s to 2,000/s
      - They stay the same, because the cache still serves most reads
      - They double, from 500/s to 1,000/s
    correct: 1
    explanation: The database sees the miss ratio, which goes from 5% to 20%. A 15-point drop in hit ratio is a 4x rise in database load.
  - prompt: A hot key gets 2,000 requests/s and its database query takes 50 ms. Roughly how many requests miss at once when it expires, with no protection?
    options:
      - 1
      - About 10
      - About 100
      - About 2,000
    correct: 2
    explanation: Every request in the 50 ms before the first reload finishes also misses, and 2,000/s × 0.05 s is about 100. Request coalescing turns that into 1.
  - prompt: You update a user's row in the database. Why do most teams delete the cache entry instead of writing the new value into it?
    options:
      - Deleting is faster than writing
      - Two concurrent writers can set the cache in the wrong order and leave an old value cached until the TTL; a delete just forces the next read to reload
      - Caches do not support overwriting keys
      - It saves memory permanently
    correct: 1
    explanation: Set-on-write races; delete-on-write fails safe, at the cost of one extra miss.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CacheAsideFlow from '#lib/diagrams/CacheAsideFlow.svelte';
	import WriteThroughBehindFlow from '#lib/diagrams/WriteThroughBehindFlow.svelte';
	import LruFlow from '#lib/diagrams/LruFlow.svelte';
</script>

A <Term id="cache">cache</Term> needs two policies: how data gets in and stays fresh (the update strategy), and what to throw out when memory is full (the eviction policy). Get the first wrong and users see stale or lost data. Get the second wrong and the cache stops saving the database any work.

## What it is

Here is the problem. Your database comfortably serves about 2,000 reads a second, and traffic just grew to 10,000. You put a cache in front of it, but the cache is a few gigabytes of RAM and the data is a few hundred gigabytes on disk, so only a slice of it fits. That leaves three questions every caching design has to answer:

1. **When does data enter the cache?** On the first read, or on every write?
2. **What happens when the data changes?** Does the cache get the new value, lose the old one, or wait for it to expire?
3. **When the cache is full, what goes?** The thing used longest ago, the thing used least often, or the oldest?

The answers to the first two are the **cache update strategy**: cache-aside, read-through, write-through, write-behind, or refresh-ahead. The answer to the third is the **eviction policy**: LRU, LFU, FIFO, or expiry by <Term id="ttl">TTL</Term>. Which update strategy fits depends on how often data is read compared with written and how much staleness you can tolerate. The eviction policy decides what share of reads the cache can actually answer, its <Term id="hit-ratio">hit ratio</Term>. <Src id="primer" /> <Src id="wiki-evict" />

If you have not yet decided *where* the cache sits (browser, CDN, application, database), read [Where to cache](/modules/where-to-cache) first. This module assumes an application-level cache such as Redis or Memcached.

## How it works

### Cache-aside (lazy loading)

The application owns all the logic and the cache is a plain key-value store that never talks to the database. On a read, the application asks the cache. On a hit, it is done. On a miss, it reads the database, writes the result into the cache with a TTL, and returns it. <Src id="primer" />

<CacheAsideFlow />

Only data someone actually asked for ends up cached, so memory is not wasted on rows nobody reads. The cost is that a miss takes three trips (cache, database, cache), and a brand-new or restarted cache node starts empty and sends everything to the database until it warms up. On writes, the application updates the database and then **deletes** the cache key, so the next read reloads the fresh row.

Read-through is the same flow with the loading moved into a cache library or proxy: the application only ever calls the cache, and the cache calls the database on a miss. It tidies the code but behaves the same.

### Write-through

The application writes to the cache, and the cache synchronously writes to the database before acknowledging. Reads of just-written data are fast and never stale, because the cache always holds the latest value. Writes are slower because they pay for both stores, though users usually tolerate a slow save more than a slow page. Two drawbacks: a new node holds nothing until each key is written again, and most written data may never be read, which wastes memory unless you also set a TTL. <Src id="primer" />

### Write-behind (write-back)

The application writes to the cache and gets an immediate acknowledgement; the cache flushes changes to the database later, often in batches. Writes are very fast and the database sees fewer, larger writes. The danger is that an acknowledged write lives only in cache memory until the flush, so a crash in that window loses it. It is also the most complex option to build and operate. <Src id="primer" />

<WriteThroughBehindFlow />

### Refresh-ahead

The cache reloads popular entries shortly before they expire, so readers never see the miss. If it predicts well, latency is lower than read-through. If it predicts badly, it spends database capacity refreshing keys nobody will read. <Src id="primer" />

### Eviction policies

When the cache hits its memory limit, it must drop something to fit the next entry. <Src id="wiki-evict" />

- **<Term id="lru">LRU</Term> (least recently used)** drops the entry untouched for longest. It is the usual default because recent use predicts near-future use for most web traffic.
- **LFU (least frequently used)** drops the entry with the fewest hits. It protects items that are steadily popular, but it adapts slowly: yesterday's viral key can linger long after nobody wants it.
- **FIFO (first in, first out)** drops the oldest insert regardless of use. It is cheap to run and usually worse than LRU.
- **Random** drops any entry. It sounds naive but is surprisingly close to LRU when the cache is large.
- **TTL expiry** is not a replacement policy as such: each entry carries a lifetime and disappears when it runs out, which also puts an upper bound on how stale it can get.

<LruFlow />

Most real systems combine an expiry (every key has a TTL) with a replacement policy (LRU or LFU when memory runs out before keys expire).

## Worked example

A product page service gets **10,000 reads a second**. The database (one primary plus replicas) handles about **2,000 reads a second** before latency climbs. A database read takes 50 ms, a cache read takes 1 ms. We use cache-aside with a 10-minute TTL and LRU eviction.

**Step 1, normal load.** At a 95% hit ratio, 9,500 reads/s come from the cache and 500 reads/s go to the database. The database runs at a quarter of its capacity. Average latency is 0.95 × 1 ms + 0.05 × (1 + 50 + 1) ms ≈ 3.5 ms.

**Step 2, the cache is too small.** Marketing adds 5× more products, the working set no longer fits, and LRU keeps evicting entries before they are read twice. The hit ratio drops to 80%. The database now gets 20% of 10,000 = **2,000 reads/s**, exactly its limit. Notice that the hit ratio fell by 15 points but database load went up four times, because the database sees the *miss* ratio (5% → 20%). This is why small hit-ratio changes matter so much. The fix is more cache memory, or only caching what is hot.

**Step 3, a hot key expires.** One product is on the home page and gets **2,000 requests/s**. When its TTL runs out, the first request misses and starts a 50 ms database read. Every request that arrives during those 50 ms also misses, and that is about 2,000 × 0.05 = **100 identical queries** hitting the database at the same moment. This is the <Term id="thundering-herd">thundering herd</Term> (also called a cache stampede). With heavier queries or several hot keys expiring together, it can tip a healthy database over. <Src id="wiki-herd" />

Three fixes, which you can combine:

- **<Term id="request-coalescing">Request coalescing</Term>**: the first miss takes a short lock (for example `SET lock:product:42 NX PX 100` in Redis); the other 99 wait a few milliseconds and read the freshly cached value. 100 queries become 1.
- **Refresh-ahead or early recompute**: refresh the key before it expires, either on a timer or by letting a reader near the end of the TTL refresh it early with some probability.
- **TTL jitter**: set the TTL to 10 minutes ± 1 minute at random so keys written together do not expire together.

**Step 4, a cache node dies.** With cache-aside, the replacement node starts empty. For a moment, the hit ratio for its share of keys is 0%. If the cache is a single node, the database suddenly sees all 10,000 reads/s, five times its capacity. Real systems avoid this by spreading keys over many nodes with [consistent hashing](/modules/consistent-hashing), so losing one of ten nodes only moves about 10% of keys (1,000 extra reads/s), and by warming new nodes before they take traffic.

## In the real world

- **Redis.** Eviction is set by `maxmemory` (the memory cap) and `maxmemory-policy`. The default policy is `noeviction`, which rejects writes when memory is full, so a cache deployment must change it. Common choices are `allkeys-lru` (any key can be evicted), `volatile-lru` (only keys with a TTL), `allkeys-lfu`, and `volatile-ttl` (evict keys closest to expiry). Redis's LRU is approximate: it samples `maxmemory-samples` keys (default 5) and evicts the oldest of the sample, which saves memory and is close to true LRU.
- **Memcached.** Uses LRU per slab class (memory is split into pools by item size), with a segmented LRU that keeps hot, warm, and cold lists so a burst of one-off reads cannot push out steadily used items. There is no persistence, so every restart is a cold cache.
- **Facebook's memcache fleet.** Their 2013 paper describes *leases*: on a miss, memcache hands one client a token to refill the key and tells the others to wait briefly. That single mechanism fixes both thundering herds and stale sets from racing writers, and it is the production version of request coalescing.
- **Caffeine (Java in-process cache).** Uses W-TinyLFU, which combines a small LRU window with a frequency sketch. Its benchmarks show higher hit ratios than plain LRU on most real traces, which is why it replaced Guava's cache in many services.

## Trade-offs

| Strategy | Reads | Writes | Staleness | Failure risk |
| --- | --- | --- | --- | --- |
| Cache-aside | Miss costs 3 trips | Database only, then delete key | Up to TTL | Empty node after restart |
| Write-through | Fast after first write | Slower (both stores) | None | Caches data nobody reads |
| Write-behind | Fast | Fastest | None in cache, database lags | Lost writes on crash |
| Refresh-ahead | Fast if prediction is good | n/a | Low | Wasted refreshes |

- **Hit ratio against memory cost.** A bigger cache raises the hit ratio, but with diminishing returns; past the working set, extra memory buys almost nothing.
- **Freshness against load.** A short TTL keeps data fresh but sends more misses to the database; a long TTL does the opposite. Many teams pick a long TTL plus explicit delete-on-write.

## Interview tips

- Default to cache-aside with a TTL and LRU eviction, and justify anything else by the read/write mix.
- On writes, say whether you update or delete the cache entry. Delete, because two writers that both *set* the cache can finish in the wrong order and leave an old value cached until the TTL runs out. A delete just costs one extra miss.
- Bring up the thundering herd unprompted when a key is hot, and name request coalescing and TTL jitter as fixes.
- Quote a hit ratio and translate it into database load, as in the worked example. It shows you understand why the cache exists.

**Common mistakes:**

- Forgetting that Redis defaults to `noeviction`, so a full cache starts failing writes instead of evicting.
- Reasoning about the hit ratio instead of the miss ratio: going from 99% to 98% doubles database load.
- Choosing write-behind for data you cannot lose, such as payments, without a durable log behind it.
- Caching without a TTL, so a missed invalidation leaves stale data forever.

## Common follow-up questions

### How do you keep the cache consistent with the database?

You usually do not make it perfectly consistent; you bound the staleness. Write the database first, then delete the cache key, and give every key a TTL as a safety net in case a delete is lost. If you need tighter guarantees, publish database changes (for example with change data capture from the database log) and have a consumer invalidate keys, so invalidation cannot be skipped by a code path that forgot.

### What if the cache goes down completely?

The database takes the full read load, which may be several times what it can handle. Protect it with a circuit breaker or a <Term id="rate-limiting">rate limit</Term> in front of the database, serve stale data from a local in-process cache where acceptable, and run the cache as a replicated cluster so one node failure is not a full outage.

### LRU or LFU?

LRU when popularity shifts quickly (news, feeds, sessions); LFU when a stable set of items stays popular for a long time (product catalogue, configuration). Modern caches such as Caffeine and Redis's `allkeys-lfu` decay old counts so LFU can still adapt.

### How do you cache a key that is too hot for one cache node?

Replicate it: store copies under `product:42#1` to `product:42#8` and have readers pick one at random, or keep a tiny in-process cache on each web server for the top few keys. Both spread load that would otherwise land on a single node.

### Should you cache negative results?

Yes, briefly. If a key does not exist in the database, cache a "not found" marker with a short TTL, otherwise every request for that missing key goes to the database. This also blunts attackers who request random keys on purpose.

## Go deeper

- [Scaling Memcache at Facebook (NSDI 2013)](https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala): leases, regional invalidation, and cold-cluster warm-up at very large scale.
- [Redis key eviction](https://redis.io/docs/latest/develop/reference/eviction/): every `maxmemory-policy` value and how the approximate LRU and LFU work.
- [Caffeine efficiency](https://github.com/ben-manes/caffeine/wiki/Efficiency): hit-ratio comparisons of LRU, LFU, ARC, and W-TinyLFU on real traces.
- [AWS caching best practices](https://aws.amazon.com/caching/best-practices/): lazy loading against write-through with TTL guidance, from the ElastiCache team.
