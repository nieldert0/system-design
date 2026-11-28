---
slug: api-rate-limiter
title: Design an API rate limiter
section: case-studies
upgraded: true
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
    explanation: Read-then-write from two servers races; INCR or a Lua script does both in one step.
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
  - prompt: A key's limit is 100 a minute with a sliding window counter. At 12:05:15 the 12:04 window counted 80 and the 12:05 window has 30. Is the next request allowed?
    options:
      - No, the estimate is already 110
      - Yes, the estimate is 80 × 0.75 + 30 = 90, so the request makes 91
      - Yes, because only the current window's 30 counts
      - No, because 80 + 30 is over 100
    correct: 1
    explanation: 15 seconds into the minute, 75% of the previous window still overlaps the last 60 seconds, so 60 + 30 = 90 and there is room for 10 more.
  - prompt: In the capacity estimate, 500,000 requests a second peak go through limiters backed by Redis shards that each handle about 100,000 operations a second comfortably. Why does the design use 10 shards rather than 5?
    options:
      - Redis cannot run fewer than 10 shards
      - Five shards would sit at full load with no headroom for hot keys, failover, or growth
      - Each request needs exactly two shards
      - Ten is required by consistent hashing
    correct: 1
    explanation: Running a store at 100% of its comfortable rate leaves nothing for a hot key or for a replica taking over; 50% utilisation is the safer target.
  - prompt: The gateway fleet has 200 nodes, and you add a 50 ms local cache of "this key is blocked" decisions. What is the cost?
    options:
      - None; it is always exact
      - Redis load goes up
      - A blocked caller can be let back in up to 50 ms late, and an unblocked one can be rejected for up to 50 ms
      - Clients stop seeing Retry-After
    correct: 2
    explanation: Local caching trades a small, bounded error for far fewer Redis calls when an abusive key keeps hammering.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RateLimiterFlow from '#lib/diagrams/RateLimiterFlow.svelte';
</script>

This case study turns the algorithms from [Rate limiting](/modules/rate-limiting) into a service that enforces limits for every caller of a public API across a fleet of servers. It follows the four steps from [How to approach a design interview](/modules/approach-a-design-interview), and the whole walk-through is the worked example.

## What it is

The problem: one customer's runaway script sends 20,000 requests a second to an API built for 2,000, and every other customer's requests start timing out. A rate limiter stops that by counting each caller's requests and rejecting the excess early and cheaply, before it reaches databases or other expensive services. <Src id="wiki-rl" />

On a single server that is a counter in memory. The design problem starts when the API runs on 200 servers behind a [load balancer](/modules/load-balancers): a caller's requests land on different machines, so the count has to be shared, the check has to stay fast, and the limiter itself must not become the thing that takes the API down.

## Requirements

**Step 1, scope.** Ask who is limited, what the limits look like, and what happens to a rejected request.

Functional requirements:

- Limit each caller by API key, falling back to user id or client IP for unauthenticated traffic.
- Support several rules per caller, for example 100 requests a minute overall and 10 a minute on `POST /payments`, with higher limits for paid plans.
- Reject excess requests with **429 Too Many Requests** and tell the caller when to retry. <Src id="mdn-429" />
- Report the remaining quota on every response, so well-behaved clients can slow down before they are rejected.
- Let operators change limits without a deploy.

Non-functional requirements:

- **Low overhead**: under about 1 ms added at p99 (the 99th <Term id="percentile">percentile</Term>), because every API call pays it.
- **Accurate enough**: the limit holds across all servers, give or take a few percent. Exact counting is not worth a slower API.
- **Highly available**: a limiter failure must not become an API outage.
- **Scales with traffic**: adding API servers needs no limiter changes.

Out of scope: billing for usage, and long-term quotas (a million calls a month), which belong in a metering pipeline rather than the hot path.

## Capacity estimates

Show the arithmetic; see [Back-of-the-envelope numbers](/modules/back-of-the-envelope) for the method.

- **Traffic.** Assume 1 million API keys and 20 billion requests a day. 20 billion ÷ 86,400 s ≈ **230,000 requests a second** on average; plan for a peak about 2× that, **500,000 a second**.
- **Fleet.** At 2,500 requests a second per gateway node, that is 200 gateway nodes at peak.
- **Store operations.** Each request runs one atomic check against the counter store, so the store does 500,000 operations a second at peak. A single Redis node handles roughly 100,000 small operations a second comfortably, so 5 shards would be at full load. We use **10 shards**, each with a replica, to stay near 50% <Term id="utilisation">utilisation</Term>.
- **Memory.** Only keys active in the current window hold state. Say 200,000 keys are active in any minute, each with 3 rules, and each rule keeps 2 counters of about 100 bytes with key overhead: 200,000 × 3 × 2 × 100 B ≈ **120 MB**. Memory is not the constraint; operations per second are.
- **Latency budget.** A Redis round trip inside one availability zone is about 0.3 to 0.5 ms, which fits the 1 ms budget with room for the script to run.

