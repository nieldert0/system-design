---
slug: url-shortener
title: Design a URL shortener
section: case-studies
readFirst:
  - approach-a-design-interview
  - back-of-the-envelope
  - where-to-cache
sources:
  - id: primer-pastebin
    title: System Design Primer, Design Pastebin.com (or Bit.ly)
    url: https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md
    license: CC BY 4.0
    use: reworded
  - id: wiki-url-shortening
    title: Wikipedia, URL shortening
    url: https://en.wikipedia.org/wiki/URL_shortening
    license: CC BY-SA 4.0
    use: reworded
  - id: mdn-301
    title: MDN Web Docs, 301 Moved Permanently
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/301
    license: CC BY-SA 2.5
    use: reworded
quiz:
  - prompt: Why is a URL shortener read-heavy?
    options:
      - Each link is created once but followed many times
      - Writes are blocked by the cache
      - Links expire after one click
      - Short keys are stored only in memory
    correct: 0
    explanation: We assume 10 reads for every write, which is why the design is cache-first.
  - prompt: How many keys do 7 base62 characters give?
    options:
      - About 62 thousand
      - About 3.5 trillion
      - About 7 million
      - Exactly 2^32
    correct: 1
    explanation: 62^7 is roughly 3.5 × 10^12, about 10,000 times the 360 million links we expect over three years.
  - prompt: What does generating keys from a unique counter avoid, compared with hashing the long URL?
    options:
      - The need for a database
      - Redirects
      - Collisions between two URLs that hash to the same short key
      - HTTPS
    correct: 2
    explanation: A truncated hash can collide; a counter encoded in base62 is unique by construction.
  - prompt: Why might a shortener reply 302 instead of 301?
    options:
      - 302 is faster
      - 301 is not allowed for short links
      - 302 hides the long URL
      - Browsers cache 301 redirects, so later clicks skip the shortener and cannot be counted
    correct: 3
    explanation: 301 saves load; 302 keeps every click visible for analytics.
  - prompt: Each web server reserves 1,000 IDs at a time from the counter. A server crashes after using 300 of its block. What happens?
    options:
      - The other servers reuse the 700 unused IDs, causing collisions
      - The 700 unused IDs are skipped forever, which is harmless given trillions of keys
      - The counter rolls back by 700
      - All links from that server break
    correct: 1
    explanation: Gaps in the sequence cost nothing because nobody depends on keys being contiguous, and the key space is huge.
  - prompt: In the capacity estimate, 40 reads a second average with 10× peaks and a 20% hot set. Roughly how much cache memory holds the hot links for a day?
    options:
      - About 70 MB
      - About 7 GB
      - About 700 GB
      - About 70 TB
    correct: 0
    explanation: 40/s × 86,400 s ≈ 3.5 million reads a day; 20% hot is 700,000 links at about 100 bytes each, roughly 70 MB. It fits on one cache node with room to spare.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import UrlShortenerFlow from '#lib/diagrams/UrlShortenerFlow.svelte';
</script>

A URL shortener turns a long link into a short one and redirects anyone who opens it. It is a classic first case study because it is small enough to finish in 45 minutes but still touches key generation, storage, caching, and scale. This walk-through follows the four steps from [How to approach a design interview](/modules/approach-a-design-interview), and the whole walk-through is the worked example.

## What it is

The problem: long URLs with tracking parameters break in emails, overflow SMS limits, and look suspicious on slides. A shortener stores a mapping from a short key to the long URL, so `sho.rt/aZ3kQ9x` stands in for a 300-character link. Opening the short link returns an HTTP redirect to the long one. <Src id="wiki-url-shortening" /> Bit.ly and TinyURL are the well-known examples. Pastebin is the same design with a block of text stored instead of a URL. <Src id="primer-pastebin" />

The interesting parts are not the redirect itself but: how to make keys short *and* unique without a bottleneck, how to serve far more reads than writes cheaply, and what to do about expiry and abuse.

## Requirements

**Step 1 is to pin down scope before drawing anything.** Ask the interviewer, then state what you will assume.

Functional requirements:

