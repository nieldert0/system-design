---
slug: where-to-cache
title: Where to cache
section: caching
upgraded: true
readFirst:
  - cdn
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, Cache
    url: https://github.com/donnemartin/system-design-primer#cache
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: How can a cache help a database with a few very popular items?
    options:
      - It cannot
      - It absorbs uneven loads and spikes so the hot items do not overload one partition
      - It shards the database
      - It adds indexes
    correct: 1
    explanation: Popular items skew load toward one partition; a cache in front answers those reads before they reach it.
  - prompt: Why are Redis and Memcached much faster than a typical database read?
    options:
      - They use UDP only
      - The data is held in RAM rather than on disk, and a lookup is a single key fetch
      - They have no network hop
      - They skip serialisation
    correct: 1
    explanation: RAM access and a simple key lookup beat a disk-backed query, but RAM is smaller and more expensive.
  - prompt: What is the main problem with caching at the database query level?
    options:
      - It is too fast
      - When one row changes, you must find and delete every cached query result that might include it
      - It cannot be used with SQL
      - It needs a CDN
    correct: 1
    explanation: A query key says nothing about which rows it touched, so invalidation becomes guesswork. Object-level keys map cleanly to the data that changed.
  - prompt: Why avoid caching to local files on app servers?
    options:
      - Files are slow to read
      - It ties data to one server, so cloning and auto-scaling servers gets harder and caches diverge
      - It is insecure
      - It is not supported on Linux
    correct: 1
    explanation: Stateless servers are interchangeable; a local file cache makes each one different.
  - prompt: In the worked example, the shared Redis layer has a 90% hit ratio on the 2,000 requests/s that get past the CDN. How many reads reach the database?
    options:
      - 1,800/s
      - 200/s
      - 20/s
      - 2,000/s
    correct: 1
    explanation: Only misses go through, and 10% of 2,000 is 200. Each layer only sees what the layer above it missed.
  - prompt: In the worked example, the team adds a 30-second in-process cache on 20 web servers in front of Redis. What new problem appears?
    options:
      - The database load doubles
      - Each server can serve a different stale copy for up to 30 seconds after a change, because deleting the Redis key does not reach the in-process copies
      - Redis stops evicting keys
      - The CDN stops caching
    correct: 1
    explanation: The closer a cache is to the reader, the more copies exist and the harder they are to invalidate. A short TTL bounds the damage.
  - prompt: A logged-in user's dashboard shows their account balance. Which layer should cache it?
    options:
      - The public CDN with a 1-hour TTL
      - A shared application cache keyed by user id, deleted on every balance change
      - Nowhere, ever
      - The browser with a 1-day max-age
    correct: 1
    explanation: Personal data must not sit in a shared edge cache, and it changes on writes you control, so an application cache with delete-on-write fits. Long browser caching would show stale balances.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CacheLayersFlow from '#lib/diagrams/CacheLayersFlow.svelte';
</script>

A <Term id="cache">cache</Term> keeps a copy of an answer close to where it is needed so you do not compute or fetch it again. You can cache at every layer between the user and the disk, and the real design question is which layers to use for which data.

## What it is

Here is the problem. A product page takes 40 ms of database work and 20 ms of template rendering, and it is requested 20,000 times a second, mostly for the same few thousand products. Without a cache, every one of those requests repeats the same work, the database needs ten times the capacity it should, and the few products on the home page hammer whichever partition holds them. A cache answers repeated requests from a stored copy, so the expensive work happens once per change instead of once per request.

Databases work best when reads and writes are spread evenly across their partitions. Popular items break that, and a cache in front of the database absorbs the skew and the spikes. <Src id="primer" />

"Where to cache" is the question of placement. A copy can live in the user's browser, at a [CDN](/modules/cdn) edge, in a <Term id="reverse-proxy">reverse proxy</Term> in front of your servers, inside each application process, in a shared cache cluster such as Redis, or inside the database itself. Each step closer to the user makes a hit faster and cheaper, and makes the copy harder to update when the data changes. Choosing layers is choosing where you sit on that line for each kind of data. <Src id="primer" />

