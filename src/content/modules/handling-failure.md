---
slug: handling-failure
title: Timeouts, retries and idempotency
section: availability
readFirst:
  - availability-patterns
  - queues-and-back-pressure
sources:
  - id: aws-retries
    title: AWS Builders' Library, Timeouts, retries, and backoff with jitter
    url: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/
    license: All rights reserved
    use: reworded
  - id: aws-jitter
    title: AWS Architecture Blog, Exponential backoff and jitter
    url: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
    license: All rights reserved
    use: reworded
  - id: sre-cascading
    title: Google SRE book, Addressing cascading failures
    url: https://sre.google/sre-book/addressing-cascading-failures/
    license: CC BY-NC-ND 4.0
    use: reworded
  - id: stripe-idem
    title: Stripe, Designing robust and predictable APIs with idempotency
    url: https://stripe.com/blog/idempotency
    license: All rights reserved
    use: reworded
  - id: fowler-cb
    title: Martin Fowler, CircuitBreaker
    url: https://martinfowler.com/bliki/CircuitBreaker.html
    license: All rights reserved
    use: reworded
quiz:
  - prompt: A client calls an API and gets no response before its timeout. What does it know about the request?
    options:
      - It definitely failed
      - It definitely succeeded
      - Nothing for certain; it may have failed, succeeded, or still be running
      - The server is down
    correct: 2
    explanation: A timeout only says the answer did not arrive in time. The request may never have arrived, may have run and had its reply lost, or may still be running. That is why retries need idempotency.
  - prompt: Why add jitter to exponential backoff?
    options:
      - To make retries faster on average
      - So that clients that failed together do not all retry at the same instant and overload the server again
      - To encrypt the retry
      - Because timers are inaccurate
    correct: 1
    explanation: Without jitter, a thousand clients that failed at t=0 all retry at 100 ms, 200 ms, 400 ms, in synchronised waves. Randomising the delay spreads them out.
  - prompt: In the worked example, a request passes through 3 layers and each layer retries up to 3 times (4 attempts). How many calls can the bottom database receive for one user request when it is failing?
    options:
      - "4"
      - "12"
      - "64"
      - "3"
    correct: 2
    explanation: Attempts multiply across layers, 4 × 4 × 4 = 64. That amplification is why you retry at one layer only, or use a retry budget.
  - prompt: How should a server handle a retried POST that carries an Idempotency-Key it has already completed?
    options:
      - Run it again
      - Return the stored response from the first attempt without running it again
      - Reject it with 500
      - Ignore the key and create a new resource
    correct: 1
    explanation: The server records the key with the result. A repeat with the same key gets the same answer, so the side effect happens once.
  - prompt: What does a circuit breaker do in its open state?
    options:
      - Retries every call immediately
      - Fails calls fast without contacting the dependency, until a cool-down passes
      - Queues calls forever
      - Sends calls to a random server
    correct: 1
    explanation: Open means "stop calling". After the cool-down it goes half-open and lets a few trial calls through to see whether the dependency recovered.
  - prompt: Which of these errors should normally NOT be retried?
    options:
      - 503 Service Unavailable
      - A connection reset
      - 400 Bad Request
      - 429 Too Many Requests, after the Retry-After delay
    correct: 2
    explanation: A 400 means the request itself is wrong, so sending it again gives the same answer. Retry transient errors only.
  - prompt: A service's p99 latency to its database is 80 ms. A team sets the client timeout to 10 seconds. What is the main risk?
    options:
      - Too many retries
      - When the database stalls, each caller holds a thread and a connection for 10 s, so the caller runs out of threads and fails too
      - Requests finish too fast
      - None, longer is always safer
    correct: 1
    explanation: A timeout far above the normal latency means a slow dependency ties up resources for a long time. Set it a little above the p99 or p99.9 instead.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RetryIdempotencyFlow from '#lib/diagrams/RetryIdempotencyFlow.svelte';
</script>

In a distributed system, every call to another machine can fail, hang, or succeed without telling you. Timeouts, retries, idempotency and circuit breakers are the four tools that let a service survive that without making things worse.

## What it is

Here is the problem. Your checkout service calls a payment service, which is having a bad minute: some requests take 30 seconds, some never return. With no timeout, every checkout thread waits on a payment call that may never finish, the thread pool fills up, and checkout stops answering too, even for users who are only browsing. Add naive retries and it gets worse: every stuck request is sent again, so the struggling payment service gets two or three times its normal load and cannot recover. And when a payment did go through but its response was lost, the retry charges the customer twice.

