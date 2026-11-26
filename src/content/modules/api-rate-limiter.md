---
slug: api-rate-limiter
title: Design an API rate limiter
section: case-studies
readFirst:
  - rate-limiting
  - reverse-proxies-api-gateways
  - where-to-cache
sources:
  - id: wiki-rl
    title: Wikipedia, Rate limiting
    url: https://en.wikipedia.org/wiki/Rate_limiting
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-tb
    title: Wikipedia, Token bucket
    url: https://en.wikipedia.org/wiki/Token_bucket
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-redis
    title: Wikipedia, Redis
    url: https://en.wikipedia.org/wiki/Redis
    license: CC BY-SA 4.0
    use: reworded
  - id: mdn-429
    title: MDN Web Docs, 429 Too Many Requests
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
    license: CC BY-SA 2.5
    use: reworded
quiz:
  - prompt: Why keep the counters in a shared store like Redis instead of in each server's memory?
    options:
      - Redis is the only database that can count
      - With many limiter servers, a shared counter makes the limit global
      - Memory cannot hold integers
      - It removes the need for a 429
    correct: 1
    explanation: Per-server counters would let a client get N times the limit by spreading requests.
  - prompt: Why must the increment be atomic?
    options:
      - So two concurrent requests cannot both read the old count and slip over the limit
      - It makes Redis cheaper
      - HTTP requires it
      - So the key never expires
    correct: 0
    explanation: Read-then-write from two servers races; INCR does both in one step.
  - prompt: What is the weakness of a fixed window counter?
    options:
      - It needs a database per user
      - It cannot return 429
      - It uses too much memory
      - A burst at the end of one window plus the start of the next can allow up to twice the limit
    correct: 3
    explanation: Sliding windows or a token bucket smooth that edge.
  - prompt: What should the limiter do if Redis is down?
    options:
      - Always crash
      - Delete every counter
      - Decide in advance whether to fail open (allow) or fail closed (reject)
      - Send every request to Redis anyway
    correct: 2
    explanation: Most public APIs fail open, so a limiter outage does not become a full outage.
  - prompt: What does a client get when it is over the limit?
    options:
      - 429 Too Many Requests, often with a Retry-After header
      - 500 Internal Server Error
      - 301 Moved Permanently
      - A dropped connection with no response
    correct: 0
    explanation: Retry-After tells well-behaved clients when to come back.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RateLimiterFlow from '#lib/diagrams/RateLimiterFlow.svelte';
</script>

This case study turns the ideas from [Rate limiting](/modules/rate-limiting) into a service that limits every caller of an API across many servers. It follows the steps from [How to approach a design interview](/modules/approach-a-design-interview).

## What it is

**Step 1, requirements.** Limit each caller (by API key, user or IP) to a number of requests per time window, for example 100 a minute, with different limits per plan or endpoint. The limit must hold across every server, add only a millisecond or so per request, and tell rejected callers when to retry. <Src id="wiki-rl" /> <Src id="mdn-429" />

## How it works

**Step 2, high-level design.** The limiter runs in the [API gateway](/modules/reverse-proxies-api-gateways) or as middleware, in front of the services. Counters live in a shared in-memory store such as Redis, so every limiter instance sees the same count. <Src id="wiki-rl" /> <Src id="wiki-redis" />

**Step 3, the request path.** For each request the limiter builds a key from the caller and the current window (`ratelimit:key123:12:05`), atomically increments it in Redis, and sets it to expire when the window ends. If the new count is within the limit, the request goes through; otherwise the limiter replies **429 Too Many Requests** with a `Retry-After` header. <Src id="wiki-rl" /> <Src id="mdn-429" />

<RateLimiterFlow />

That is a **<Term id="fixed-window-counter">fixed window counter</Term>**: simple and cheap, but a burst at the end of one window and the start of the next can let through twice the limit. A sliding window, or a [token bucket](/modules/rate-limiting) that refills at a steady rate, smooths that out at the cost of a little more state. <Src id="wiki-tb" /> <Src id="wiki-rl" />

**Step 4, scale and failure.** Shard counters across Redis nodes by caller key ([consistent hashing](/modules/consistent-hashing)) so no node is hot. Keep limit rules in config the limiter caches locally. Decide up front what happens if Redis is unreachable: fail open (allow) or fail closed (reject). <Src id="wiki-redis" /> <Src id="wiki-rl" />

## Trade-offs

| | Fixed window | Sliding window | Token bucket |
| --- | --- | --- | --- |
| State per caller | One counter | Two counters or a log | Tokens + last refill time |
| Bursts at window edges | Up to 2× limit | Smoothed | Allowed up to bucket size |
| Complexity | Lowest | Medium | Medium |

- **A central store adds a network hop** to every request; a local limiter is faster but only approximately global. <Src id="wiki-rl" />
- **Fail open vs fail closed**: availability against protection. <Src id="wiki-rl" />

## Interview tips

- Pin down who is limited (key, user, IP) and where the limiter sits before drawing algorithms.
- Say "atomic increment with expiry in Redis" and why atomic matters.
- Name the fixed-window edge burst and the fix.
- Cover failure: what happens when the counter store is down.
