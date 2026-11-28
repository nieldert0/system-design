---
slug: rate-limiting
title: Rate limiting
section: communication
upgraded: true
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
    explanation: Refill rate sets the long-run average; bucket size sets the largest burst.
  - prompt: In the worked example, a fixed window allows 100 requests per minute. A client sends 100 at 12:00:59 and 100 at 12:01:00. How many are allowed in those two seconds?
    options:
      - 100
      - 150
      - 200
      - 0
    correct: 2
    explanation: Each burst falls in a different window, so both are allowed. That is twice the intended rate.
  - prompt: With the sliding window counter, the previous minute had 100 requests, the current minute has 30, and we are 15 seconds into it. What is the estimated count?
    options:
      - 30
      - 55
      - 105
      - 130
    correct: 2
    explanation: 100 × (45/60) + 30 = 75 + 30 = 105, which is over a limit of 100, so the request is rejected.
  - prompt: You run 20 API servers, each with an in-memory limit of 100 requests/min per key. What can one client actually get?
    options:
      - 100/min
      - 5/min
      - Up to 2,000/min if the load balancer spreads its requests
      - Unlimited
    correct: 2
    explanation: Each server counts only what it sees. A shared store such as Redis, or limits divided by server count, fixes this.
  - prompt: A token bucket has capacity 20 and refills at 5 tokens/s. It is full, and a client sends 50 requests in one instant. How many succeed, and when can it next send?
    options:
      - 50 succeed
      - 20 succeed; one more token arrives after 0.2 s
      - 5 succeed; wait 1 s
      - None succeed
    correct: 1
    explanation: The burst spends all 20 tokens. Refill at 5/s means one token every 200 ms after that.
  - prompt: The Redis cluster holding rate-limit counters goes down. When is failing open the right choice?
    options:
      - Never
      - For a general API where availability matters more than precise limits, ideally with a loose local limit as a backstop
      - Always, including login endpoints
      - Only on weekends
    correct: 1
    explanation: Failing closed turns a limiter outage into a full outage. Sensitive endpoints such as login may fail closed or fall back to strict local limits.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TokenBucketFlow from '#lib/diagrams/TokenBucketFlow.svelte';
</script>

Rate limiting caps how many requests a client may make in a period. It keeps one noisy, buggy, or hostile client from hurting everyone else, and it turns overload into a clear "slow down" instead of a crash.

## What it is

Here is the problem. Your API handles 5,000 requests a second comfortably. One customer ships a client with a retry bug that loops on errors, and it starts sending 4,000 requests a second on its own. Every other customer's latency climbs, the database connection pool fills up, and soon the whole API is timing out for everyone, because of one key. The same thing happens when a scraper crawls your catalogue, or an attacker tries a million passwords against the login endpoint.

**<Term id="rate-limiting">Rate limiting</Term>** puts a ceiling on how many requests each client can make in a period, such as "100 requests per minute per API key". Requests under the limit pass straight through. Requests over it are rejected early and cheaply, before they reach the expensive parts of the system. That protects the service from overload, makes abuse such as brute-force logins and scraping slow and expensive, keeps costs predictable, and shares capacity fairly between customers. <Src id="wiki-rl" />

When an <Term id="http">HTTP</Term> API rejects a request for this reason, it answers **429 Too Many Requests**, ideally with a `Retry-After` header saying how many seconds to wait. <Src id="mdn-429" />

Rate limiting is related to, but different from, [back pressure](/modules/queues-and-back-pressure). Back pressure is a server saying "*I* am full, everyone slow down". A rate limit is a policy saying "*you* have used your share", applied whether or not the server is busy.

## How it works

Every limiter has three parts: a **key** (who is being counted), an **algorithm** (how requests are counted over time), and a **place** where the counting happens.

### Algorithms

**<Term id="token-bucket">Token bucket</Term>.** Each key has a bucket that holds at most *b* tokens and gains *r* tokens per second. A request takes one token; with no token left, it is rejected. A client that has been quiet has a full bucket and can burst *b* requests at once, but over any long period it averages at most *r* per second. You do not need a timer per key: store the token count and the last update time, and on each request add *r* × (seconds elapsed), capped at *b*, before taking a token. That is two numbers per key, and it is the most common default. <Src id="wiki-tb" />

<TokenBucketFlow />

**Leaky bucket.** Requests enter a fixed-size queue that drains at a constant rate, like water from a hole in a bucket. Output is perfectly smooth, which suits feeding a downstream system that cannot take bursts, but a burst of legitimate requests waits in the queue (adding latency) or overflows. <Src id="wiki-tb" />

