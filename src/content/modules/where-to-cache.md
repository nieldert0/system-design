---
slug: where-to-cache
title: Where to cache
section: caching
readFirst:
  - cdn
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, Cache
    url: https://github.com/donnemartin/system-design-primer#cache
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: How can a cache help a database with a few very popular items?
    options:
      - It cannot
      - It absorbs uneven loads and spikes so the hot items do not overload one partition
      - It shards the database
      - It adds indexes
    correct: 1
    explanation: Popular items skew load; a cache in front absorbs it.
  - prompt: Which is NOT a place the primer lists for caching?
    options:
      - Client (browser or OS)
      - CDN
      - Web server / reverse proxy
      - The TCP handshake
    correct: 3
    explanation: Client, CDN, web server, database and application are the cache layers.
  - prompt: Why are Memcached and Redis much faster than a typical database?
    options:
      - They use UDP only
      - The data is held in RAM rather than on disk
      - They have no network
      - They skip serialisation
    correct: 1
    explanation: RAM is much faster than disk, but more limited.
  - prompt: What is a problem with caching at the database query level?
    options:
      - It is too fast
      - If one piece of data changes, you need to delete all cached queries that might include it
      - It cannot be used with SQL
      - It needs a CDN
    correct: 1
    explanation: Query-level caches are hard to invalidate.
  - prompt: Why avoid file-based caching on app servers?
    options:
      - Files are slow to read
      - It makes cloning and auto-scaling more difficult
      - It is insecure
      - It is not supported on Linux
    correct: 1
    explanation: Local files tie data to one server, breaking stateless scaling.
  - prompt: Which is a good thing to cache, according to the primer?
    options:
      - Credit card numbers
      - User sessions and fully rendered web pages
      - Database write-ahead logs
      - TLS private keys
    correct: 1
    explanation: Sessions, rendered pages, activity streams and user graph data are suggested.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CacheLayersFlow from '#lib/diagrams/CacheLayersFlow.svelte';
</script>

A cache keeps a copy of an answer close to where it is needed so you do not compute or fetch it again. You can cache at every layer, from the browser down to the database.

## What it is

**<Term id="cache">Caching</Term>** improves page load times and can reduce the load on your servers and databases. In this model, the dispatcher will first lookup if the request has been made before and try to find the previous result to return, in order to save the actual execution. <Src id="primer" />

Databases often benefit from a uniform distribution of reads and writes across its partitions. Popular items can skew the distribution, causing bottlenecks. Putting a cache in front of a database can help absorb uneven loads and spikes in traffic. <Src id="primer" />

## How it works

Caches can be located on the client side (OS or browser), server side, or in a distinct cache layer. <Src id="primer" />

- **Client caching** - the browser or OS keeps responses (<Term id="http">HTTP</Term> cache headers decide for how long).
- **<Term id="cdn">CDN</Term> caching** - CDNs are considered a type of cache. <Src id="primer" />
- **Web server caching** - Reverse proxies and caches such as Varnish can serve static and dynamic content directly. Web servers can also cache requests, returning responses without having to contact application servers. <Src id="primer" />
- **Database caching** - Your database usually includes some level of caching in a default configuration, optimized for a generic use case. Tweaking these settings for specific usage patterns can further boost performance. <Src id="primer" />
- **Application caching** - In-memory caches such as Memcached and Redis are key-value stores between your application and your data storage. Since the data is held in RAM, it is much faster than typical databases where data is stored on disk. <Src id="primer" />

<CacheLayersFlow />

There are multiple levels you can cache that fall into two general categories: **database queries** and **objects**. Generally, you should try to avoid file-based caching, as it makes cloning and auto-scaling more difficult. <Src id="primer" />

**Query level.** Whenever you query the database, hash the query as a key and store the result to the cache. This approach suffers from expiration issues: it is hard to delete a cached result with complex queries, and if one piece of data changes such as a table cell, you need to delete all cached queries that might include the changed cell. <Src id="primer" />

**Object level.** See your data as an object, similar to what you do with your application code. Have your application assemble the dataset from the database into a class instance or a data structure(s). Remove the object from cache if its underlying data has changed. <Src id="primer" />

Suggestions of what to cache: user sessions, fully rendered web pages, activity streams, user graph data. <Src id="primer" />

## Trade-offs

- Need to maintain consistency between caches and the source of truth such as the database through cache invalidation. <Src id="primer" />
- Cache invalidation is a difficult problem, there is additional complexity associated with when to update the cache. <Src id="primer" />
- Need to make application changes such as adding Redis or memcached. <Src id="primer" />
- The closer to the user, the faster the hit and the harder it is to invalidate.

## Interview tips

- Cache read-heavy data that changes rarely; quote a target hit rate and what a miss costs.
- Walk the layers: browser → CDN → <Term id="reverse-proxy">reverse proxy</Term> → Redis → database cache.
- Say how stale is acceptable; that decides the <Term id="ttl">TTL</Term> and the invalidation approach.