The estimate says the hard parts are throughput on the counter store and failure handling, not storage.

## API

The limiter has no public endpoint of its own; it shows up as headers and one status code on every API response, plus an internal check call if it runs as a separate service.

**A request under the limit**

```http
GET /v1/charges
Authorization: Bearer sk_live_123

200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 37
RateLimit-Reset: 23
```

**A request over the limit**

```http
429 Too Many Requests
Retry-After: 23
RateLimit-Limit: 100
RateLimit-Remaining: 0
Content-Type: application/json

{ "error": "rate_limited", "message": "100 requests per minute exceeded" }
```

`Retry-After` is in seconds; `RateLimit-Reset` is seconds until the quota refills. GitHub and many others send the same idea under `X-RateLimit-*` names.

**Internal check (if the limiter is a sidecar service)**

```http
POST /check
{ "descriptors": [ { "key": "api_key", "value": "sk_live_123" },
                   { "key": "route", "value": "POST /payments" } ],
  "hits": 1 }

200 OK
{ "allowed": true, "remaining": 9, "reset_seconds": 41 }
```

## Data model

Two kinds of data, with very different access patterns.

**Rules** are small, change rarely, and are read on every request, so each gateway node caches them in memory and reloads on change:

```yaml
- match: { plan: free }
  limit: 100
  window: 60s
- match: { plan: free, route: "POST /payments" }
  limit: 10
  window: 60s
- match: { plan: enterprise }
  limit: 5000
  window: 60s
```

**Counters** live in Redis, one key per caller, rule, and window. For a sliding window counter:

```
rl:{sk_live_123}:global:12:05   → 30    (TTL 120 s)
rl:{sk_live_123}:global:12:04   → 80    (TTL 120 s)
```

For a <Term id="token-bucket">token bucket</Term> the key holds two fields instead: `tokens` and `last_refill_ms`. The braces around the API key are a Redis Cluster hash tag: they make every key for one caller hash to the same shard, so a single script can read and update them all atomically. Every key carries a <Term id="ttl">TTL</Term> a little longer than its window, so idle callers cost nothing.

## High-level design

**Step 2, draw the boxes.** The limiter runs inside the [API gateway](/modules/reverse-proxies-api-gateways), or as a small service the gateway calls, in front of every backend. Counters live in a sharded in-memory store such as Redis, so every gateway node sees the same count. <Src id="wiki-rl" /> <Src id="wiki-redis" />

<RateLimiterFlow />

The request path:

1. A request arrives at any gateway node.
2. The node identifies the caller (API key from the header, else user id, else IP) and looks up its rules in the local rule cache.
3. It runs one atomic script on the Redis shard that owns that caller, which checks and updates every matching rule's counters.
4. If every rule has room, the request goes to the backend with `RateLimit-*` headers added to the response.
5. Otherwise the gateway replies 429 with `Retry-After` and the backend never sees the request. <Src id="mdn-429" />

## How it works

**Step 3, the core components.** The simplest counter is a **<Term id="fixed-window-counter">fixed window counter</Term>**: build a key from the caller and the current minute, `INCR` it, and set it to expire when the minute ends. <Src id="wiki-rl" /> It is one command, but a caller can send 100 requests at 12:04:59 and 100 more at 12:05:00, so 200 pass within two seconds.

The design uses a **<Term id="sliding-window-counter">sliding window counter</Term>** instead: keep the counts for the current and previous windows, and estimate the last 60 seconds as previous × (share of the previous window still overlapping) + current. It costs two counters and removes almost all of the edge burst. A token bucket is the alternative when you want to allow controlled bursts. <Src id="wiki-tb" /> [Rate limiting](/modules/rate-limiting) compares the algorithms in depth.

**Step 4, scale and failure.** Shard counters across Redis nodes by caller key with [consistent hashing](/modules/consistent-hashing) so adding a shard moves only a fraction of keys, cache rules locally, and decide up front what happens when Redis is unreachable. <Src id="wiki-redis" /> The deep dives work through each.

### Worked example: one caller's minute

Caller `sk_live_123` is on the free plan, 100 requests a minute, sliding window.

