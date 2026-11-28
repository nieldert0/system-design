---
slug: queues-and-back-pressure
title: Queues and back pressure
section: communication
upgraded: true
readFirst:
  - api-design
sources:
  - id: primer
    title: The System Design Primer, Asynchronism
    url: https://github.com/donnemartin/system-design-primer#asynchronism
    license: CC BY 4.0
    use: reworded
  - id: aws-backlogs
    title: Amazon Builders' Library, Avoiding insurmountable queue backlogs
    url: https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/
    license: All rights reserved
    use: reworded
quiz:
  - prompt: Why put a slow operation on a message queue?
    options:
      - To make it run faster on the CPU
      - So the user is not blocked while a worker processes it in the background
      - To encrypt it
      - To avoid storing it
    correct: 1
    explanation: The app publishes the job, tells the user it is accepted, and a worker does the work later.
  - prompt: What is back pressure?
    options:
      - Increasing queue size without limit
      - A full or slow consumer pushing back on producers, for example by bounding the queue and rejecting new work with 503
      - Pushing messages faster
      - Compressing messages
    correct: 1
    explanation: Bounding the queue keeps latency for accepted work predictable and tells producers to slow down.
  - prompt: How should clients retry after a 503 from a full queue?
    options:
      - Immediately in a tight loop
      - Later, with exponential backoff and jitter
      - Never
      - By opening more connections
    correct: 1
    explanation: Backoff spreads retries out; jitter stops every client retrying at the same instant.
  - prompt: Amazon SQS standard queues may deliver a message twice. What must the worker be?
    options:
      - Fast
      - Idempotent, so processing a message twice has the same effect as once
      - Stateless only
      - Written in Python
    correct: 1
    explanation: At-least-once delivery means duplicates happen.
  - prompt: In the worked example, uploads arrive at 300/min for an hour and 10 workers each finish 20 jobs/min. How big is the backlog at the end of the hour?
    options:
      - 0
      - 1,200 jobs
      - 6,000 jobs
      - 18,000 jobs
    correct: 2
    explanation: Capacity is 200/min, so the queue grows by 100/min; 100 × 60 = 6,000 jobs waiting.
  - prompt: In the same example, after the spike traffic falls to 100/min. How long does the 6,000-job backlog take to drain with 10 workers?
    options:
      - 6 minutes
      - 30 minutes
      - 60 minutes
      - It never drains
    correct: 2
    explanation: Spare capacity is 200 − 100 = 100 jobs/min, so 6,000 / 100 = 60 minutes. Drain time depends on spare capacity, not total capacity.
  - prompt: A job takes 45 seconds, but the SQS visibility timeout is 30 seconds. What happens?
    options:
      - The job runs once, a bit late
      - The message reappears while the first worker is still busy, so a second worker processes it too
      - SQS deletes the message
      - The job is moved to the dead-letter queue immediately
    correct: 1
    explanation: Set the visibility timeout above the worst-case processing time, or extend it while working.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import BackPressureFlow from '#lib/diagrams/BackPressureFlow.svelte';
</script>

A queue lets a service accept work now and do it later, at the pace its workers can manage. Back pressure is what stops that queue from growing until it drags everything down with it.

## What it is

Here is the problem. A user uploads a video and your API transcodes it before responding. Transcoding takes 40 seconds, so the request holds a connection and a thread for 40 seconds, the browser times out at 30, and when a hundred users upload at once the API servers run out of threads and stop serving even cheap requests. The slow work and the fast work are tied together, so the slow work sets the pace for everything.

A **<Term id="message-queue">message queue</Term>** cuts that tie. The API writes a small message ("transcode video 881") to the queue, answers the user straight away with "processing", and a separate pool of **workers** pulls messages off the queue and does the work in the background. The producer and the consumer no longer need to run at the same speed, or even be up at the same time. <Src id="primer" />

People distinguish two kinds. A *message queue* (SQS, RabbitMQ) only stores and delivers messages; what they mean is up to your code. A *task queue* (Celery, Sidekiq) sits on top of one and adds the "run this function with these arguments" layer: it schedules jobs, retries them, and records their results. <Src id="primer" />

The queue buys you smoothing, not free capacity. If work arrives faster than workers finish it for long enough, the queue grows without bound, every job waits longer, and eventually memory or disk runs out. **<Term id="back-pressure">Back pressure</Term>** is the fix: the system signals upstream that it is full, by bounding the queue and rejecting new work, so producers slow down instead of piling on. <Src id="primer" />

## How it works

### The basic flow

1. The producer (often an API handler) validates the request, stores any large payload in [object storage](/modules/object-storage), and publishes a small message with an ID pointing at it.
2. It returns at once, typically `202 Accepted` with a job ID the client can poll.
3. A worker receives the message. The broker hides it from other workers while that worker is busy.
4. When the work succeeds, the worker **acknowledges** (deletes) the message. If the worker crashes or the work fails, the message becomes visible again and another worker retries it.

