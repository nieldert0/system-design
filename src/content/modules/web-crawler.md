---
slug: web-crawler
title: Design a web crawler
section: case-studies
upgraded: true
readFirst:
  - approach-a-design-interview
  - queues-and-back-pressure
  - dns
sources:
  - id: primer-crawler
    title: System Design Primer, Design a web crawler
    url: https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/web_crawler/README.md
    license: CC BY 4.0
    use: reworded
  - id: wiki-crawler
    title: Wikipedia, Web crawler
    url: https://en.wikipedia.org/wiki/Web_crawler
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-robots
    title: Wikipedia, robots.txt
    url: https://en.wikipedia.org/wiki/Robots.txt
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the URL frontier?
    options:
      - The list of URLs still to be crawled
      - The fastest server in the crawler
      - The search results page
      - The robots.txt file
    correct: 0
    explanation: Workers take URLs from the frontier and add newly found links back to it.
  - prompt: Why does a crawler keep a set of URLs it has already seen?
    options:
      - To rank pages
      - To avoid fetching the same page again and looping forever
      - To store page text
      - To resolve DNS
    correct: 1
    explanation: The web is full of cycles; without dedupe the crawl never ends.
  - prompt: What is robots.txt for?
    options:
      - Encrypting pages
      - Listing every page on a site
      - Telling crawlers which parts of a site they should not fetch
      - Storing cookies
    correct: 2
    explanation: Polite crawlers fetch and follow it before crawling a site.
  - prompt: Why limit requests per site?
    options:
      - To save disk space
      - It makes parsing faster
      - DNS requires it
      - Hammering one server can overload it, and sites will block the crawler
    correct: 3
    explanation: The frontier is usually split per host so each site is crawled at a polite rate.
  - prompt: How can a crawler spot the same page under different URLs?
    options:
      - It cannot
      - By checking the page title only
      - By hashing the content and comparing signatures
      - By comparing HTTP status codes
    correct: 2
    explanation: Exact or near-duplicate signatures catch mirrors and URL variants.
  - prompt: The crawler must fetch about 1,600 pages a second, and politeness allows one request per host per second. What does that imply?
    options:
      - One very fast worker is enough
      - At least 1,600 different hosts must be in flight at any moment, so the frontier must interleave many hosts
      - Each host must be fetched 1,600 times a second
      - Politeness makes the target impossible
    correct: 1
    explanation: Throughput comes from breadth across hosts, never from depth on one host. That is why the frontier keeps one back queue per host.
  - prompt: The seen-URL set holds 10 billion URLs. Why use a Bloom filter in front of it rather than only a database lookup?
    options:
      - A Bloom filter never makes mistakes
      - It answers "definitely new" from about 12 GB of memory, so most lookups skip the database, at the cost of occasionally skipping a new URL
      - Databases cannot store URLs
      - It sorts URLs by priority
    correct: 1
    explanation: At about 10 bits per URL for a 1% false positive rate, 10 billion URLs fit in roughly 12 GB; a false positive means a URL is wrongly treated as seen and skipped, which a crawler can tolerate.
  - prompt: A site serves /calendar?month=2026-12, which links to the next month, forever. What stops the crawler?
    options:
      - Nothing; it will crawl forever
      - The content hash, because each page is different
      - Per-host caps on URLs and path depth, plus URL pattern rules that spot repeating parameters
      - DNS caching
    correct: 2
    explanation: That is a crawler trap. Each page is genuinely new content, so dedupe does not help; budgets per host do.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CrawlerFlow from '#lib/diagrams/CrawlerFlow.svelte';
</script>

A web crawler downloads pages, extracts their links, and follows them, building the copy of the web that a search engine indexes. This walk-through follows the four steps from [How to approach a design interview](/modules/approach-a-design-interview), and the whole walk-through is the worked example.

## What it is

