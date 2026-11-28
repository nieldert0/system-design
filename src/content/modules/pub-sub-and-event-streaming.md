---
slug: pub-sub-and-event-streaming
title: Pub/sub and event streaming
section: communication
upgraded: true
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
      - It does not; it publishes to a topic and every subscription on that topic gets a copy
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
  - prompt: In the worked example, the topic has 12 partitions and the fraud service runs 20 consumers in one group. How many are actually reading?
    options:
      - 20
      - 12, and 8 sit idle
      - 1
      - 6
    correct: 1
    explanation: Each partition is read by at most one consumer in a group, so a group's parallelism is capped by the partition count.
  - prompt: The analytics consumer was down for 3 hours while 5,000 events/s were produced, and retention is 7 days. What happens when it comes back?
    options:
      - The 54 million missed events are lost
      - It resumes from its committed offset and works through the 54 million events, then catches up
      - Kafka resends only the last minute
      - Other consumer groups must pause
    correct: 1
    explanation: 5,000 × 10,800 s = 54 million events, all still on disk. Each group has its own offsets, so no other group is affected.
  - prompt: You choose order_id as the partition key, but one merchant produces 40% of all orders. Is that a hot-partition risk?
    options:
      - Yes, because all of that merchant's events land on one partition
      - No, because the key is order_id and each order hashes independently, so the merchant's orders spread across partitions
      - Yes, because Kafka sorts by merchant
      - No, because Kafka ignores keys
    correct: 1
    explanation: Skew follows the key you hash. Keying by merchant_id would create the hot partition; order_id spreads it.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import PubSubReplayFlow from '#lib/diagrams/PubSubReplayFlow.svelte';
</script>

With pub/sub, a service announces that something happened and any number of other services react, without the sender knowing who they are. An event stream keeps those announcements in a durable log that consumers can read at their own pace and replay.

## What it is

Here is the problem. When a customer places an order, five things must happen: charge the card, send a confirmation email, reserve stock, update the analytics dashboard, and index the order for search. If the order service calls each of those services directly, it has to know all five, wait for all five, and fail or retry when any one of them is slow. When a sixth team wants to react to orders, they need a change and a deploy of the order service. The sender is coupled to every receiver.

**<Term id="pub-sub">Publish–subscribe</Term>** (pub/sub) removes that coupling. The order service publishes one message, "OrderPlaced, order 7731", to a **topic** named `orders`. Each interested service has a **subscription** to that topic, and the broker delivers a copy of every message to every subscription. The publisher does not know who is listening, and adding a new subscriber needs no change to the publisher. <Src id="wiki-pubsub" />

This differs from a [work queue](/modules/queues-and-back-pressure) in who gets the message. In a work queue each message goes to *one* of the workers, because the goal is to share out work. In pub/sub each message goes to *every* subscription, because the goal is to tell everyone. Within one subscription you can still have several workers share the load, which combines the two.

An **event stream** (Apache Kafka, Amazon Kinesis) is a particular way to build pub/sub. Instead of deleting each message once it is delivered, the broker appends messages to a log on disk and keeps them for a set time, often days. Each consumer remembers its own position in the log, its <Term id="consumer-offset">offset</Term>, and can read forward at its own speed or rewind to replay history. <Src id="wiki-kafka" />

## How it works

### Topics and subscriptions

In a classic pub/sub broker (Amazon SNS, Google Cloud Pub/Sub), a published message is copied into each subscription's own backlog. A subscriber acknowledges each message, and once every subscription has acknowledged it, the broker can discard it. A slow subscriber only grows its own backlog; the others are not held up. <Src id="wiki-pubsub" />

### The log

Kafka's model is simpler and more powerful. A topic is an append-only sequence of records. Producers add to the end; nothing is changed in place. Each record gets the next offset number (0, 1, 2, ...). Consumers read sequentially and periodically *commit* their offset ("I have processed everything up to 41,207"). Because records stay on disk until retention removes them, the broker does not care how many consumers there are or how far behind they are: reading is just sequential disk reads, which are fast and largely served from the operating system's page cache. <Src id="wiki-kafka" />

<PubSubReplayFlow />

### Partitions and keys

One log on one machine would limit throughput, so a topic is split into **partitions**, each its own ordered log, spread across brokers. A producer chooses the partition by hashing the record's key: every record with key `user-42` goes to the same partition, so all of that user's events stay in order. There is **no ordering across partitions**, only within one. Records with no key are spread around for balance. <Src id="wiki-kafka" />