This module is about placement. How data gets into a cache and what gets thrown out is covered in [Cache strategies and eviction](/modules/cache-strategies-and-eviction).

## How it works

A request walks down the layers until one of them has the answer. Each layer only sees what the layer above it missed, so the fraction of requests reaching the database is the product of each layer's miss ratio. Two layers that each hit 90% let only 10% × 10% = 1% through.

<CacheLayersFlow />

- **Client caching.** The browser (or a mobile app, or the operating system) keeps responses on the user's device. The server controls it with <Term id="http">HTTP</Term> headers: <Term id="cache-control">Cache-Control</Term> says how long a response may be reused, and an ETag (a fingerprint of the response) lets the browser ask "has this changed?" and get a tiny 304 Not Modified reply instead of the whole body. A hit costs zero network. The catch is that you cannot reach into a user's browser to delete a copy, so whatever you send with a long lifetime stays until it expires.
- **CDN caching.** A CDN is a shared cache spread over many cities. It is ideal for static files and for public pages that are the same for everyone, and many CDNs let you purge a URL on demand. See [CDN](/modules/cdn) for pull versus push and cache keys. <Src id="primer" />
- **Web server or reverse proxy caching.** A proxy such as Varnish or Nginx sits in front of your application servers and can return a stored response without calling them at all. It suits whole pages or API responses that many users share, and since you run it, you can purge it. <Src id="primer" />
- **Application caching.** This is the layer most designs mean by "add a cache". There are two kinds. An **in-process cache** lives in each server's own memory (a hash map with a size limit, or a library such as Caffeine) and costs nanoseconds, but every server has its own copy. A **distributed cache** such as Redis or Memcached is a separate cluster of key-value servers that every application server shares; a read is a network round trip of well under a millisecond. Both keep data in RAM, which is why they beat a database read from disk, and why they hold far less. <Src id="primer" />
- **Database caching.** The database already caches: its <Term id="buffer-pool">buffer pool</Term> keeps recently used pages of tables and indexes in memory. The default size is chosen for a generic machine, so tuning it to your working set (the part of the data that is actively read) is often the cheapest speed-up available. <Src id="primer" />

### What to store: queries or objects

Within the application cache you choose the shape of the key. <Src id="primer" />

**Query-level caching** hashes the SQL query text into a key and stores the result rows. It is easy to bolt on, but invalidation is the trap: when one row changes, you have no simple way to know which cached query results included it, so you either delete far too much or leave stale results behind.

**Object-level caching** stores the thing your code works with, such as `user:42` or `product:7`, assembled from however many tables it needs. When the underlying data changes, you know exactly which key to delete. This is the default choice because <Term id="cache-invalidation">cache invalidation</Term> stays tractable.

Good candidates are data that is read far more than it is written and is expensive to rebuild: user sessions, fully rendered pages or fragments, activity streams, and social graph data such as follower lists. <Src id="primer" />

Avoid caching to files on the application server's local disk. It makes each server different, which breaks the assumption that servers are <Term id="stateless">stateless</Term> and interchangeable, so cloning, auto-scaling and load balancing all get harder. <Src id="primer" />

### Matching data to layers

A quick rule: decide who can see the data and who controls changes to it.

- **Public and rarely changing** (images, scripts, docs pages): browser plus CDN with long lifetimes and versioned file names.
- **Public and changing** (product page, price): CDN or reverse proxy with a short <Term id="ttl">TTL</Term> or explicit purge, backed by an application cache.
- **Private to one user** (cart, balance, inbox): never a shared edge cache. Use a distributed cache keyed by user id, and `Cache-Control: private` if the browser may keep it briefly.
- **Tiny and extremely hot** (feature flags, config, the top 100 products): an in-process cache with a short TTL in front of the distributed cache.

## Worked example

An online shop serves **20,000 product-page requests a second** at peak. A full page costs 40 ms of database queries and 20 ms of rendering. The database cluster handles about **1,500 reads a second** comfortably. Product details change a few times a day; prices change more often and must be correct within a minute.

**Step 1, no cache.** Every request hits the database: 20,000 reads/s against a 1,500 capacity. That would need roughly 14 times the database, and the home-page products would still overload the partition that holds them.