The problem: a search engine can only answer queries about pages it has a copy of, and the web has billions of pages that change daily, live on millions of independent servers, and link to each other in endless cycles. A naive loop (fetch a page, follow every link) refetches the same pages forever, gets stuck in sites that generate infinite URLs, and hammers small servers until they block it.

A crawler starts from a list of seed URLs and repeatedly takes a URL from its to-do list, fetches the page, stores it, and adds the new links it found back to the list. <Src id="wiki-crawler" /> The design problem is doing that at about 1,600 pages a second while staying polite to every site, never fetching the same thing twice without reason, and keeping the important pages fresh.

## Requirements

**Step 1, scope.** Ask what is crawled, how often, and what happens to the pages.

Functional requirements:

- Start from seed URLs and discover new pages by following links.
- Fetch HTML pages (skip video and large binaries) and store their content for the indexer.
- Recrawl pages regularly, more often for pages that change often or matter more.
- Skip pages already seen, including the same content under different URLs.
- Obey `robots.txt` and per-site rate limits.

Non-functional requirements:

- **Scale**: about 1 billion pages, recrawled about weekly. <Src id="primer-crawler" />
- **Politeness**: never overload a site; at most about one request per second per host unless the site allows more.
- **Robustness**: survive malformed HTML, slow servers, redirect loops, and <Term id="crawler-trap">crawler traps</Term>.
- **Extensible**: new content types or processing steps can be added without redesigning the loop.

Out of scope: ranking and the search index itself, rendering JavaScript-heavy pages (mention it as a follow-up), and images.

## Capacity estimates

The primer's assumptions, with the arithmetic shown. <Src id="primer-crawler" /> See [Back-of-the-envelope numbers](/modules/back-of-the-envelope).

- **Pages.** 1 billion pages refreshed about weekly is about **4 billion fetches a month**. 4 billion ÷ 2.6 million seconds ≈ **1,600 pages a second**.
- **Bandwidth.** At an average 500 KB a page, 1,600 × 500 KB = **800 MB/s**, about 6.4 Gbit/s of inbound traffic. Compression on the wire roughly halves that, but plan for the raw figure.
- **Storage.** 4 billion × 500 KB = **2 PB a month** of raw pages. Keep only the latest copy plus a compressed history, and store it in [object storage](/modules/object-storage), not a database.
- **Seen URLs.** The crawler will know of far more URLs than it fetches, say 10 billion. A 64-bit fingerprint (a hash of the normalized URL) each is 10 billion × 8 B = **80 GB**. A <Term id="bloom-filter">Bloom filter</Term> in front of it at a 1% false positive rate needs about 10 bits a URL, about **12 GB**, which fits in memory across a few machines.
- **Politeness math.** At one request a second per host, 1,600 pages a second means at least **1,600 hosts in flight at once**. Throughput comes from breadth, not depth.
- **DNS.** 1,600 fetches a second would be 1,600 [DNS](/modules/dns) lookups a second without caching; most hosts are fetched many times, so a local cache cuts that by orders of magnitude.

The hard parts are the frontier (what to fetch next, politely) and deduplication, not raw compute.

## API

A crawler is an internal system, so its "API" is a few control endpoints and the event it emits for the indexer.

**Add seeds**

```http
POST /api/v1/seeds
{ "urls": ["https://example.com/", "https://news.example.org/"], "priority": "high" }

202 Accepted
{ "accepted": 2, "already_known": 0 }
```

**Inspect a URL's crawl state**

```http
GET /api/v1/urls/9f2c1a7b3e4d5f60

200 OK
{ "url": "https://example.com/a", "status": 200, "last_crawled": "2026-11-27T10:00:00Z",
  "next_crawl": "2026-12-04T10:00:00Z", "content_hash": "c41e..." }
```

**Event to the indexer** (published to a queue after each successful fetch)

```json
{ "url_hash": "9f2c1a7b3e4d5f60", "url": "https://example.com/a",
  "object_key": "pages/2026/11/27/9f2c1a7b3e4d5f60.html.gz",
  "fetched_at": "2026-11-27T10:00:00Z", "changed": true }
```