The client can make the wait feel shorter. When you post a tweet, it appears on your own timeline immediately even though delivering it to every follower happens later through a queue. <Src id="primer" />

### Delivery guarantees

Because a message is only deleted after the worker acknowledges it, a worker that finishes the work and then crashes before acknowledging causes the same message to be processed twice. This is <Term id="at-least-once-delivery">at-least-once delivery</Term>, and it is what almost every queue gives you. The alternative, at-most-once (delete before processing), never duplicates but loses messages on a crash. "Exactly once" in practice means at-least-once delivery plus an **idempotent** worker: one where processing a message twice has the same effect as once, for example by recording processed message IDs or by using an upsert instead of an insert. See [idempotency keys](/modules/api-design) for the same idea at the API layer.

### Retries and the dead-letter queue

A message that fails should be retried, but not forever. A message whose payload is malformed will fail on every attempt (a *poison message*) and keep a worker busy indefinitely. After a fixed number of attempts, the broker moves it to a <Term id="dead-letter-queue">dead-letter queue</Term> (DLQ), a separate queue that holds failed messages for a human or a repair job to inspect. Alarm on the DLQ's size: a growing DLQ means something is broken.

### Back pressure

A bounded queue protects the system in two ways. First, if the queue outgrows memory, the broker spills to disk and everything slows down further, so an unbounded queue gets slower exactly when it is under the most load. Second, every job in the queue has to wait behind all the jobs ahead of it: at 10,000 queued jobs and 100 jobs/s of capacity, a new job waits 100 seconds before anyone looks at it. If that job is "send a login code", it is useless by then. <Src id="primer" />

