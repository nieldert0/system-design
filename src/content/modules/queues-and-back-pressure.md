---
slug: queues-and-back-pressure
title: Queues and back pressure
section: communication
readFirst:
  - api-design
sources:
  - id: primer
    title: The System Design Primer, Asynchronism
    url: https://github.com/donnemartin/system-design-primer#asynchronism
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: Why put a slow operation on a message queue?
    options:
      - To make it run faster on the CPU
      - So the user is not blocked while a worker processes it in the background
      - To encrypt it
      - To avoid storing it
    correct: 1
    explanation: The app publishes the job, tells the user its status, and a worker does the work.
  - prompt: What is the difference between a message queue and a task queue?
    options:
      - None
      - A task queue receives tasks with their data, runs them and delivers results, often with scheduling
      - Message queues run code
      - Task queues cannot be scheduled
    correct: 1
    explanation: Celery is an example of a task queue.
  - prompt: What is back pressure?
    options:
      - Increasing queue size without limit
      - Limiting the queue size so jobs already queued keep good throughput and response times
      - Pushing messages faster
      - Compressing messages
    correct: 1
    explanation: Once full, new requests get a server busy / HTTP 503 to retry later.
  - prompt: How should clients retry after a 503 from a full queue?
    options:
      - Immediately in a tight loop
      - Later, with exponential backoff (and some jitter)
      - Never
      - By opening more connections
    correct: 1
    explanation: Backoff spreads retries out instead of hammering the server.
  - prompt: Amazon SQS may deliver a message twice. What must the worker be?
    options:
      - Fast
      - Idempotent, so processing a message twice has the same effect as once
      - Stateless only
      - Written in Python
    correct: 1
    explanation: At-least-once delivery means duplicates happen.
  - prompt: When is a queue a poor fit?
    options:
      - Sending email
      - Inexpensive calculations and real-time workflows that need an immediate answer
      - Video transcoding
      - Generating reports
    correct: 1
    explanation: Queues add delay and complexity.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

A queue lets you accept work now and do it later. Back pressure stops that queue from growing until it drags everything down.

## What it is

Asynchronous workflows help reduce request times for expensive operations that would otherwise be performed in-line. They can also help by doing time-consuming work in advance, such as periodic aggregation of data. <Src id="primer" />

**<Term id="message-queue">Message queues</Term>** receive, hold, and deliver messages. **Task queues** receive tasks and their related data, runs them, then delivers their results. They can support scheduling and can be used to run computationally-intensive jobs in the background. <Src id="primer" />

## How it works

If an operation is too slow to perform inline, you can use a message queue with the following workflow: <Src id="primer" />

- An application publishes a job to the queue, then notifies the user of job status
- A worker picks up the job from the queue, processes it, then signals the job is complete

The user is not blocked and the job is processed in the background. During this time, the client might optionally do a small amount of processing to make it seem like the task has completed. For example, if posting a tweet, the tweet could be instantly posted to your timeline, but it could take some time before your tweet is actually delivered to all of your followers. <Src id="primer" />

Brokers differ: <Src id="primer" />

- **Redis** is useful as a simple message broker but messages can be lost.
- **RabbitMQ** is popular but requires you to adapt to the 'AMQP' protocol and manage your own nodes.
- **Amazon SQS** is hosted but can have high latency and has the possibility of messages being delivered twice.

**<Term id="back-pressure">Back pressure</Term>.** If queues start to grow significantly, the queue size can become larger than memory, resulting in cache misses, disk reads, and even slower performance. Back pressure can help by limiting the queue size, thereby maintaining a high throughput rate and good response times for jobs already in the queue. Once the queue fills up, clients get a server busy or HTTP 503 status code to try again later. Clients can retry the request at a later time, perhaps with exponential backoff. <Src id="primer" />

Messages that keep failing go to a **dead-letter queue** after a few attempts, so one bad message cannot block the rest.

## Trade-offs

- Use cases such as inexpensive calculations and realtime workflows might be better suited for synchronous operations, as introducing queues can add delays and complexity. <Src id="primer" />
- Most queues deliver **at least once**, so workers must be idempotent.
- Queues smooth spikes, but if producers are faster than consumers for long, you must add workers or shed load.

## Interview tips

- Put anything slow or failure-prone behind a queue: emails, video processing, fan-out.
- Say what happens when the queue is full: back pressure, 503s, retries with backoff.
- Mention idempotent workers and a dead-letter queue.