## Data model

**URLs** (one row per known URL, sharded by URL hash):

```sql
CREATE TABLE urls (
  url_hash      BIGINT PRIMARY KEY,   -- fingerprint of the normalized URL
  url           TEXT NOT NULL,
  host          TEXT NOT NULL,
  priority      REAL,                 -- importance and change rate
  last_crawled  TIMESTAMP,
  next_crawl    TIMESTAMP,
  content_hash  BIGINT,               -- SimHash of the last fetch
  http_status   SMALLINT
);
```

**Hosts** (one row per site):

```sql
CREATE TABLE hosts (
  host              TEXT PRIMARY KEY,
  robots_txt        TEXT,
  robots_fetched_at TIMESTAMP,
  crawl_delay_ms    INT DEFAULT 1000,
  next_allowed_at   TIMESTAMP,
  urls_this_cycle   INT                -- budget against crawler traps
);
```

**Page content** goes to object storage under a key derived from the URL hash and fetch date, compressed. A metadata index (URL hash to latest object key) lets the indexer find the newest copy.

## High-level design

**Step 2, draw the boxes.** A **<Term id="url-frontier">URL frontier</Term>** decides what to fetch next; a pool of fetcher workers downloads pages; a parser extracts links and text; a dedupe stage checks URLs and content against what has been seen; a page store holds the content; and the indexer consumes it. <Src id="primer-crawler" />

<CrawlerFlow />

## How it works

**Step 3, the crawl loop.** A worker takes the next URL from the frontier, fetches the page, and saves its contents. A parser extracts the links. Each link is normalized and checked against the set of URLs already seen; new ones go into the frontier, ones already seen are dropped. <Src id="primer-crawler" /> Two pages can be the same under different URLs, so the crawler also fingerprints page content and skips exact or near-duplicate signatures. <Src id="primer-crawler" />

**Politeness.** Before crawling a site, the crawler reads its **<Term id="robots-txt">robots.txt</Term>**, which lists the paths crawlers should stay out of and sometimes a crawl delay. <Src id="wiki-robots" /> It also limits how often it hits each host by giving each host its own queue in the frontier. <Src id="wiki-crawler" />

**Step 4, scale.** Run many workers, partition the frontier by host so one host's queue lives on one machine, cache DNS, decouple fetching from parsing with a [queue](/modules/queues-and-back-pressure), and store pages in object storage. <Src id="primer-crawler" /> The deep dives and bottlenecks cover each.

### Worked example: one URL through the loop

1. **Discovery.** A parser finds the link `HTTPS://Example.com:443/a/../b?utm_source=x#top` on another page.
2. **Normalize.** Lowercase the scheme and host, drop the default port and fragment, resolve `..`, strip tracking parameters: `https://example.com/b`. Without this, one page has dozens of spellings.
3. **Seen check.** Hash it to a 64-bit fingerprint. The Bloom filter says "definitely not seen", so it skips the database and inserts a `urls` row with priority 0.4.
4. **Frontier.** The URL enters a medium-priority front queue, and is later routed to the back queue for `example.com`.
5. **Politeness gate.** `example.com`'s `next_allowed_at` is 2 seconds away; the worker serving that queue fetches other hosts in the meantime.
6. **robots.txt.** The cached copy (fetched 6 hours ago) allows `/b`.
7. **Fetch.** DNS comes from the local cache; the fetch returns 200 with 480 KB of HTML in 350 ms. `next_allowed_at` moves forward by the host's crawl delay.
8. **Content dedupe.** The page's SimHash differs from every stored one by more than 3 bits, so it is new. It is gzipped to about 90 KB and written to object storage, and an event goes to the indexer.
9. **Links.** The parser finds 60 links; 52 are already seen, 8 enter the frontier.
10. **Schedule.** The page changed since last time, so `next_crawl` is set a little sooner than before (say 5 days instead of 7).

## Deep dives

### 1. The frontier: priority and politeness together