So you set a limit. When the queue is full, the producer rejects new work with HTTP 503 Service Unavailable (or 429 if it is one client's fault), ideally with a `Retry-After` header, and the client retries later with <Term id="exponential-backoff">exponential backoff</Term>: wait 1 s, then 2 s, then 4 s, each with random jitter so thousands of clients do not all retry in the same instant. <Src id="primer" />

<BackPressureFlow />

Back pressure also works *inside* a pipeline. A consumer that takes messages only as fast as it can process them (pull-based, or with a small prefetch limit) naturally slows its upstream, instead of buffering everything in its own memory until it crashes. When you cannot slow the producer, the remaining choice is <Term id="load-shedding">load shedding</Term>: deliberately dropping the least important work so the important work still gets done.

### Sizing a queue with Little's law

<Term id="littles-law">Little's law</Term> ties the numbers together: jobs in the system = arrival rate × time each job spends there. If 50 jobs/s arrive and each takes 2 s, you need at least 100 jobs in progress, so 100 worker slots. If you have only 80, the queue grows by 10 jobs a second until something changes. See [Latency vs throughput](/modules/latency-vs-throughput) for more on this.

## Worked example

A video site gets uploads that each need transcoding. Normal traffic is **100 uploads/min**. Each worker transcodes one video at a time and finishes **20 per minute** (3 s each), and you run **10 workers**, so capacity is **200 jobs/min**.

**Step 1, normal load.** 100 arrive, 200 could be served, so workers are 50% busy and the queue stays near empty. A job waits a few seconds at most.

**Step 2, the spike.** A celebrity shares a link and uploads jump to **300/min for one hour**. Workers still finish 200/min, so the queue grows by 100 jobs a minute. After an hour there are **6,000 jobs waiting**. A video uploaded at the end of the spike waits 6,000 / 200 = **30 minutes** before a worker even starts on it. The upload API never slowed down, which is the whole point of the queue: users got "processing" instantly and nothing timed out.

**Step 3, draining.** Traffic falls back to 100/min. Workers still do 200/min, so the *spare* capacity is only 100/min, and the backlog takes 6,000 / 100 = **60 minutes** to clear. People underestimate this: the drain rate is capacity minus arrivals, not capacity. <Src id="aws-backlogs" />

**Step 4, scale the workers.** If you autoscale on queue depth, say "add a worker for every 500 jobs waiting", the pool grows to about 20 workers during the spike (400/min capacity). Now the queue grows only while autoscaling catches up, and peaks at a few hundred jobs instead of 6,000. This is why queue depth, or better the age of the oldest message, is the standard autoscaling signal for workers.

**Step 5, add back pressure.** Suppose you cannot autoscale (a GPU quota, a fixed licence count). Videos older than 15 minutes in the queue break your promise to users, so the maximum useful queue is 15 min × 200/min = **3,000 jobs**. Cap the queue there. Upload number 3,001 gets `503` with `Retry-After: 120`; the client shows "busy, retrying in 2 minutes" and backs off. Accepted jobs keep a bounded 15-minute wait instead of an ever-growing one.

**Step 6, the poison message.** One upload is a corrupt file that crashes the transcoder every time. With no limit, it would be retried forever, tying up a worker. With a maximum of 5 receives, it lands in the DLQ after 5 attempts and an alarm fires.

## In the real world

- **Amazon SQS.** A received message is hidden for the **visibility timeout** (default 30 seconds, maximum 12 hours); if it is not deleted in that time, it reappears for another worker. Messages are kept for 4 days by default (`MessageRetentionPeriod`, up to 14 days). A **redrive policy** with `maxReceiveCount` moves a message to a DLQ after that many receives. Standard queues are at-least-once with best-effort ordering; FIFO queues give ordering per message group and deduplicate within a 5-minute window.
- **RabbitMQ.** Uses the AMQP protocol: producers publish to an *exchange*, which routes to queues. Consumers set a **prefetch** limit (`basic.qos`) so the broker sends only that many unacknowledged messages at once, which is back pressure on the consumer side. Queues can be bounded with `x-max-length` and an `x-overflow` setting of `reject-publish` (push back on producers) or `drop-head` (discard the oldest). Quorum queues replicate messages across nodes.
- **Celery and Sidekiq.** Task queues for Python and Ruby on top of a broker (RabbitMQ or Redis). They add retries with backoff (`autoretry_for` and `retry_backoff` in Celery), scheduled jobs, and result storage. Using Redis as the broker is simple, but it can lose messages on a crash unless persistence is configured. <Src id="primer" />
- **TCP.** The lowest-level back pressure you use every day: the receiver advertises a window of how many bytes it can buffer, and the sender cannot send more until it is acknowledged. See [TCP and UDP](/modules/tcp-and-udp).

## Trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Queue instead of a synchronous call | Fast responses, absorbs spikes, survives worker outages | Extra moving part; results arrive later; harder to trace |
| Bounded queue (back pressure) | Predictable wait for accepted work | Some requests are rejected and must retry |
| Unbounded queue | Never rejects | Wait times grow without limit, memory or disk runs out |
| At-least-once | No lost work | Duplicates, so workers must be idempotent |
| At-most-once | No duplicates | Lost work on crashes |

- Cheap calculations and real-time flows that need an answer now are better done synchronously; a queue only adds delay and complexity. <Src id="primer" />
- A queue hides overload rather than removing it. If producers outrun consumers for long, you must add workers, shed load, or push back.

## Interview tips

- Put anything slow, bursty, or failure-prone behind a queue: emails, video processing, notification fan-out, report generation.
- Say what happens when the queue is full: bounded size, 503 with Retry-After, clients retrying with exponential backoff and jitter.
- Say "at-least-once, so the worker is idempotent", and explain how (dedupe table, upsert, idempotency key).
- Mention the dead-letter queue and alarm on it.
- Autoscale workers on queue depth or the age of the oldest message, not on CPU.

**Common mistakes:**

- Leaving the queue unbounded and calling the system "resilient", when it is really building a backlog that takes hours to drain.
- Setting the visibility timeout below the worst-case job time, so slow jobs get processed twice in parallel.
- Retrying failed calls immediately and in lockstep, which turns a brief outage into a self-inflicted overload (a retry storm).
- Putting large payloads in the message itself instead of a pointer to object storage, which hits size limits (256 KB on SQS) and slows the broker.

## Common follow-up questions

### How do you keep messages in order?

Most queues do not promise order across workers, because several workers process in parallel. If order matters per entity (all events for one order), use a FIFO queue with a message group ID or a partitioned log keyed by that entity, so one worker at a time handles each key. See [Pub/sub and event streaming](/modules/pub-sub-and-event-streaming) for how Kafka partitions do this.

### How do you write to the database and publish a message atomically?

You cannot do both in one transaction across two systems, so a crash between them either loses the message or publishes for a write that rolled back. The <Term id="transactional-outbox">transactional outbox</Term> pattern fixes it: write the business row and an "outbox" row in the same database transaction, and have a separate relay read the outbox and publish. The relay may publish twice, which idempotent consumers handle.

### Push or pull consumers?

Pull (the worker asks for messages, as with SQS) gives natural back pressure, since a busy worker simply stops asking. Push (the broker sends to consumers, as with RabbitMQ) has lower latency but needs a prefetch limit, or a slow consumer is flooded.

### How do you know the queue is unhealthy?

Watch the age of the oldest message, not only the count. 10,000 messages that are 2 seconds old is a busy, healthy queue; 50 messages that are 2 hours old means consumers are stuck. Also watch DLQ size and the processing error rate.

## Go deeper

- [Amazon Builders' Library, Avoiding insurmountable queue backlogs](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/): why backlogs take so long to drain and how AWS isolates noisy tenants.
- [Amazon Builders' Library, Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/): how retries amplify outages and how jitter fixes it.
- [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html): how in-flight messages are hidden, extended, and returned.
- [RabbitMQ consumer prefetch](https://www.rabbitmq.com/docs/consumer-prefetch): bounding unacknowledged messages per consumer, which is back pressure in practice.