**<Term id="fixed-window-counter">Fixed window counter</Term>.** Count requests per key in the current clock window, for example the key `rl:key42:12:01` for the minute starting 12:01, and reject once the count passes the limit. It is one counter per key and trivial to build with an atomic increment and an expiry. Its flaw is the window edge: a client can send the full limit at the end of one window and again at the start of the next, getting twice the limit within a couple of seconds.

**Sliding window log.** Keep a timestamp for every request in the last window and count them. It is exact, but it stores one entry per request, which is expensive for high limits.

**<Term id="sliding-window-counter">Sliding window counter</Term>.** Keep the fixed-window counts for the current and previous windows, and estimate the count over the last full window by weighting the previous one by how much of it still overlaps: estimate = previous × (fraction of the window remaining) + current. It costs two counters per key, removes most of the edge burst, and is what many large systems use.

### Where to enforce

Usually at the edge: an API gateway or [reverse proxy](/modules/reverse-proxies-api-gateways), so rejected requests never reach application servers. With many gateway or app instances, each one sees only part of the traffic, so the counters must be shared, typically in Redis, using atomic operations so two servers incrementing at once do not lose a count. The alternative is local counters on each instance with the limit divided by the instance count, which needs no network hop but is approximate and breaks when instances are added or traffic is uneven. <Src id="wiki-rl" />

Limits can also sit at several layers: a coarse per-IP limit at the CDN or load balancer to absorb floods, a per-API-key limit at the gateway, and a per-endpoint limit for expensive operations.

### What to key on

- **Per user or API key** for authenticated traffic. This is the fairest, because it follows the customer.
- **Per IP address** for anonymous traffic such as signup and login pages. Many users can share one IP behind a corporate or mobile carrier <Term id="nat">NAT</Term>, so IP limits must be generous.
- **Per endpoint**, with tighter limits on expensive or sensitive routes: 5 login attempts per minute per account, but 1,000 reads per minute.
- **Per tenant and globally**, so the sum of all customers cannot exceed what the backend can take.

### Telling clients about it

Return `429` with `Retry-After`, and on every response include headers such as `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` (or the common `X-RateLimit-*` variants) so well-behaved clients can slow down before they hit the wall. Clients should retry with exponential backoff and jitter. <Src id="mdn-429" />

## Worked example

An API allows **100 requests per minute per API key**. It runs on 20 servers behind a load balancer.

**Step 1, the fixed-window edge burst.** The client sends nothing until 12:00:59, then 100 requests. The 12:00 window count goes from 0 to 100, all allowed. At 12:01:00 a new window starts at 0, and the client sends 100 more, all allowed. That is **200 requests in about one second**, twice the intended rate, and a well-timed attacker can do it every minute.

**Step 2, the sliding window counter.** Same client, same limit. At 12:01:15 the previous window (12:00) has 100 requests and the current window (12:01) has 30. We are 15 s into the current minute, so 45 s, or 75%, of the previous window still overlaps the last 60 seconds. Estimate = 100 × 0.75 + 30 = **105**, which is over 100, so the request is rejected. The edge burst is gone, for the cost of one more counter.

**Step 3, the token bucket.** You switch to a token bucket with refill **r = 100/60 ≈ 1.67 tokens/s** and capacity **b = 20**. A quiet client has 20 tokens and can burst 20 requests at once (a page load that fires 20 calls works fine). After that it gets a token every 0.6 s. Over a long period it averages 100 per minute, but it can never land 200 in a second, because the most it can ever spend at once is 20. Bucket size is the burst you choose to allow; refill rate is the average.

**Step 4, the counters live in the wrong place.** Each of the 20 servers keeps its own in-memory bucket. The load balancer spreads the client's requests round-robin, so each server sees 1/20 of them and thinks the client is well under its limit. The client effectively gets **20 × 100 = 2,000 requests per minute**. Moving the counters to Redis makes the limit global. Each check is one Redis round trip, about 0.5 ms inside a data centre, so the limiter adds well under a millisecond to each request.

**Step 5, the race.** Two servers handle requests from the same key at once. Each reads "tokens = 1", each decides to allow, each writes "tokens = 0": two requests passed on one token. The fix is to make read-check-write a single atomic step, which in Redis means a Lua script (or a single `INCR` for a fixed window), since Redis runs each script to completion before the next command.

## In the real world