Each tool fixes one part of that:

- A **timeout** puts an upper bound on how long you wait, so one slow dependency cannot consume all your threads.
- A **retry** sends the request again, because many failures are brief: a dropped packet, a server restarting, a leader election.
- **Idempotency** makes a retry safe: an operation is idempotent if doing it twice has the same effect as doing it once. An <Term id="idempotency-key">idempotency key</Term> is the usual way to make a non-idempotent operation, such as "charge $40", behave that way.
- A **<Term id="circuit-breaker">circuit breaker</Term>** stops calling a dependency that is clearly broken, so you fail fast instead of piling on.

The one fact underneath all of this: when a call times out, **you do not know what happened**. The request might not have arrived, it might have run and had its reply lost, or it might still be running. Every design choice here follows from that uncertainty. <Src id="aws-retries" />

## How it works

### Timeouts

A timeout is a deadline on one call. There are usually two: a **connect timeout** (how long to wait for the TCP connection, often 1 second or less, since connecting inside a data centre takes about a millisecond) and a **request timeout** (how long to wait for the response).

Pick the request timeout from measured latency, not a round number. AWS's approach is to choose an acceptable false-timeout rate, say 0.1%, and set the timeout at that <Term id="percentile">percentile</Term> of the dependency's latency, the p99.9. If the p99.9 is 120 ms, a 200 ms timeout gives a little headroom. A timeout of 30 seconds on a call that normally takes 50 ms protects nothing. <Src id="aws-retries" />

Timeouts should also shrink as a request goes deeper. If the user's request has a 1-second budget and the first hop spent 600 ms, the next call has 400 ms left, and waiting longer is pointless because the user has already been sent an error. Passing that remaining time along with each call is called <Term id="deadline-propagation">deadline propagation</Term>; gRPC does it natively.

### Retries with backoff and jitter

Retry only failures that might go away: connection errors, timeouts, 503 Service Unavailable, 429 Too Many Requests (after its `Retry-After` delay). Do not retry errors that will repeat, such as 400 Bad Request, 401 Unauthorized, or 404 Not Found.

Wait between attempts, and wait longer each time. This is <Term id="exponential-backoff">exponential backoff</Term>: base × 2^attempt, capped. With a 100 ms base the delays are 100, 200, 400, 800 ms. Backoff alone has a flaw. If 1,000 clients all failed at the same instant (because the server restarted), they all retry at exactly 100 ms, then all at 200 ms, in synchronised waves that knock the server over again. The fix is <Term id="jitter">jitter</Term>: pick the delay at random. "Full jitter" picks uniformly between 0 and the backoff value, so the 1,000 retries spread evenly across the window. In AWS's simulations, full jitter cut the total work done by the clients roughly in half compared with backoff alone. <Src id="aws-jitter" />

Cap the attempts too, usually 2 or 3 retries. A retry that will never succeed only adds load.

### Retry amplification and retry budgets

Retries multiply across layers. If the web tier retries 3 times, and the service it calls retries 3 times, and that service's database client retries 3 times, one user request can become 4 × 4 × 4 = 64 database calls during an outage. That flood is a <Term id="retry-storm">retry storm</Term>, and it is a classic way that a small slowdown turns into a full outage. Google's SRE book recommends retrying at one layer only and using a **retry budget**: allow retries to add at most about 10% to normal traffic, and stop retrying once that is spent. <Src id="sre-cascading" />

### Idempotency keys

Some operations are idempotent by nature: `GET`, `PUT /users/42 {name: "Ana"}`, `DELETE /items/7`. Sending them twice leaves the system in the same state. Others are not: `POST /charges` creates a new charge each time.

To make a POST safe to retry, the client generates a unique key (usually a <Term id="uuid">UUID</Term>) once per logical operation and sends it in a header, such as Stripe's `Idempotency-Key`. The server keeps a table of keys:

1. On a new key, insert a row with status "in progress" (with a unique constraint on the key), run the operation, and store the response with the key.
2. On a key that is already complete, return the stored response without doing anything.
3. On a key that is still in progress (the first attempt has not finished), return 409 Conflict so the client tries again later.