- A user submits a long URL and gets back a short link.
- Anyone opening the short link is redirected to the long URL.
- Optionally, the user picks a custom alias (`sho.rt/my-talk`) and an expiry time.
- Optionally, the owner sees click counts.

Non-functional requirements:

- **Redirects must be fast**: under about 50 ms at the server, because a redirect sits in front of every page load.
- **Highly available for reads**: a dead shortener breaks every link ever shared. Creating links can tolerate slightly lower availability.
- **Keys must never collide**: two long URLs must never share a short key.
- **Keys should not be easily guessable**, so private links cannot be enumerated.

Out of scope for now: user accounts, link editing, and detailed analytics dashboards.

## Capacity estimates

Show the arithmetic; the numbers drive the design. See [Back-of-the-envelope numbers](/modules/back-of-the-envelope) for the method. <Src id="primer-pastebin" />

- **Writes.** 10 million new links a month ÷ 2.6 million seconds in a month ≈ **4 writes a second** on average.
- **Reads.** At 10 reads per write, about **40 redirects a second** on average. Plan for peaks of 10×, so 400/s.
- **Total links.** 10 million × 12 months × 3 years = **360 million links** to keep.
- **Storage.** Each row holds a 7-byte key, a long URL averaging about 100 bytes, a creation and expiry timestamp, and an owner id; call it **about 500 bytes** with index overhead. 360 million × 500 B ≈ **180 GB** over three years. That fits on one database server, so sharding is a later concern, not a launch one.
- **Bandwidth.** Writes: 4/s × 500 B = 2 KB/s. Reads: 40/s × 500 B = 20 KB/s. Tiny.
- **Cache.** 40 reads/s × 86,400 s ≈ 3.5 million reads a day. If 20% of links get most traffic (the hot set), caching 700,000 entries at about 100 bytes each is about **70 MB**. A single small cache node holds a day of hot links.
- **Key length.** 360 million keys need log₆₂(360 million) ≈ 4.8 base62 characters. We choose **7 characters** for 62⁷ ≈ 3.5 trillion keys, about 10,000× headroom.

These figures are small. The point of the estimate is to show that the hard parts are uniqueness and availability, not raw scale.

## API

Two endpoints are enough. A REST style with JSON bodies is the natural choice; see [API design](/modules/api-design).

**Create a link**

```http
POST /api/v1/links
Content-Type: application/json

{ "long_url": "https://example.com/very/long/path?utm_source=x",
  "custom_alias": "my-talk",
  "expires_at": "2027-06-01T00:00:00Z" }
```

```http
201 Created
{ "key": "my-talk", "short_url": "https://sho.rt/my-talk",
  "long_url": "https://example.com/very/long/path?utm_source=x",
  "expires_at": "2027-06-01T00:00:00Z" }
```

`custom_alias` and `expires_at` are optional. A taken alias returns `409 Conflict`; an invalid URL returns `400 Bad Request`. Creation is rate-limited per caller (see below).

**Follow a link**

```http
GET /aZ3kQ9x

302 Found
Location: https://example.com/very/long/path?utm_source=x
```

An unknown or expired key returns `404 Not Found`. Whether to send 301 or 302 is a deliberate choice covered in the deep dives.

## Data model

One table carries the core design. A relational database works fine at 180 GB; a key-value store such as DynamoDB or Cassandra also fits, since every read is a lookup by primary key. See [SQL vs NoSQL](/modules/sql-vs-nosql).

```sql
CREATE TABLE links (
  key         VARCHAR(16) PRIMARY KEY,  -- base62 key or custom alias
  long_url    TEXT        NOT NULL,
  owner_id    BIGINT,
  created_at  TIMESTAMP   NOT NULL,
  expires_at  TIMESTAMP              -- NULL means never
);
CREATE INDEX links_expires_at ON links (expires_at);
```

The primary key is the short key, so a redirect is a single index lookup. The index on `expires_at` lets a clean-up job find expired rows without scanning the table. Click counts, if needed, go in a separate store (see the follow-ups), so the hot read path never has to write.

## High-level design

**Step 2, draw the boxes.** A load balancer spreads traffic across stateless web servers. Writes go through an ID allocator that hands out unique numbers, which are encoded to base62 keys and stored in the database. Reads check a cache first and fall back to the database on a miss. <Src id="primer-pastebin" />