1. **12:04.** The caller makes 80 requests. The key `rl:{sk_live_123}:global:12:04` ends the minute at 80.
2. **12:05:15**, 15 seconds into the next minute. The current key holds 30. The previous window still covers 45 of the last 60 seconds, so its weight is 45 ÷ 60 = 0.75. Estimate = 80 × 0.75 + 30 = **90**. The request makes 91, which is under 100, so it is allowed and the response says `RateLimit-Remaining: 9`.
3. **12:05:15 to 12:05:20.** The caller fires 15 requests in a burst. The first 9 pass (estimate reaches 100). The next 6 get 429.
4. **Retry-After.** The gateway computes when the estimate will drop below 100 again. Each second the previous window's weight falls by 1/60, removing 80 ÷ 60 ≈ 1.3 requests from the estimate, so one slot frees in about a second. It sends `Retry-After: 1`. A fixed window would have said 40 seconds, and then let the caller burst again at 12:06:00.
5. **Cost.** Each check is one Lua script on one shard, about 0.4 ms round trip. The backend never saw the 6 rejected calls.

## Deep dives

### 1. Making the check atomic

Two gateway nodes receive requests from the same caller at the same instant. If each reads the count (99), decides it is under 100, and writes 100, both pass and the caller got 101. A read-then-write from two machines races.

The fix is to do the read, the decision, and the write in one step on the store. For a fixed window, `INCR` already does that: it returns the new value, and the gateway rejects if it exceeds the limit. For a sliding window or a token bucket, the logic needs several reads and a conditional write, so it goes into a **Lua script** that Redis runs to completion without interleaving other commands:

```lua
-- KEYS[1] = current window, KEYS[2] = previous window
-- ARGV[1] = limit, ARGV[2] = weight of previous window, ARGV[3] = TTL
local cur  = tonumber(redis.call('GET', KEYS[1]) or '0')
local prev = tonumber(redis.call('GET', KEYS[2]) or '0')
if prev * tonumber(ARGV[2]) + cur + 1 > tonumber(ARGV[1]) then
  return 0
end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1
```

The script only works if both keys live on the same shard, which is why the key schema uses a hash tag around the caller id.

### 2. Where the counter lives: central, local, or both

**Central store only.** Every request costs a network hop, but the count is exact across the fleet. This is the default.

**Local counters only.** Each of the 200 nodes allows limit ÷ 200 per caller. No network hop, but the load balancer rarely spreads one caller evenly, so a caller pinned to a few nodes gets rejected far below the real limit, while one spread across all nodes gets roughly the right total. It is only safe for coarse, high limits such as "10,000 a second per IP".

**Local plus central.** The usual production answer. Each node checks Redis, but also caches a "blocked until 12:05:41" decision locally for a short time (say 50 ms) once a key is over its limit. An abusive client sending 50,000 requests a second then costs Redis about 20 calls a second per node instead of 250. The price is a bounded error: a key can be unblocked up to 50 ms late. Some systems also batch: each node counts locally and pushes increments to Redis every 100 ms, accepting that the limit may be overshot by one batch.

### 3. When the counter store fails

If a Redis shard is unreachable, the gateway must still answer. The two choices:

- **<Term id="fail-open">Fail open</Term>**: allow the request without checking. The API stays up, and abusive callers get through until the shard recovers. Most public APIs choose this, because a limiter outage that blocks every customer is worse than a few minutes of unlimited traffic.
- **Fail closed**: reject the request. Correct for limits that protect money or security, such as login attempts or payment creation, where letting a brute-force attack through is worse than an error.

Either way, set a tight timeout on the Redis call (say 5 ms) so a slow shard does not add seconds to every request, fall back to a coarse local limit while the shard is down, and alert. Redis replicas with automatic <Term id="failover">failover</Term> keep the window short; a few lost counter updates during failover are harmless, since counters reset every minute anyway.

## Bottlenecks and scaling

- **Redis throughput.** The store is the bottleneck at 500,000 checks a second. Shard by caller with consistent hashing, keep each shard near 50% load, and add shards as traffic grows. Each check touches exactly one shard, so there is no cross-shard coordination.
- **Hot keys.** One huge customer or an attacker can push 100,000 requests a second at one shard. The local "blocked" cache absorbs most of an abusive key's traffic. For a legitimately huge customer, split its key into N sub-keys (`sk_live_123#0` to `#7`) each allowed limit ÷ N, and pick a sub-key at random per request.
- **Latency.** Keep Redis in the same availability zone as the gateways, use persistent connections, and send all rule checks for one request in a single script call rather than one round trip per rule.
- **Multiple regions.** Cross-region round trips cost 50 to 150 ms, far over budget. Give each region its own Redis cluster and split the limit between regions, or accept that a caller hitting three regions gets up to 3× the limit, which is usually tolerable.
- **Rule changes.** Store rules in a config service and push changes to gateways; never read rules from a database per request.

## In the real world