The key and the side effect must be committed together, ideally in one database transaction, or a crash between them breaks the guarantee. Keys are kept for a limited time; Stripe keeps them for 24 hours. <Src id="stripe-idem" />

<RetryIdempotencyFlow />

Message consumers need the same idea. Most queues give <Term id="at-least-once-delivery">at-least-once delivery</Term>, so a consumer will see some messages twice and must deduplicate by message ID. See [queues and back pressure](/modules/queues-and-back-pressure).

### Circuit breakers

A circuit breaker wraps calls to one dependency and tracks failures. It has three states: <Src id="fowler-cb" />

- **Closed**: calls go through normally. If failures cross a threshold (say 50% of the last 20 calls), it trips.
- **Open**: calls fail immediately, without touching the network, for a cool-down period such as 30 seconds. Callers can return a fallback: a cached value, a default, or a clear error.
- **Half-open**: after the cool-down, a few trial calls go through. If they succeed, the breaker closes; if not, it opens again.

The breaker protects both sides: the caller stops wasting threads and time on calls that will fail, and the dependency gets breathing room to recover.

### Fallbacks and load shedding

When a call fails for good, decide what the user sees. A product page can render without its recommendations; checkout cannot render without the price. Degrading gracefully is a product decision as much as an engineering one. On the receiving side, a server that is overloaded should reject excess work quickly (<Term id="load-shedding">load shedding</Term>) rather than accept it and time out on everything.

## Worked example

A checkout service at **500 requests/s** calls a payment API. Normally the payment API answers in **p50 40 ms, p99 120 ms, p99.9 180 ms**. Checkout runs a pool of **200 worker threads**.

**Step 1, no timeout.** The payment API stalls and starts taking 30 s per call. By <Term id="littles-law">Little's law</Term>, threads busy = arrival rate × time held = 500 × 30 = 15,000 threads needed. Checkout has 200, so the pool fills in under half a second (200 / 500 = 0.4 s) and every checkout request, including ones that never touch payments, waits in line. The payment outage has become a checkout outage.

**Step 2, add a 250 ms timeout.** Now each stuck call frees its thread after 250 ms: 500 × 0.25 = 125 threads busy. That fits in the pool of 200. Checkout stays up and returns "payment unavailable, try again" quickly. In normal times, only calls slower than 250 ms, well under 0.1%, time out by mistake.

**Step 3, add naive retries everywhere.** The mobile app retries 3 times, checkout retries 3 times, and the payment API's own database client retries 3 times. During the stall, one user tap can cause 4 × 4 × 4 = **64** database calls, and 500 requests/s becomes up to **32,000 calls/s** on a database that normally sees 500. It will not recover while that continues.

**Step 4, retry at one layer, with backoff, jitter and a budget.** Only checkout retries, at most 2 times, with full jitter on a 100 ms base (first retry waits 0 to 100 ms, second 0 to 200 ms), and a retry budget of 10%. The payment API now sees at most 500 × 1.1 = **550 calls/s**. A short blip, such as a 2-second leader election in the payment database, is absorbed: most retries land after it ends.

**Step 5, the lost response.** A user's charge for $40 succeeds, but the response is lost and checkout times out. Checkout retries with the same `Idempotency-Key` it generated for this order. The payment API finds the key already stored with status "succeeded" and returns the original charge ID. The customer is charged once. Without the key, the retry would have created a second $40 charge, and at a 0.1% timeout rate on 500 requests/s that is about 43,000 double charges a day.

**Step 6, a full outage.** The payment provider goes down for 10 minutes. Checkout's circuit breaker sees 50% of the last 20 calls fail and opens. For the next 30 s, checkout returns "payments are temporarily unavailable" in under 1 ms instead of spending 250 ms × 3 attempts per user, and the provider receives no traffic from checkout at all. Every 30 s the breaker lets a few trial calls through; when the provider comes back, they succeed and the breaker closes.

## In the real world

- **AWS SDKs.** Every AWS SDK retries throttling and transient errors with exponential backoff and jitter by default. The "standard" retry mode allows 3 attempts in total and uses a client-side token bucket as a retry budget, so a client that sees many failures stops retrying.
- **Stripe.** All `POST` requests accept an `Idempotency-Key` header. Stripe stores the key with the first response, status code included, and returns that same response for 24 hours; reusing a key with different parameters returns an error.
- **Envoy and Istio.** The service mesh sidecar can set per-route timeouts and retries (`retry_on: 5xx,reset`, `num_retries`, `per_try_timeout`) and a retry budget (`budget_percent`, default 20% in Envoy). Outlier detection ejects a host after consecutive 5xx errors, which works like a per-host circuit breaker. See [service discovery](/modules/service-discovery).
- **Resilience4j.** The common Java library (successor to Netflix Hystrix) provides a CircuitBreaker with `failureRateThreshold` (default 50%), a sliding window of calls (default 100), and `waitDurationInOpenState` (default 60 s), plus Retry, TimeLimiter and Bulkhead modules.