The frontier has two jobs that pull against each other: fetch important pages first, and never hit one host too often. The classic design (from the Mercator crawler) splits it into two layers:

- **Front queues** by priority. A prioritizer scores each URL by importance (links pointing at it, site reputation) and expected change rate, and puts it in one of, say, 10 priority queues.
- **Back queues** by host. A router pulls from front queues, biased towards higher priorities, and appends each URL to the queue for its host. Each back queue holds one host only.
- **A heap of next-allowed times.** A min-heap keyed by each host's `next_allowed_at` tells workers which host they may fetch from now. A worker pops the earliest host, fetches one URL from its queue, pushes the host back with `now + crawl_delay`, and repeats.

With tens of thousands of back queues active, the 1,600-pages-a-second target is met while each host sees about one request a second. Partition the whole structure by a hash of the host across frontier machines, so all of a host's state is on one machine and no coordination is needed for politeness.

### 2. Deduplication: URLs and content

**URL dedupe** stops the loop from refetching. Normalize first, then check the fingerprint. A Bloom filter answers "definitely new" or "probably seen" from memory. A "probably seen" answer is wrong about 1% of the time, which means a genuinely new URL is skipped; a crawler tolerates that, because important pages are linked from many places and get another chance. Anything the filter says is new is inserted into the `urls` table, which is the source of truth.

**Content dedupe** catches mirrors, printer-friendly copies, and session-id variants. An exact hash (SHA-256 of the body) catches byte-identical pages. For near-duplicates, compute a **<Term id="simhash">SimHash</Term>**: a 64-bit fingerprint in which similar documents differ in only a few bits. Two pages whose SimHashes differ by 3 bits or fewer are treated as duplicates. Finding near-matches among billions uses a few tables keyed by different blocks of the fingerprint, so only pages sharing a block are compared.

### 3. Freshness and recrawl scheduling

Recrawling every page weekly wastes capacity on pages that never change and is too slow for news. Track each page's change history: if the content hash changed on the last fetch, shorten its interval (for example multiply by 0.7); if not, lengthen it (multiply by 1.5), within bounds of an hour and a few months. Weight by importance, so a news home page is fetched every few minutes and an old archive page every few months. Conditional requests (`If-Modified-Since` or `ETag`) let a server answer `304 Not Modified` without sending the body, which saves most of the bandwidth on unchanged pages.

## Bottlenecks and scaling

- **Network and fetch concurrency.** 800 MB/s inbound and thousands of slow servers mean most fetches are waiting on the network. Use asynchronous I/O so each worker keeps hundreds of connections open, and set timeouts (say 10 s connect, 30 s total) so slow servers cannot tie up workers.
- **DNS.** Run a local caching resolver on each worker host, honour record <Term id="ttl">TTLs</Term>, and resolve hosts ahead of time when they reach the front of a back queue.
- **Frontier size.** Billions of queued URLs do not fit in memory. Keep the head of each queue in memory and the tail on disk, or back the queues with a log such as Kafka partitioned by host.
- **Parsing.** Parsing is CPU-bound and fetching is I/O-bound, so separate them with a queue and scale each independently.
- **Storage.** 2 PB a month is object storage territory. Compress (HTML shrinks 4 to 5×), keep history only for pages that changed, and move old copies to a colder <Term id="storage-class">storage class</Term>.
- **Crawler traps.** Infinite calendars, session ids in URLs, and auto-generated paths produce endless distinct pages. Cap URLs per host per cycle, cap path depth and URL length, and flag hosts whose new-URL rate never falls. <Src id="wiki-crawler" />

## In the real world