**Step 2, add a CDN.** Product pages are the same for every anonymous visitor, so the CDN caches the HTML for 60 seconds, the staleness budget for prices. Suppose 90% of requests are anonymous and the CDN hits on most of those, so only **2,000 requests/s** reach the origin: logged-in users plus CDN misses. Load fell by 90% with no code change beyond a header.

**Step 3, add Redis for objects.** The 2,000 origin requests read `product:{id}` objects from Redis. With a 90% hit ratio, **200 reads/s** go to the database, about 13% of its capacity. When a price changes, the writer updates the database, deletes `product:{id}` in Redis, and purges that page's URL from the CDN.

**Step 4, the latency budget.** A CDN hit returns in about 20 ms from a nearby city. An origin request with a Redis hit costs about 1 ms of cache plus 20 ms rendering. A full miss costs 1 + 40 + 20 ms plus the trip to the origin. Most users see the first number.

**Step 5, the in-process trap.** The team notices Redis taking 2,000 reads/s for the same ten home-page products and adds a 30-second in-process cache on each of the 20 web servers. Redis load for those keys drops to about 20 × 10 / 30 ≈ 7 reads/s. But now a price change deletes the Redis key and purges the CDN, and **20 separate in-process copies** still hold the old price for up to 30 seconds, each expiring at a different moment. One refresh shows the new price, the next shows the old one. The staleness also stacks with the CDN. Suppose a server loaded the old price into its in-process cache just before the purge, so that copy lives until about t = 30 s. For a hot home-page product, the CDN refills almost immediately after the purge, caches the old page, and keeps it until about t = 60 s: right at the edge of the budget. For a quieter product page that nobody requests until t = 29 s, the refill still reads the old in-process copy and the CDN keeps it until about t = 89 s, so the worst case is the CDN TTL plus the in-process TTL, about **90 seconds**, which breaks the budget. The fixes are to keep the sum of the TTLs within the budget (for example a 30-second CDN TTL plus a 30-second in-process TTL), to leave prices out of the in-process layer, or to broadcast invalidations to every server (for example over Redis <Term id="pub-sub">pub/sub</Term>) before the CDN purge so refills read fresh data.

The lesson: every layer you add multiplies the load savings and also multiplies the number of copies you must keep honest.

## In the real world

- **Browsers and HTTP.** `Cache-Control: max-age=31536000, immutable` on fingerprinted file names such as `app.3f9a2c.js` is the standard for static assets: the file name changes when the content does, so a year-long lifetime is safe. HTML usually gets `no-cache` (store it, but check the ETag before reuse) or a short `max-age`.
- **Varnish.** A reverse-proxy cache configured in its own language, VCL. Its default TTL for responses without caching headers is 120 seconds (the `default_ttl` parameter), and by default it will not cache requests that carry cookies, which is the most common reason people see a 0% hit rate. Purges and bans remove objects on demand.
- **Redis and Memcached.** The usual shared application cache. Set `maxmemory` and a `maxmemory-policy` such as `allkeys-lru` in Redis, because the default `noeviction` rejects writes when full. Memcached is memory-only and multi-threaded; Redis adds data structures (lists, sorted sets) that suit feeds and leaderboards.
- **PostgreSQL and MySQL.** PostgreSQL's `shared_buffers` defaults to a small 128 MB; a common starting point is about 25% of the machine's RAM, with the operating system's file cache doing the rest. MySQL InnoDB's `innodb_buffer_pool_size` is often set to 50-75% of RAM on a dedicated server. MySQL's old query cache was removed in 8.0 precisely because invalidating it under writes became a bottleneck.

## Trade-offs

| Layer | Hit latency | Who it helps | Invalidation |
| --- | --- | --- | --- |
| Browser | ~0 ms | One user | Cannot purge; wait for expiry or change the URL |
| CDN | 10-30 ms | Everyone near an edge | Purge by URL or tag, takes seconds |
| Reverse proxy | 1-5 ms + network | All users of your origin | Purge or ban, you control it |
| In-process | Nanoseconds | One server | Per-server; needs broadcast or short TTL |
| Distributed (Redis) | ~1 ms | All servers | Delete the key once |
| Database buffer pool | Avoids disk | The database | Automatic, always consistent |

