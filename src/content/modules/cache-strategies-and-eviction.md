---
slug: cache-strategies-and-eviction
title: Cache strategies and eviction
section: caching
readFirst:
  - where-to-cache
sources:
  - id: primer
    title: The System Design Primer, When to update the cache
    url: https://github.com/donnemartin/system-design-primer#when-to-update-the-cache
    license: CC BY 4.0
    use: copied
  - id: wiki-evict
    title: Wikipedia, Cache replacement policies
    url: https://en.wikipedia.org/wiki/Cache_replacement_policies
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
    explanation: The application reads the database and adds the entry to the cache. Also called lazy loading.
  - prompt: What is a downside of cache-aside?
    options:
      - Cached data is never stale
      - Each cache miss results in three trips, which can cause a noticeable delay
      - It caches data nobody reads
      - It loses writes
    correct: 1
    explanation: Check cache, read database, write cache.
  - prompt: In write-through, when is the database written?
    options:
      - Never
      - Synchronously, by the cache, as part of the write
      - Asynchronously later
      - Only on eviction
    correct: 1
    explanation: Writes are slower, but cached data is not stale.
  - prompt: What is the main risk of write-behind (write-back)?
    options:
      - Slow writes
      - Data loss if the cache goes down before its contents hit the data store
      - Stale reads
      - Too many trips per read
    correct: 1
    explanation: Writes are acknowledged before they are durable.
  - prompt: Which eviction policy removes the entry that has gone longest without being used?
    options:
      - LFU
      - LRU
      - FIFO
      - Random
    correct: 1
    explanation: Least recently used keeps hot data and drops cold entries.
  - prompt: When does refresh-ahead hurt performance?
    options:
      - Never
      - When it mispredicts which items will be needed, refreshing the wrong ones
      - When the TTL is long
      - When using Redis
    correct: 1
    explanation: Bad predictions spend work on entries nobody reads.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CacheAsideFlow from '#lib/diagrams/CacheAsideFlow.svelte';
	import WriteThroughBehindFlow from '#lib/diagrams/WriteThroughBehindFlow.svelte';
	import LruFlow from '#lib/diagrams/LruFlow.svelte';
</script>

A <Term id="cache">cache</Term> needs two policies: how data gets in and stays fresh (the update strategy), and what to throw out when it is full (the eviction policy).

## What it is

Since you can only store a limited amount of data in cache, you'll need to determine which cache update strategy works best for your use case. <Src id="primer" />

RAM is more limited than disk, so cache invalidation algorithms such as least recently used (LRU) can help invalidate 'cold' entries and keep 'hot' data in RAM. <Src id="primer" />

## How it works

**<Term id="cache-aside">Cache-aside</Term>.** The application is responsible for reading and writing from storage. The cache does not interact with storage directly. The application does the following: <Src id="primer" />

- Look for entry in cache, resulting in a cache miss
- Load entry from the database
- Add entry to cache
- Return entry

Subsequent reads of data added to cache are fast. Cache-aside is also referred to as lazy loading. Only requested data is cached, which avoids filling up the cache with data that isn't requested. <Src id="primer" />

<CacheAsideFlow />

**Write-through.** The application uses the cache as the main data store, reading and writing data to it, while the cache is responsible for reading and writing to the database. Write-through is a slow overall operation due to the write operation, but subsequent reads of just written data are fast. Users are generally more tolerant of <Term id="latency">latency</Term> when updating data than reading data. Data in the cache is not stale. <Src id="primer" />

**Write-behind (write-back).** The application adds or updates the entry in cache, then asynchronously writes the entry to the data store, improving write performance. <Src id="primer" />

<WriteThroughBehindFlow />

**Refresh-ahead.** You can configure the cache to automatically refresh any recently accessed cache entry prior to its expiration. Refresh-ahead can result in reduced latency vs read-through if the cache can accurately predict which items are likely to be needed in the future. <Src id="primer" />

**Eviction policies** decide what to drop when the cache is full: <Src id="wiki-evict" />

- **<Term id="lru">LRU</Term>** (least recently used): drop the entry untouched for longest. A strong default.
- **LFU** (least frequently used): drop the entry used least often. Good for stable popularity, slow to adapt.
- **FIFO**: drop the oldest entry regardless of use. Simple, often worse.
- **<Term id="ttl">TTL</Term> expiry**: entries expire after a set time, which also bounds staleness.

<LruFlow />

## Trade-offs

- **Cache-aside:** each cache miss results in three trips, which can cause a noticeable delay. Data can become stale if it is updated in the database, mitigated by a TTL or by using write-through. When a node fails, it is replaced by a new, empty node, increasing latency. <Src id="primer" />
- **Write-through:** when a new node is created due to failure or scaling, the new node will not cache entries until the entry is updated in the database. Most data written might never be read, which can be minimized with a TTL. <Src id="primer" />
- **Write-behind:** there could be data loss if the cache goes down prior to its contents hitting the data store. It is more complex to implement write-behind than it is to implement cache-aside or write-through. <Src id="primer" />
- **Refresh-ahead:** not accurately predicting which items are likely to be needed in the future can result in reduced performance than without refresh-ahead. <Src id="primer" />

## Interview tips

- Default to cache-aside with a TTL and LRU eviction; justify anything else.
- On writes, say whether you update or delete the cache entry. Deleting is safer against races.
- Mention the thundering herd: when a hot key expires, many requests hit the database at once. Fix with request coalescing or refresh-ahead.