Choosing the <Term id="partition-key">partition key</Term> is the main design decision. It must group the events that need to be ordered together (all events for one account), and it must spread load evenly. A key with a few very large values, such as one huge customer, makes one partition hot while the rest sit idle.

### Consumer groups

A <Term id="consumer-group">consumer group</Term> is a set of consumers that share the work of reading a topic, which is how a log gives you work-queue behaviour. Kafka assigns each partition to exactly one consumer in the group, so the group reads all partitions in parallel and each partition in order. Different groups are completely independent: the email group and the analytics group each have their own offsets and each see every record. That makes the group the pub/sub "subscription" of the log world. <Src id="wiki-kafka" />

Two consequences follow. A group can never usefully have more active consumers than the topic has partitions, so the partition count caps your parallelism. And when consumers join or leave, Kafka **rebalances**, reassigning partitions, which briefly pauses consumption.

### Replay

Because the log is retained, a new service can start at offset 0 and build its own view of history, such as a search index of every order. A consumer with a bug can be fixed and reset to an earlier offset to reprocess. This is the property queues lack, and the reason a log often becomes the backbone that many systems read from. <Src id="wiki-kafka" />

| | Work queue | Pub/sub broker | Event stream (log) |
|---|---|---|---|
| Who gets a message | One worker | Every subscription | Every consumer group |
| After delivery | Deleted | Deleted per subscription | Kept until retention ends |
| Ordering | Usually none | Usually none, or per ordering key | Per partition |
| Replay | No | Limited (seek or snapshots) | Yes, any retained offset |
| Examples | SQS, RabbitMQ | SNS, Google Pub/Sub | Kafka, Kinesis, Redpanda |

## Worked example

A shop produces **5,000 order events per second** at peak, about 1 KB each. Three consumers care: fraud scoring, email, and analytics. You store them in a Kafka topic `orders` with **12 partitions**, replication factor 3, retention **7 days**, keyed by `order_id`.

**Step 1, storage.** 5,000 events/s × 1 KB = 5 MB/s. Over a day that is 5 MB × 86,400 ≈ **432 GB/day**, and 7 days of retention is about 3 TB. With 3 copies, the cluster stores about **9 TB**. That is the price of replay, and it sets how many brokers and disks you need.

**Step 2, consumer parallelism.** Fraud scoring takes 4 ms per event, so one consumer handles about 250 events/s. To keep up with 5,000/s it needs 20 consumers. But the topic has 12 partitions, so in one group **only 12 consumers can read and 8 sit idle**, and the most the group can do is 12 × 250 = 3,000 events/s, falling further behind every second. The fix is more partitions. Teams pick partition counts with headroom for this reason; going to 24 partitions gives room for 24 consumers (6,000/s). Note that adding partitions later changes which partition a key hashes to, which breaks per-key ordering during the change, so it is better to size generously up front.

**Step 3, an outage.** The analytics consumer is down for **3 hours**. Meanwhile 5,000 × 10,800 s = **54 million events** pile up. Nothing is lost, since retention is 7 days. The gap between the newest offset and the group's committed offset is its <Term id="consumer-lag">consumer lag</Term>, here 54 million. When analytics returns, it resumes from its committed offset. If it can process 15,000 events/s, it gains 15,000 − 5,000 = 10,000/s on the head of the log, so catching up takes 54,000,000 / 10,000 = **90 minutes**. Fraud and email never noticed, because each group has its own offsets.

**Step 4, a hot key.** Someone suggests keying by `merchant_id` so each merchant's events are in order. But one merchant makes 40% of orders, so one partition would get 2,000 events/s while the other 11 share 3,000, and the single consumer on that partition cannot keep up. Keying by `order_id` keeps each order's events in order (all that the business needs) and spreads the merchant's orders across all 12 partitions.

