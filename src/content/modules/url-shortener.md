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
    explanation: The primer assumes about 10 reads for every write, so caching the hot links pays off.
  - prompt: How many keys do 7 base62 characters give?
    options:
      - About 62 thousand
      - About 3.5 trillion
      - About 7 million
      - Exactly 2^32
    correct: 1
    explanation: 62^7 is roughly 3.5 × 10^12, plenty for years of new links.
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
  - prompt: Where does a redirect look first?
    options:
      - The database primary
      - The cache, falling back to the database on a miss
      - The ID generator
      - The client's local storage
    correct: 1
    explanation: Popular links stay hot in the cache, which absorbs most reads.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import UrlShortenerFlow from '#lib/diagrams/UrlShortenerFlow.svelte';
</script>

A URL shortener turns a long link into a short one and redirects anyone who opens it. It is a classic first case study: small, but it touches key generation, storage, caching and scale. This walk-through follows the steps from [How to approach a design interview](/modules/approach-a-design-interview).

## What it is

The service maps a short key (`sho.rt/aZ3kQ9x`) to a long URL. Opening the short link returns an HTTP redirect to the long one. <Src id="wiki-url-shortening" /> Pastebin is the same design with a block of text stored instead of a URL. <Src id="primer-pastebin" />

**Step 1, requirements.** Users create a short link, optionally with an expiry, and anyone with the link is redirected. Assume around 10 million new links a month and 10 reads per write, so roughly 4 writes and 40 reads a second on average, with spikes higher. Over three years that is about 360 million links. <Src id="primer-pastebin" /> See [Back-of-the-envelope numbers](/modules/back-of-the-envelope) for how to get these figures.

## How it works

**Step 2, high-level design.** A web server takes requests, an ID generator hands out keys, a database stores key → long URL, and a cache holds the hot links. <Src id="primer-pastebin" />

**Step 3, the core components.** To create a link, the server needs a unique key. One option is to hash the long URL (MD5, say) and keep the first characters, but two URLs can collide on the same prefix. The simpler option is a unique counter encoded in **<Term id="base62">base62</Term>** (`0-9a-zA-Z`): 7 characters give 62^7, about 3.5 trillion keys. <Src id="primer-pastebin" /> To follow a link, the server looks the key up in the cache, falls back to the database on a miss, and replies with a redirect. <Src id="primer-pastebin" />

<UrlShortenerFlow />

A **301 Moved Permanently** tells browsers to cache the redirect, which saves load; a **302** sends every click through the service, so clicks can be counted. <Src id="mdn-301" /> <Src id="wiki-url-shortening" />

**Step 4, scale.** Reads dominate, so add a cache in front of the database ([cache-aside](/modules/where-to-cache)) and read replicas behind it. Put several stateless web servers behind a [load balancer](/modules/load-balancers). For a single counter not to become a bottleneck, give each server a range of IDs to hand out. When one database fills up, [shard](/modules/federation-sharding-denormalization) by key. <Src id="primer-pastebin" />

## Trade-offs

| | Counter + base62 | Hash of the long URL |
| --- | --- | --- |
| Collisions | None | Possible; needs a check and retry |
| Same URL twice | Two different keys | Same key (dedupes for free) |
| Guessable | Sequential keys can be enumerated | Hard to guess |

- **301 vs 302**: fewer requests, or accurate click analytics. <Src id="wiki-url-shortening" />
- **Short links hide the destination**, so they get abused for spam and phishing; real services scan targets and rate-limit creation. <Src id="wiki-url-shortening" />

## Interview tips

- Start with the read/write ratio: it drives the cache-first design.
- Do the key-space arithmetic out loud (62^7) to justify the key length.
- Name the counter-vs-hash trade-off, and how to keep the counter from being a single point of failure.
- Mention expiry clean-up and abuse prevention as follow-ups.