- **Stripe.** Its engineering blog describes four limiters stacked in production: a per-user request rate limiter (token bucket in Redis), a concurrent-requests limiter that caps how many requests a user has *in flight* at once, a fleet-wide load shedder that reserves capacity for critical requests such as payments, and a worker-utilisation shedder that drops lower-priority traffic first when workers are saturated. The public API returns 429 for limit errors.
- **NGINX.** `limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;` defines a leaky-bucket limit per client IP stored in a 10 MB shared memory zone, and `limit_req zone=api burst=20 nodelay;` applies it. `burst` is how many excess requests may queue, and `nodelay` serves them at once rather than spacing them out, which makes it behave like a token bucket. The default rejection status is 503, and `limit_req_status 429;` changes it.
- **Envoy.** Offers *local* rate limiting (a token bucket per proxy instance, no network call) and *global* rate limiting, where each request asks an external rate limit service, usually the open-source one backed by Redis, using descriptors such as the API key and route. A common setup uses both: local for cheap flood protection, global for accurate per-customer quotas.
- **Cloudflare.** Its rate limiting runs across hundreds of data centres and uses the sliding window counter described above, which its blog reports as very close to exact while storing only two numbers per key, accepting slightly approximate counts to avoid a global store on every request.

## Trade-offs

| Algorithm | State per key | Bursts | Accuracy |
|---|---|---|---|
| Token bucket | 2 numbers | Allowed up to *b* | Exact average |
| Leaky bucket | A queue | Smoothed (delayed) | Exact output rate |
| Fixed window | 1 counter | Up to 2× at edges | Poor at edges |
| Sliding window log | 1 entry per request | None | Exact |
| Sliding window counter | 2 counters | Small | Close |

- **Central store against local counters.** A shared Redis gives accurate global limits but adds a network hop and a dependency; local counters are free and fast but approximate.
- **Fail open or closed.** If the limiter's store is down, failing open (allow traffic) keeps the service up but unprotected; failing closed (reject traffic) protects the backend but turns a limiter outage into a full outage. Most general APIs fail open with a loose local limit as a backstop; login and payment endpoints may fail closed.
- **Strict against friendly.** Tight limits protect the system but break legitimate bursty clients; bucket size is the knob for being generous to bursts without raising the average.

## Interview tips

- State the limit, the key, and the window out loud: "100 requests per minute per API key, 5 per minute per account on login".
- Pick token bucket by default, explain refill rate against bucket size, and put the state in Redis with an atomic script.
- Return 429 with Retry-After and rate-limit headers, and say whether you fail open.
- If asked to design a rate limiter as a whole system, walk through the [API rate limiter case study](/modules/api-rate-limiter).

**Common mistakes:**

- Keeping counters in each server's memory, so the real limit is multiplied by the number of servers.
- Doing read-then-write against Redis in two commands, so concurrent requests race past the limit.
- Using a fixed window without mentioning the 2× edge burst.
- Limiting only by IP, which punishes everyone behind a shared NAT and does little against attackers with many IPs.
- Returning 500 or 503 for a limit, so clients cannot tell "you are over your quota" from "we are broken".

## Common follow-up questions

### How do you rate limit across several regions?

A single global Redis would add cross-region latency to every request. Usually each region keeps its own counters and gets a share of the limit (for example half each for two regions), or regions count locally and sync counts asynchronously every second or so, accepting that a client can briefly exceed the limit by the sync lag. Exact global limits across regions are rarely worth the latency.

### What about limiting concurrent requests rather than rate?

A rate limit caps requests per second, but ten requests that each take 30 seconds can still tie up a server. A concurrency limiter caps how many requests a key has in flight at once: increment a counter when a request starts, decrement it when it ends, and reject when it is over the cap. Stripe runs both.

### How do you protect the system if every client stays under its limit?

Per-client limits do not add up to a safe total. Add a global limit or <Term id="load-shedding">load shedding</Term> that, when the service is near capacity, rejects lower-priority traffic first (analytics, batch jobs) so critical requests keep working. A [circuit breaker](/modules/availability-patterns) on outgoing calls protects downstream dependencies the same way.

### Should the client also limit itself?

Yes. Well-behaved clients read the rate-limit headers, slow down before hitting the limit, and retry 429s with exponential backoff and jitter. Without jitter, every throttled client retries at the same moment the window resets, and the burst repeats.

## Go deeper

- [Stripe, Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters): the four limiter types Stripe runs and the Redis token-bucket code behind them.
- [Cloudflare, How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/): the sliding window counter and its measured accuracy.
- [NGINX ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html): the exact directives for rate, burst, nodelay, and status codes.
- [Envoy global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting): local against global limits and how the external rate limit service fits in.