<UrlShortenerFlow />

The create path:

1. The client sends `POST /api/v1/links`.
2. The web server validates the URL and takes the next ID from its local block (say 1,000,000,123).
3. It encodes the ID as base62 (`4c92` padded to 7 characters) and inserts the row.
4. It returns the short URL.

The redirect path:

1. The browser requests `GET /aZ3kQ9x`.
2. The web server looks up `aZ3kQ9x` in the cache. On a hit, it is done in about a millisecond.
3. On a miss, it reads the database, stores the result in the cache with a TTL, and checks `expires_at`.
4. It replies `302 Found` with the long URL in the `Location` header, or `404`.

This is [cache-aside](/modules/cache-strategies-and-eviction), the right default for a read-heavy, rarely changing mapping.

## How it works

**Step 3, the core components.** The design needs a unique key per link. One option is to hash the long URL (MD5 or SHA-256) and keep the first 7 characters; the other is a unique counter encoded in **<Term id="base62">base62</Term>** (`0-9a-zA-Z`). <Src id="primer-pastebin" /> The deep dives below compare them and settle on the counter. To follow a link, the server looks the key up in the cache, falls back to the database, and replies with a redirect. <Src id="primer-pastebin" />

**Step 4, scale.** Reads dominate, so put a cache in front of the database and read replicas behind it. Run several stateless web servers behind a [load balancer](/modules/load-balancers). Hand ID ranges to servers so the counter is not a bottleneck, and [shard](/modules/federation-sharding-denormalization) by key once one database fills up. The bottlenecks section works through each.

## Deep dives

### 1. Generating unique short keys

**Hash the long URL.** MD5 gives 128 bits; base62-encoding and keeping 7 characters keeps about 41 bits. Different URLs will eventually share a prefix (by the birthday paradox, a 50% chance of at least one collision appears after roughly √(62⁷) ≈ 1.9 million links), so every insert must check for an existing row and retry with a salt on conflict. A benefit is that the same long URL always gets the same key, which deduplicates for free.

**Counter plus base62.** A single counter guarantees uniqueness, and base62 turns 1,000,000,123 into a short string. The risk is that one counter is a single point of failure (if it goes down, nobody can create links) and a hot spot. The fix is **range allocation**: each web server asks a small coordination service (a database row, Redis `INCRBY`, or ZooKeeper) for a block of 1,000 IDs at a time and hands them out locally. At 4 writes a second, the coordinator is called about once every few minutes. If a server crashes mid-block, the unused IDs are simply skipped; with 3.5 trillion keys, gaps cost nothing.

**Guessability.** Sequential keys let anyone walk `aaaaaa1`, `aaaaaa2`... and find private links. Shuffle the ID before encoding, either with a reversible bit permutation or a small block cipher over the 41-bit space, so neighbours in the counter look unrelated as keys. Uniqueness is preserved because the shuffle is one-to-one.

**Custom aliases** skip the generator and insert directly; the primary key constraint rejects a duplicate, which the API turns into `409`. Reserve a prefix or minimum length so aliases cannot collide with generated keys.

### 2. 301 or 302

A **301 Moved Permanently** lets the browser cache the redirect, so the second click from the same browser never reaches the service. That cuts load but makes clicks invisible and makes it impossible to change or disable a link for that user. A **302 Found** sends every click through the service, which keeps analytics accurate and lets you kill an abusive link immediately. <Src id="mdn-301" /> <Src id="wiki-url-shortening" /> At 400 peak reads a second, the extra load is trivial, so 302 is the usual choice when analytics matter.

### 3. Expiry and clean-up

Check `expires_at` on every redirect, so an expired link returns 404 immediately even if the row still exists. A background job then deletes expired rows in small batches using the `expires_at` index, off-peak, so it never competes with redirects. The cache TTL should be the shorter of the default TTL and the time left until the link expires, so the cache never serves an expired link.

## Bottlenecks and scaling