- **Googlebot** fetches `robots.txt` and generally caches it for up to 24 hours, reads only the first 500 KiB of it, and ignores the `crawl-delay` rule; instead it adjusts its crawl rate automatically, slowing down when a server returns errors or slows. RFC 9309 standardised the protocol in 2022.
- **Common Crawl** runs public crawls of billions of pages, publishes them as WARC files (a standard archive format holding raw HTTP responses) on Amazon S3, and identifies its crawler as `CCBot`.
- **Scrapy**, the Python crawling framework, exposes the knobs directly: `ROBOTSTXT_OBEY` (true in new projects), `CONCURRENT_REQUESTS_PER_DOMAIN` (default 8), `DOWNLOAD_DELAY` (default 0), and the AutoThrottle extension that adapts delay to server latency.
- **Apache Nutch**, the open-source crawler behind early Hadoop, sets `fetcher.server.delay` to 5 seconds between requests to the same host by default and partitions its fetch list by host.

## Trade-offs

- **Freshness vs coverage**: recrawling popular pages often uses capacity that could fetch new ones; crawlers prioritise by how often a page changes and how important it is. <Src id="wiki-crawler" />
- **Politeness vs speed**: per-host limits slow the crawl but keep sites from blocking it. <Src id="wiki-crawler" />
- **Exact vs near-duplicate detection**: exact hashes are cheap; near-duplicate signatures catch more but cost more. <Src id="primer-crawler" />
- **Bloom filter vs exact set**: memory and speed against occasionally skipping a new URL.
- **Breadth-first vs priority order**: breadth-first is simple and finds important pages early by accident; an explicit priority finds them on purpose but needs a scoring signal.

## Interview tips

- Draw the loop first: frontier → fetch → parse → dedupe → frontier.
- Do the politeness arithmetic: 1,600 pages a second at one request per host per second means 1,600 hosts in flight.
- Say "robots.txt and per-host rate limits" before the interviewer asks, and explain front and back queues.
- Explain how you partition the frontier and the seen-set across machines (by host and by URL hash).
- Mention crawler traps and how budgets per host stop them.

**Common mistakes:**

- One global FIFO queue for the frontier, which sends bursts of requests to whichever host happens to have many links in a row.
- Deduplicating raw URLs without normalizing them first, so one page is fetched under many spellings.
- Storing page bodies in the relational database instead of object storage.
- Recrawling everything on a fixed schedule regardless of how often each page changes.

## Common follow-up questions

### How do you crawl pages that need JavaScript to render?

Send them to a separate rendering tier that runs headless browsers. Rendering costs 10 to 100× more CPU than parsing HTML, so only render pages whose raw HTML has little content or which are known to depend on scripts, and queue them with lower priority.

### How do you distribute the crawler across data centres?

Assign hosts to regions by where they are served from, so fetches cross less of the internet. Each region runs its own frontier partition and workers; the seen-URL set is partitioned by URL hash, and links discovered in one region for a host owned by another are forwarded to that region.

### What happens when a worker crashes mid-fetch?

The URL was leased, not deleted, from its back queue. If the lease expires without an acknowledgment, the URL becomes available again, giving <Term id="at-least-once-delivery">at-least-once</Term> fetching. A duplicate fetch is harmless because content dedupe and the URL table make processing idempotent.

### How would you prioritise which pages to crawl first?

Score URLs by importance (the number and quality of links pointing at them, a PageRank-like signal computed offline), the site's past quality, and the page's change rate. New URLs inherit some score from the page that linked to them. The score picks the front queue.

### How do you stop the crawler from being used to attack a site?

Never let external input set crawl rates. Enforce per-host and per-IP limits (several hosts may share one server IP), back off on 429 and 503 responses with <Term id="exponential-backoff">exponential backoff</Term>, and publish a page explaining the crawler with a contact address, linked from the user-agent string.

## Go deeper

- [System Design Primer, Design a web crawler](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/web_crawler/README.md): the full primer solution with its estimates and component diagram.
- [RFC 9309, Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html): the standard for robots.txt, including how rules match and how long to cache the file.
- [Google, How Google interprets the robots.txt specification](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt): how the largest crawler applies the rules in practice, with size limits and caching.
- [Common Crawl](https://commoncrawl.org/): a real, public crawl of billions of pages with its data formats and statistics.