- **Speed against freshness.** The closer to the user, the faster the hit and the harder it is to invalidate.
- **Consistency costs work.** You must keep each cache in step with the source of truth through invalidation, and deciding when to update the cache adds real complexity. <Src id="primer" />
- **More moving parts.** A distributed cache is another cluster to run, monitor and size, and application code has to change to use it. <Src id="primer" />
- **Failure behaviour.** If a cache layer fails, the layer below gets all its traffic. In the worked example, losing Redis sends 2,000 reads/s to a database sized for 1,500.

**Common mistakes:**

- **Caching personal responses at a shared layer.** A CDN or proxy that ignores the `Cookie` header or a missing `private` directive can serve one user's account page to another. Mark personal responses `private` or `no-store`, and keep them out of shared edge caches.
- **Long browser lifetimes on URLs that do not change.** If `/app.js` is sent with `max-age` of a year, a bug fix will not reach users who already have it, and no purge can help. Fingerprint the file name instead.
- **Choosing query-level caching for write-heavy tables.** Every write turns into a hunt for which cached results to drop.
- **Stacking layers without adding up staleness.** A 60-second CDN TTL in front of a 60-second application cache can serve data up to two minutes old.

## Interview tips

- Walk the layers in order (browser, CDN, reverse proxy, application cache, database) and say which data goes where and why.
- Quote a hit ratio per layer and convert it into load on the next layer, as in the worked example.
- Say how stale each kind of data may be; that number decides the TTL, which layers are allowed, and how you invalidate.
- Separate public from personal data early, because it rules shared edge caches in or out.
- Default to object-level keys in Redis with delete-on-write, and mention the in-process layer only for a handful of very hot keys.

## Common follow-up questions

### How do you invalidate across several layers?

Work from the source outward. Write the database, delete the application cache key, then purge the CDN or proxy URL (many CDNs support purge by tag, so one call clears every page showing that product). Browser copies cannot be purged, so keep browser lifetimes short for anything that changes, or change the URL. Give every layer a TTL as a safety net for a missed invalidation.

### When would you add an in-process cache on top of Redis?

When a few keys are so hot that one Redis node becomes the bottleneck, or when the network round trip itself matters, as for config or feature flags read on every request. Keep the TTL short (seconds) and limit it to data that tolerates that much staleness, because each server holds its own copy.

### Can you cache responses for logged-in users?

Yes, but not as whole pages at a shared edge. Either cache the shared parts (product data, page fragments) and assemble the personal parts per request, or cache personal data in the application cache keyed by user id. Edge Side Includes and similar techniques let a CDN cache the page shell while fetching the personal fragment from the origin.

### What happens when the cache layer goes down?

The next layer down takes the full load, which may be several times what it can handle. Size the database to survive at least a partial cache loss, run the cache as a replicated cluster, put a <Term id="circuit-breaker">circuit breaker</Term> or <Term id="rate-limiting">rate limit</Term> in front of the database, and consider serving stale content from the CDN while the origin recovers (`stale-if-error`).

### Is the database's own cache enough?

Sometimes. If the working set fits in the buffer pool and the queries are cheap, a separate cache adds complexity for little gain. Add an application cache when the expensive part is the query or assembly work rather than the disk read, or when read volume exceeds what the database can serve even from memory.

## Go deeper

- [MDN, HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching): how browsers and shared caches read `Cache-Control`, ETags and revalidation.
- [Varnish, Achieving a high hitrate](https://varnish-cache.org/docs/trunk/users-guide/increasing-your-hitrate.html): why cookies and headers kill proxy hit rates, and how to fix it.
- [PostgreSQL, Resource consumption](https://www.postgresql.org/docs/current/runtime-config-resource.html): `shared_buffers` and the other memory settings behind the database's own cache.
- [AWS caching best practices](https://aws.amazon.com/caching/best-practices/): where caches fit in a typical architecture, with TTL and lazy-loading guidance.