## Trade-offs

| Choice | You gain | You pay |
|---|---|---|
| Short timeout | Threads freed fast; failures surface quickly | More false timeouts on slow but healthy calls |
| Long timeout | Fewer false timeouts | A stalled dependency ties up resources for longer |
| More retries | More transient errors hidden from users | More load during real outages; higher worst-case latency |
| Circuit breaker | Fast failure, dependency gets room to recover | A threshold to tune; trips on a brief blip can reject good traffic |
| Idempotency keys | Safe retries for any operation | A key store, its storage and expiry, and care around in-progress keys |

- **Retry versus latency.** Each retry adds its wait to the user's latency. Three retries on a 250 ms timeout can push a request close to a second. Retries hide small failures but make slow failures slower.
- **Hedging versus load.** Instead of waiting for a timeout, some systems send a second copy of a slow request after the p95 latency and take whichever answers first. These <Term id="hedged-requests">hedged requests</Term> cut <Term id="tail-latency">tail latency</Term> but add a few percent of load, and they need idempotent operations.

## Interview tips

- Whenever your design calls another service, say what the timeout is and where it comes from (the dependency's p99 or p99.9).
- Say which errors you retry, how many times, with exponential backoff and jitter, and at which single layer.
- For any operation that changes money or state, say how it is made idempotent: a client-generated key and a unique constraint on the server.
- Mention a circuit breaker and a fallback for non-critical dependencies, and load shedding for the server side.

**Common mistakes:**

- Retrying at every layer, so failures are amplified 64 times instead of absorbed.
- Retrying without jitter, which turns a restart into synchronised waves of load.
- Using no timeout, or a default of 30 to 60 seconds, so one slow dependency exhausts every thread.
- Retrying non-idempotent writes without a key, which causes double charges, duplicate emails and duplicate orders.
- Storing the idempotency key in a different transaction from the side effect, so a crash between them leaves the system unsure whether the work ran.

## Common follow-up questions

### Is exactly-once delivery possible?

Not over an unreliable network: a sender cannot tell a lost message from a lost acknowledgement, so it must either risk sending twice or risk losing it. What systems offer is exactly-once *effect*: at-least-once delivery plus an idempotent receiver that deduplicates by key. Kafka's "exactly-once" is this idea applied inside Kafka, with transactional writes and idempotent producers.

### How long should you keep idempotency keys?

Long enough to cover every retry a client could reasonably make, plus margin. Stripe uses 24 hours. Keep them in the same database as the data they protect so they commit together, and expire old rows with a TTL or a nightly delete. A key reused after expiry is treated as a new request, so clients should not retry a day later.

### What is the difference between a timeout and a circuit breaker?

A timeout bounds one call. A circuit breaker looks across many calls and decides to stop making them. With only timeouts, every request during an outage still waits the full timeout; with a breaker, after the first few failures the rest fail in microseconds.

### Where do you put retries: the client, a sidecar, or the server?

At one layer, as close to the failure as is practical, and usually the one with the most context, such as the service that knows the operation is idempotent. If a service mesh retries, application code should not also retry the same call. Browsers and mobile apps should retry rarely and with long backoff, because there are millions of them.

### What is a bulkhead?

Separate pools of threads or connections per dependency, named after the walls in a ship's hull. If the recommendations service hangs, it can only exhaust its own pool of 20 threads, not the 200 that checkout needs for payments.

## Go deeper

- [AWS Builders' Library: Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/): how Amazon picks timeouts from latency percentiles and why it retries at a single layer.
- [AWS Architecture Blog: Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/): the simulation comparing no jitter, full jitter, equal jitter and decorrelated jitter, with graphs.
- [Stripe: Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency): idempotency keys from the API designer's side, including what to do with in-progress requests.
- [Google SRE book: Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/): retry budgets, deadlines, load shedding, and how one overloaded server takes a fleet down.