**Step 5, a duplicate.** The email consumer sends an email, then crashes before committing its offset. On restart it re-reads the last few records and sends the same email again. This is at-least-once delivery. Recording the event ID of each email sent does not close the gap on its own: if the process sends the email and crashes before recording the ID, the email still goes out twice. The real fix is to pass the event ID as an idempotency key to the email provider, so the provider drops the repeat (or record the intent first and rely on the provider's dedupe). Otherwise, accept that a rare duplicate email is the price of at-least-once delivery.

## In the real world

- **Apache Kafka.** Retention by time (`retention.ms`, default 7 days) or size (`retention.bytes`), or *log compaction* (`cleanup.policy=compact`), which keeps only the latest record per key, so a topic can hold "current state per user" indefinitely. Durability comes from replication (`replication.factor`, usually 3) plus `acks=all` and `min.insync.replicas=2`, so a write is acknowledged only once two copies have it. Producers have been idempotent by default since Kafka 3.0 (`enable.idempotence=true`), and transactions give exactly-once processing for read-process-write flows inside Kafka.
- **Amazon SNS and SQS.** The classic AWS fan-out: publish to an SNS topic, subscribe one SQS queue per consuming service. SNS copies each message to each queue, and each service's workers drain its own queue at their own pace with its own DLQ. There is no replay beyond what each queue still holds.
- **Google Cloud Pub/Sub.** A managed pub/sub where each subscription keeps unacknowledged messages for up to 7 days by default, with an **ack deadline** (default 10 seconds) after which a message is redelivered. Ordering is opt-in per **ordering key**, and you can *seek* a subscription back to a timestamp to replay.
- **Amazon Kinesis Data Streams.** A managed log much like Kafka, where partitions are called **shards**. Each shard accepts up to 1 MB/s or 1,000 records/s of writes and serves 2 MB/s of reads; default retention is 24 hours, extendable to 365 days.

## Trade-offs

- **Loose coupling against visibility.** Adding consumers is easy, but nobody can see the whole flow by reading one service's code. You need [distributed tracing](/modules/observability) and a schema registry to know who publishes what.
- **<Term id="eventual-consistency">Eventual consistency</Term>.** Consumers update after the event, not with it, so for a moment the search index or the dashboard is behind the order database.
- **Ordering is local.** Only within a partition or ordering key. If you need two events in order, they need the same key.
- **Retention costs storage.** Replay is worth it for business events; for a high-volume, low-value stream, short retention or a plain queue may be cheaper.
- **Delivery is at least once.** Consumers must be idempotent, or use transactional exactly-once features where the whole pipeline lives inside the broker.

## Interview tips

- Use pub/sub when one event has several independent reactions: notifications, analytics, search indexing, cache invalidation.
- Reach for a log (Kafka, Kinesis) when you need high <Term id="throughput">throughput</Term>, per-key ordering, or replay; reach for a plain queue when you only need to share out jobs.
- Name the partition key and say why ("order ID, so each order's events stay in order and load spreads evenly").
- Size the partition count from the consumer speed, as in the worked example, and mention consumer lag as the metric you would watch.

**Common mistakes:**

- Assuming global ordering across a topic. Kafka orders only within a partition.
- Adding more consumers than partitions and expecting more throughput; the extras sit idle.
- Picking a partition key with skew (country, merchant, a celebrity's user ID), creating one hot partition.
- Treating events as commands. "OrderPlaced" says what happened; "SendEmail" tells one specific service what to do and quietly re-couples the publisher to it.

## Common follow-up questions

### How do you get exactly-once processing?

Across systems you generally do not; you get at-least-once delivery and make consumers idempotent, by keying writes on the event ID or using upserts. Inside Kafka, idempotent producers plus transactions let a consumer read, process, and write to another topic and commit its offset atomically, so a Kafka-to-Kafka pipeline can be exactly-once.

### How do you evolve the event schema?

Treat events like a public API. Use a schema format such as Avro or Protobuf with a schema registry that rejects incompatible changes, only add optional fields, and never change what an existing field means. Consumers that do not know a new field ignore it.

### How do you publish an event reliably when you also write to a database?

Use the <Term id="transactional-outbox">transactional outbox</Term>: write the order row and an outbox row in one transaction, then a relay (or a change-data-capture tool such as Debezium reading the database's log) publishes the outbox rows to Kafka. This avoids the case where the database commit succeeds and the publish is lost.

### What happens when a consumer falls behind past retention?

The records it never read are deleted, and its committed offset points at data that no longer exists. Kafka then applies `auto.offset.reset`: jump to the earliest remaining record (losing the gap) or the latest (losing everything in between). Alarm on consumer lag long before that, and set retention well above your worst expected outage.

### When would you not use Kafka?

For low-volume task distribution with per-message retries and delays, a queue such as SQS or RabbitMQ is simpler: it has per-message acknowledgement, DLQs, and no partitions to size. Kafka shines with high volume, ordering, and many readers of the same data.

## Go deeper

- [Jay Kreps, The Log](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying): the essay that explains why an append-only log is the core abstraction behind Kafka.
- [Apache Kafka documentation](https://kafka.apache.org/documentation/): partitions, consumer groups, replication, and delivery semantics from the source.
- [Google Cloud Pub/Sub overview](https://cloud.google.com/pubsub/docs/overview): how a managed broker handles subscriptions, acknowledgement deadlines, and ordering keys.
