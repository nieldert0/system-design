---
slug: pub-sub-and-event-streaming
title: Pub/sub and event streaming
section: communication
readFirst:
  - queues-and-back-pressure
sources:
  - id: wiki-pubsub
    title: Wikipedia, Publish–subscribe pattern
    url: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-kafka
    title: Wikipedia, Apache Kafka
    url: https://en.wikipedia.org/wiki/Apache_Kafka
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In pub/sub, how does a publisher know who receives a message?
    options:
      - It lists every subscriber
      - It does not; it publishes to a topic and every subscriber of that topic gets a copy
      - Subscribers poll the publisher
      - Through DNS
    correct: 1
    explanation: Publishers and subscribers are decoupled by topics.
  - prompt: How does a work queue differ from pub/sub?
    options:
      - They are the same
      - In a queue each message goes to one worker; in pub/sub each subscriber gets every message
      - Queues are always faster
      - Pub/sub stores nothing
    correct: 1
    explanation: Queues share work; pub/sub broadcasts events.
  - prompt: What is special about a log-based event stream like Kafka?
    options:
      - Messages are deleted once read
      - Messages are kept in an append-only log so consumers can replay from any offset
      - It only supports one consumer
      - It runs over UDP
    correct: 1
    explanation: Retention and offsets allow replay and many independent consumer groups.
  - prompt: How does Kafka keep events for one user in order?
    options:
      - It orders all events globally
      - Events with the same key go to the same partition, which is ordered
      - It sorts by timestamp later
      - It cannot
    correct: 1
    explanation: Order is guaranteed only within a partition.
  - prompt: What limits parallelism for one Kafka consumer group?
    options:
      - The number of brokers' disks
      - The number of partitions in the topic
      - The DNS TTL
      - Message size
    correct: 1
    explanation: Each partition is read by at most one consumer in a group.
  - prompt: An order service publishes OrderPlaced; email, analytics and shipping each react. What is the benefit?
    options:
      - Fewer servers
      - The order service need not know about or wait for the others, and new consumers can be added freely
      - Strong consistency
      - Lower storage
    correct: 1
    explanation: Loose coupling is the main win of pub/sub.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

With pub/sub, a service announces that something happened and any number of other services react, without the sender knowing who they are. Event streams add a durable, replayable log.

## What it is

In **<Term id="pub-sub">publish–subscribe</Term>**, senders (publishers) send messages to a topic rather than to specific receivers, and receivers (subscribers) express interest in topics. Each subscriber gets its own copy of every message on the topics it follows. Neither side needs to know the other exists. <Src id="wiki-pubsub" />

An **event stream** such as Apache Kafka stores messages in an append-only, partitioned log that is kept for a set time. Consumers read at their own pace and track their position (offset), so they can replay history. <Src id="wiki-kafka" />

## How it works

**Topics and subscribers.** The broker fans each published message out to every subscription. Within one subscription, several workers can share the load, which combines pub/sub with a work queue. <Src id="wiki-pubsub" />

**Partitions.** A Kafka topic is split into partitions spread over brokers. Messages with the same key always land in the same partition, and each partition is strictly ordered. A consumer group divides the partitions among its members, so a group's parallelism is capped by the partition count. <Src id="wiki-kafka" />

**Replay.** Because the log is retained, a new service can read from the beginning to build its own view, and a buggy consumer can be fixed and rewound. <Src id="wiki-kafka" />

| | Work queue | Pub/sub | Event stream |
|---|---|---|---|
| Who gets a message | One worker | Every subscriber | Every consumer group |
| After delivery | Deleted | Deleted per subscriber | Kept until retention ends |
| Ordering | Usually none | Usually none | Per partition |
| Examples | SQS, RabbitMQ | SNS, Google Pub/Sub | Kafka, Kinesis |

## Trade-offs

- **Loose coupling** makes it easy to add consumers, but harder to see the whole flow and debug it.
- **Eventual consistency**: consumers update after the event, not with it.
- **Ordering is local**: only within a partition, so choose keys carefully.
- **Delivery is usually at least once**; consumers must be idempotent.

## Interview tips

- Use pub/sub when one event has several independent reactions (notifications, analytics, search indexing).
- Use Kafka when you need high throughput, ordering per key or replay.
- Name the partition key and explain why ("user id, so each user's events stay in order").