- **Hot links.** A link shared by a celebrity can take thousands of redirects a second. The cache absorbs it, but a single cache node holding that key can saturate; replicate the hottest keys across nodes or keep a tiny in-process cache on each web server. If you use 302, a CDN can still cache the redirect for a few seconds to cut origin load.
- **Database reads.** With a 90% hit ratio at 400 peak reads a second, the database sees 40 reads a second, trivial. If traffic grows 100×, add read replicas; replication lag is harmless because links almost never change after creation.
- **Database size.** At 180 GB, one machine is fine. Past a few terabytes, shard by a hash of the key with [consistent hashing](/modules/consistent-hashing) so adding a shard moves only a fraction of rows. The key is the only lookup, so there are no cross-shard queries.
- **Abuse.** Short links hide destinations, so spammers and phishers use them. <Src id="wiki-url-shortening" /> <Term id="rate-limiting">Rate-limit</Term> creation per IP and per account, check new URLs against a blocklist such as Google Safe Browsing, and keep a way to disable a key (another reason to prefer 302).
- **Availability.** Run web servers and the cache across at least two availability zones, and replicate the database with automatic <Term id="failover">failover</Term>. Reads can be served from replicas even while the primary is failing over; only creation pauses.

## Trade-offs

| | Counter + base62 | Hash of the long URL |
| --- | --- | --- |
| Collisions | None | Possible; needs a check and retry |
| Same URL twice | Two different keys | Same key (dedupes for free) |
| Guessable | Yes, unless shuffled | Hard to guess |
| Coordination | Range allocator | None |

- **301 vs 302**: fewer requests, or accurate analytics and the ability to disable links.
- **SQL vs key-value store**: SQL gives constraints and easy ad hoc queries; a key-value store scales writes and storage with less operational effort. Either works at this size.

## Interview tips

- Start from the read/write ratio: it is the reason the design is cache-first.
- Do the key-space arithmetic out loud (62⁷ ≈ 3.5 trillion against 360 million links) to justify 7 characters.
- Name the counter-vs-hash trade-off and how range allocation removes the counter as a single point of failure.
- Choose 301 or 302 deliberately and say why.
- Mention expiry clean-up and abuse prevention before the interviewer asks.

**Common mistakes:**

- Designing for millions of writes a second when the estimate says 4. Over-building wastes the interview's time and shows the numbers did not drive the design.
- Using a truncated hash without a collision check.
- Writing a click counter into the `links` row on every redirect, which turns the read path into a write path and creates a hot row.
- Forgetting that sequential keys are enumerable.

## Common follow-up questions

### How would you count clicks without slowing redirects?

Keep the redirect read-only. Emit a click event (key, time, country, referrer) to a [message queue](/modules/queues-and-back-pressure) such as Kafka, and have a consumer aggregate counts per key per minute into a separate analytics store. The redirect returns immediately and counts appear a few seconds later.

### What if the same long URL is submitted twice?

With a counter, it gets two keys, which is usually fine and keeps each user's link independent. If deduplication matters, add a unique index on a hash of the long URL and return the existing key, but only within the same owner, otherwise one user's expiry or deletion affects another's link.

### How do you run this in several regions?

Serve redirects from every region with local caches and read replicas, because links are created once and read many times. Either keep a single writing region or give each region its own ID ranges (for example, a region prefix in the high bits) so regions never hand out the same ID without talking to each other.

### How would you design the ID allocator to survive failure?

Store the next free block in a strongly consistent store (a single database row updated in a transaction, or ZooKeeper). Each server holds a block in memory, so the allocator being down for a few minutes does not stop creation until blocks run out. Losing a server's unused block only leaves a gap.

### Can you avoid the database lookup entirely?

Not for arbitrary URLs: the key carries 41 bits, and a long URL carries far more information, so the mapping must be stored. You can make the lookup nearly free with caching, but some store has to hold the row.

## Go deeper

- [System Design Primer, Design Pastebin.com (or Bit.ly)](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md): the full primer solution with its own estimates and diagram.
- [Instagram Engineering, Sharding and IDs at Instagram](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c): how to generate unique, sortable IDs across shards without a central counter.
- [Twitter Engineering, Announcing Snowflake](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake): the time-plus-machine-plus-sequence ID scheme many systems copied.
- [MDN, Redirections in HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections): 301, 302, 307, and 308, and how browsers cache each.
