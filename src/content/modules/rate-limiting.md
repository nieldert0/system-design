---
slug: rate-limiting
title: Rate limiting
section: communication
readFirst:
  - reverse-proxies-api-gateways
  - queues-and-back-pressure
sources:
  - id: wiki-tb
    title: Wikipedia, Token bucket
    url: https://en.wikipedia.org/wiki/Token_bucket
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-rl
    title: Wikipedia, Rate limiting
    url: https://en.wikipedia.org/wiki/Rate_limiting
    license: CC BY-SA 4.0
    use: reworded
  - id: mdn-429
    title: MDN Web Docs, 429 Too Many Requests
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
    license: CC BY-SA 2.5
    use: reworded
quiz:
  - prompt: Why rate limit an API?
    options:
      - To make it faster for one user
      - To protect it from abuse and overload and share capacity fairly
      - To encrypt traffic
      - To cache responses
    correct: 1
    explanation: Limits stop one client from starving others or taking the service down.
  - prompt: Which status code tells a client it sent too many requests?
    options:
      - 401
      - 404
      - 429
      - 500
    correct: 2
    explanation: 429 Too Many Requests, often with a Retry-After header.
  - prompt: How does a token bucket allow short bursts?
    options:
      - It does not allow bursts
      - Tokens accumulate up to the bucket size, so a client can spend several at once
      - It doubles the rate at night
      - It ignores the limit for GET
    correct: 1
    explanation: Refill rate sets the average; bucket size sets the burst.
  - prompt: What is a weakness of a fixed window counter?
    options:
      - It needs too much memory
      - A burst at the end of one window and the start of the next can allow up to twice the limit
      - It cannot count
      - It only works in one region
    correct: 1
    explanation: Sliding windows smooth out the boundary problem.
  - prompt: You run 20 API servers. Where should the counters live so the limit is global?
    options:
      - In each server's memory
      - In a shared fast store such as Redis
      - In the browser
      - In DNS
    correct: 1
    explanation: Local counters let a client get 20× the limit by spreading across servers.
  - prompt: Which key is most common for limiting a logged-in API?
    options:
      - The user's or API key's id
      - The server's hostname
      - The request body size
      - The time of day
    correct: 0
    explanation: Per user or API key; IP is used for anonymous traffic.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Rate limiting caps how many requests a client may make in a period. It keeps one noisy client from hurting everyone else.

## What it is

**<Term id="rate-limiting">Rate limiting</Term>** controls the rate of requests sent or received, to protect a service from overload, abuse such as brute-force logins or scraping, and runaway costs. <Src id="wiki-rl" />

When a client is over its limit, an HTTP API answers **429 Too Many Requests**, and can add a `Retry-After` header saying when to try again. <Src id="mdn-429" />

## How it works

Common algorithms: <Src id="wiki-tb" />

- **Token bucket**: a bucket holds up to *b* tokens and refills at *r* tokens per second. Each request takes a token; with none left it is rejected. It allows bursts up to *b* while keeping the average at *r*.
- **Leaky bucket**: requests enter a queue that drains at a fixed rate, smoothing traffic into a steady flow.
- **Fixed window counter**: count requests per key per minute. Simple, but bursts at window edges can let through up to twice the limit.
- **Sliding window**: weigh the previous window's count by how much of it overlaps, or keep a log of timestamps, to avoid the edge burst.

**Where to enforce.** Usually at the API gateway or reverse proxy, before requests reach the service. With many servers, keep counters in a shared store like Redis, using atomic increments with an expiry, so the limit is global. <Src id="wiki-rl" />

**What to key on.** Per user or API key for authenticated traffic, per IP for anonymous traffic, and sometimes per endpoint, with tighter limits on expensive or sensitive ones such as login.

## Trade-offs

- **Token bucket** is flexible and cheap (two numbers per key); the common default.
- **Sliding window log** is exact but stores a timestamp per request.
- **A central store** gives accurate global limits but adds a network hop; local limits are faster but approximate.
- **Fail open or closed?** If Redis is down, letting traffic through keeps the service up; blocking it protects the backend.

## Interview tips

- State the limit and the key: "100 requests per minute per API key".
- Pick token bucket, explain refill rate and burst size, and store counters in Redis.
- Return 429 with Retry-After, and decide whether to fail open.