- **Stripe** runs four limiters in front of its API: a request rate limiter (a token bucket per user in Redis), a concurrent-requests limiter, and two load shedders that drop low-priority traffic when the fleet or its workers are overloaded. Its engineering post includes the Redis code.
- **Envoy** proxies support global rate limiting by calling an external rate limit service over gRPC (the reference `envoyproxy/ratelimit` service is Redis-backed). Rules match on descriptors such as a header or route, and the `failure_mode_deny` setting defaults to false, so Envoy fails open if the service is down.
- **Nginx** offers `limit_req_zone` with a `rate` such as `10r/s` and a `burst` allowance, implemented as a leaky bucket in shared memory. It is per instance, so a fleet of 10 Nginx servers allows roughly 10× the configured rate unless you divide it.
- **GitHub's REST API** allows 5,000 requests an hour per authenticated user and 60 for unauthenticated IPs, and returns `x-ratelimit-limit`, `x-ratelimit-remaining`, and `x-ratelimit-reset` on every response.

## Trade-offs

| | Fixed window | Sliding window counter | Token bucket |
| --- | --- | --- | --- |
| State per caller and rule | One counter | Two counters | Tokens + last refill time |
| Bursts at window edges | Up to 2× limit | Smoothed | Allowed up to bucket size |
| Store operation | One `INCR` | Lua script | Lua script |
| Complexity | Lowest | Medium | Medium |

- **A central store adds a network hop** to every request; a local limiter is faster but only approximately global. <Src id="wiki-rl" />
- **Fail open vs fail closed**: availability against protection, chosen per rule rather than once for the whole system. <Src id="wiki-rl" />
- **Exactness vs cost**: local caching and batching cut store load by 10× or more in exchange for overshooting the limit by a small, bounded amount.

## Interview tips

- Pin down who is limited (key, user, IP), the rules, and where the limiter sits before drawing algorithms.
- Do the store arithmetic: requests per second at peak versus operations per second per Redis node is what sizes the design.
- Say "atomic check-and-increment in one Lua script, keys for one caller on one shard" and explain the race it prevents.
- Name the fixed-window edge burst and why a sliding window counter fixes it.
- Cover failure before you are asked: fail open by default, fail closed for logins and payments, with a short timeout.

**Common mistakes:**

- Checking the count and then incrementing it in two separate commands, which lets concurrent requests slip past the limit.
- Keeping counters only in each server's memory and calling the limit global; a caller spread over 200 nodes gets up to 200× the limit.
- Letting a slow or dead Redis block every request, so the limiter causes the outage it was meant to prevent.
- Returning 429 without `Retry-After`, so clients retry immediately and make the overload worse.

## Common follow-up questions

### How do you limit concurrent requests rather than requests per second?

Keep a counter of in-flight requests per caller: increment when a request starts and decrement when it finishes. Because a crash can skip the decrement, store each in-flight request as an entry in a sorted set with its start time and drop entries older than the maximum request duration. Stripe uses this to stop a few slow, expensive calls from hogging workers.

### How would you rate-limit across multiple regions?

Keep the check regional, because a cross-region hop costs 50 to 150 ms. Either split each caller's limit between regions by their share of traffic, or let each region enforce the full limit and asynchronously share counts so a caller using many regions is caught within a few seconds. Exact global limits are rarely worth the latency.

### What should a client do when it gets a 429?

Wait at least `Retry-After` seconds, then retry with <Term id="exponential-backoff">exponential backoff</Term> and random jitter so thousands of clients do not all come back in the same second. Good SDKs do this automatically, and also read `RateLimit-Remaining` to slow down before hitting the limit.

### How do you stop one tenant from using all of a shared backend even when every tenant is under its own limit?

Per-caller limits do not protect against total overload. Add a global limit per backend, and <Term id="load-shedding">load shedding</Term> that drops low-priority traffic (analytics, retries) first when utilisation crosses a threshold. Per-caller fairness and total protection are separate mechanisms.

### Why not just use the cloud provider's or CDN's rate limiting?

For coarse protection against floods by IP, you should: it stops traffic before it reaches your servers. But edge limiters usually do not know your API keys, plans, or per-route costs, so business limits still need a limiter in your gateway that understands callers.

## Go deeper

- [Stripe, Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters): the four limiters Stripe runs, how they rolled them out safely, and the Redis token bucket code.
- [Cloudflare, How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/): why Cloudflare chose the sliding window counter and how accurate it turned out to be in production.
- [Envoy, Global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting): how a proxy delegates the check to a central service, and the local-plus-global pattern.
- [Redis, INCR](https://redis.io/docs/latest/commands/incr/): the command reference, including the rate limiter patterns built on `INCR` and `EXPIRE`.
