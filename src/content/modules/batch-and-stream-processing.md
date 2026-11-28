---
slug: batch-and-stream-processing
title: Batch and stream processing
section: communication
readFirst:
  - pub-sub-and-event-streaming
sources:
  - id: mapreduce
    title: Dean and Ghemawat, MapReduce, Simplified Data Processing on Large Clusters (2004)
    url: https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/
    license: All rights reserved
    use: reworded
  - id: dataflow
    title: Akidau et al., The Dataflow Model (VLDB 2015)
    url: https://research.google/pubs/the-dataflow-model-a-practical-approach-to-balancing-correctness-latency-and-cost-in-massive-scale-unbounded-out-of-order-data-processing/
    license: All rights reserved
    use: reworded
  - id: flink-docs
    title: Apache Flink documentation, Timely stream processing
    url: https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/
    license: Apache 2.0
    use: reworded
  - id: wiki-lambda
    title: Wikipedia, Lambda architecture
    url: https://en.wikipedia.org/wiki/Lambda_architecture
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the defining difference between batch and stream processing?
    options:
      - Batch uses SQL and stream does not
      - Batch processes a bounded dataset after it is complete; stream processes an unbounded dataset continuously as records arrive
      - Stream processing cannot keep state
      - Batch jobs never run on clusters
    correct: 1
    explanation: Bounded versus unbounded input is the core distinction; latency and tooling follow from it.
  - prompt: Why do stream processors window by event time rather than processing time?
    options:
      - It is faster to compute
      - Because results then depend on when events happened, not on network delays or replays, so a rerun gives the same answer
      - Processing time is not available
      - Event time removes the need for state
    correct: 1
    explanation: Processing time shifts with lag and replays; event time makes results deterministic.
  - prompt: What does a watermark of 12:01:05 tell a stream job?
    options:
      - That all events are now on disk
      - That it should expect no more events with timestamps before roughly 12:01:05, so windows ending before then can close
      - That the job is 5 seconds behind
      - That the clock on the broker is 12:01:05
    correct: 1
    explanation: A watermark is the job's estimate of event-time progress; it trades completeness for latency.
  - prompt: In the worked example, the nightly batch job reads 2 TB and each worker scans 1 GB/s. How long does the scan take on 50 workers?
    options:
      - About 4 minutes
      - About 40 seconds
      - About 40 minutes
      - About 4 hours
    correct: 1
    explanation: 2,000 GB / (50 × 1 GB/s) = 40 s for the scan alone; start-up, shuffle, and the write add more.
  - prompt: The stream job checkpoints every 60 s and crashes 45 s after the last checkpoint. Its sink is an upsert keyed on window and product. What happens?
    options:
      - The 45 s of results are lost
      - It restores state from the checkpoint, rewinds Kafka offsets to match, reprocesses 45 s of events, and the upserts overwrite rows with the same values, so each click counts once
      - It double counts 45 s of events
      - It restarts from offset 0
    correct: 1
    explanation: State and input positions are restored together, and the idempotent sink makes rewriting harmless.
  - prompt: A dashboard needs per-minute counts within 10 s, and finance needs an exact daily total. What design fits?
    options:
      - Batch only
      - A stream job for the dashboard and either a nightly batch recompute or the same stream code replayed over the stored log for the exact daily figure
      - Stream only with processing-time windows
      - A cron job every 10 s
    correct: 1
    explanation: Different freshness and correctness needs; Lambda uses two code paths, Kappa replays one.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import StreamWindowFlow from '#lib/diagrams/StreamWindowFlow.svelte';
</script>

Batch processing runs a job over a complete, fixed dataset, such as yesterday's logs. Stream processing runs continuously over data that never ends, producing results seconds after each event arrives. Most data platforms use both, and the hard part of streaming is getting correct answers when events arrive late, out of order, or twice.

## What it is

Here is the problem. A shop stores every click in a log, 50,000 clicks per second. Marketing wants a dashboard of clicks per product per minute, finance wants an exact count per day, and the recommendation team wants to retrain on the last 30 days. You cannot answer these by querying the order database on each page load: the raw data is billions of rows, and the queries would crush the database that serves customers.

You need a separate system that reads the raw events and computes results. There are two ways to do it.

**Batch processing** waits until a dataset is complete ("all of yesterday's clicks") and then runs one job over it from start to finish. The input is **bounded**: it has an end, so the job can sort it, join it, and know when it is done. Results are as fresh as the last run, often hours old. MapReduce, Apache Spark, and SQL engines such as BigQuery or Trino are batch tools. <Src id="mapreduce" />

**Stream processing** treats input as **unbounded**: it never ends. A long-running job reads each event from a log such as [Kafka](/modules/pub-sub-and-event-streaming), updates some state (a counter, a running sum), and emits results continuously, with latency in seconds or less. Apache Flink, Kafka Streams, and Spark Structured Streaming are stream tools. <Src id="dataflow" />

Because the stream never ends, a stream job must decide *when* to emit a result, for example "the count for 12:00 to 12:01". That needs a notion of time, windows, and a guess about how late data can be. Those three ideas are most of this module.

## How it works

### Batch: MapReduce and its successors

MapReduce, published by Google in 2004, splits a job into three phases. <Src id="mapreduce" />

1. **Map.** Many workers each read one chunk of the input (say a 128 MB block of a file) and emit key-value pairs, such as `(product_id, 1)` for each click.
2. **Shuffle.** The framework sends every pair with the same key to the same reducer, by hashing the key. This is a big network transfer and usually the slowest step.
3. **Reduce.** Each reducer sums or combines the values for its keys and writes the output.

The model is simple and fault tolerant: if a worker dies, the framework reruns its chunk, because the input is immutable and the map function has no side effects. The cost is that each stage writes its output to disk before the next reads it.

**Apache Spark** keeps the same idea but plans the whole job as a graph of stages and holds intermediate data in memory where it fits. That makes multi-step jobs (joins, iterative machine learning) much faster than chained MapReduce jobs, which is why Spark replaced it for most work.

### Stream: state, time, and windows

A stream job is a graph of operators that run all the time. Each operator reads records, may update **state** kept locally (for example a counter per product), and emits records downstream. Records with the same key go to the same parallel instance, just as in the shuffle, so each instance owns the state for its keys.

There are two clocks in a stream: <Src id="flink-docs" />

- **<Term id="event-time">Event time</Term>** is when the event actually happened, stamped by the phone or server that created it.
- **Processing time** is when the stream job sees it.

They differ because of network delays, phones that were offline, and a job that is catching up after a restart. If you group by processing time, a job that was down for 10 minutes and then catches up puts 10 minutes of clicks into one minute's bucket. Grouping by event time gives the same answer whether you process live or replay last week, which is why correctness-minded systems use it.

**Windows** cut the endless stream into finite groups:

- **Tumbling windows** are fixed and non-overlapping: 12:00 to 12:01, 12:01 to 12:02.
- **Sliding (hopping) windows** overlap: a 5-minute window every minute, so each event belongs to five windows.
- **Session windows** group a user's events separated by less than a gap, such as 30 minutes of inactivity.

### Watermarks and late data

With event time, when is the 12:00 window complete? You can never be sure, since a phone might upload a 12:00:30 click an hour later. A <Term id="watermark">watermark</Term> is the job's running estimate: "I believe I have now seen all events up to time T". When the watermark passes the end of a window, the job emits that window's result. <Src id="dataflow" />

A common way to generate one is to take the largest event time seen and subtract a fixed delay you expect events to stay within, such as 5 seconds. A longer delay gives more complete results but later ones. Events that arrive behind the watermark are **late**. You can allow some lateness (keep the window's state for an extra minute or two and emit a correction) and send anything later to a side output for inspection, rather than dropping it silently.

<StreamWindowFlow />

### Fault tolerance and exactly-once

A stream job holds state in memory, so a crash must not lose it or double-count. Flink takes periodic **checkpoints**: a consistent snapshot of every operator's state together with the Kafka offsets each source had read. On failure, it restores the last checkpoint and rewinds the sources to those offsets, then reprocesses from there. Because state and input position are restored together, each event affects the state exactly once. <Src id="flink-docs" />

The output is the tricky part. If the job wrote results to a database between the checkpoint and the crash, replaying writes them again. <Term id="exactly-once-processing">Exactly-once</Term> end to end needs one of two things from the sink: **transactional writes** that commit only when a checkpoint completes (Flink's two-phase commit to Kafka), or **idempotent writes** where writing the same result twice leaves the same state (an upsert keyed on window and product). Without either, you get [at-least-once](/modules/queues-and-back-pressure) output, and duplicates must be tolerated downstream.

### Lambda and Kappa architectures

The **Lambda architecture** runs both: a stream layer gives fast, approximate results, and a batch layer recomputes exact results from the raw data each night, overwriting the stream's numbers. It works but means writing the same logic twice. <Src id="wiki-lambda" />

The **Kappa architecture** uses only the stream path. Keep the raw events in a long-retention log, and when logic changes, start a new version of the stream job from offset 0 to rebuild results, then switch readers over. Event-time windows are what make this replay give correct answers.

| | Batch | Stream |
|---|---|---|
| Input | Bounded, complete | Unbounded, arriving |
| Latency | Minutes to hours | Milliseconds to seconds |
| Correctness | Easy: all data is present | Needs event time, watermarks, checkpoints |
| Failure handling | Rerun the failed task | Restore checkpoint and replay |
| Tools | Spark, BigQuery, Trino, Hadoop MapReduce | Flink, Kafka Streams, Spark Structured Streaming |

## Worked example

The shop has **50,000 click events per second**, each about **500 bytes**, in a Kafka topic with 32 partitions.

**Step 1, the daily volume.** 50,000 × 86,400 s ≈ **4.3 billion events per day**. At 500 bytes each that is about **2.2 TB per day**. Call it 2 TB of raw input.

**Step 2, the nightly batch job.** Finance's exact daily count runs as a Spark job over yesterday's files in [object storage](/modules/object-storage). Suppose each worker can scan about 1 GB/s. With 50 workers, the scan takes 2,000 GB / (50 × 1 GB/s) = **40 seconds**. The shuffle is small, because Spark combines counts on the map side and sends only one partial count per product per task, not one record per click. With start-up and writing, the job finishes in a few minutes. The result is exact, but finance only sees it after midnight.

**Step 3, the streaming dashboard.** Marketing wants clicks per product per minute, fresh within 10 seconds. A Flink job reads the 32 partitions with 32 parallel source tasks, keys by `product_id`, and keeps a counter per product in a 1-minute tumbling window. There are 200,000 products and, with lateness allowed, up to three windows open at once, so state is at most 600,000 counters, a few tens of MB. The watermark is the largest event time seen minus **5 seconds**. So the 12:00 window first fires when the job sees an event stamped 12:01:05, about 5 seconds after the minute ends.

**Step 4, a late event.** The job allows **2 minutes of lateness**: it keeps each window's state until the watermark is 2 minutes past the window's end, and re-emits a corrected count if a late event arrives in that time. So the 12:00 window's state lives until the watermark reaches 12:03:00. A phone that was in a tunnel uploads a click stamped 12:00:30, but by the time it arrives the watermark is 12:03:20, so the window state is gone and the event goes to the late side output. If phones in tunnels are common, the trade-off is longer lateness (more state and more corrections) or accepting that the stream count is slightly low and letting the nightly batch fix it.

**Step 5, a crash.** Checkpoints run every **60 seconds**. A worker dies 45 seconds after the last checkpoint. Flink restarts the job, restores the counters from that checkpoint, and rewinds each Kafka partition to the stored offset. It reprocesses 45 s × 50,000 = **2.25 million events**. The state is correct because it was rolled back to match the offsets. The sink is an upsert keyed on `(window, product_id)`, so rewriting the 12:00 rows replaces them with the same values. No click counts twice. The cost of the crash is some seconds of extra delay while the job catches up.

**Step 6, the comparison.** Over a day, the stream total comes out 0.02% below the batch total, the share of events that arrived later than the allowed lateness. That number tells you whether the lateness setting is good enough, and whether you still need the batch path at all.

## In the real world

- **Apache Spark.** The batch workhorse, with `spark.sql.shuffle.partitions` (default 200) controlling how many reduce tasks a shuffle uses, a common tuning knob for large jobs. Structured Streaming runs the same DataFrame code as small micro-batches, with latency usually from a few hundred milliseconds to seconds.
- **Apache Flink.** Record-at-a-time streaming with event time, watermarks (`WatermarkStrategy.forBoundedOutOfOrderness`), checkpoints (`execution.checkpointing.interval`), and RocksDB as the state backend for large keyed state. Its Kafka sink supports exactly-once through Kafka transactions.
- **Kafka Streams.** A Java library, not a cluster: your application instances form a [consumer group](/modules/pub-sub-and-event-streaming), and state lives in local RocksDB stores backed up to compacted Kafka topics. Setting `processing.guarantee=exactly_once_v2` makes the read-process-write cycle transactional within Kafka.
- **Apache Beam and Google Cloud Dataflow.** Beam is the open source version of the Dataflow model: one programming model with windows, watermarks, triggers, and allowed lateness, running on Dataflow, Flink, or Spark. <Src id="dataflow" />

## Trade-offs

- **Latency against completeness.** A short watermark delay gives fast results that miss late events; a long one is more complete but slower and holds more state.
- **Simplicity against freshness.** Batch jobs are easier to write, test, and rerun. Streaming is worth it only when someone acts on results within minutes.
- **State is the hard part.** Stream jobs with large state need checkpoint storage, careful upgrades, and rebalancing when you change parallelism.
- **Exactly-once has a cost.** Transactional sinks add latency (output becomes visible only after each checkpoint) and need a sink that supports transactions or idempotent writes.
- **Two code paths.** Lambda doubles the logic to maintain; Kappa needs long log retention and fast replays.

## Interview tips

- Start with the freshness requirement. "Daily report" means batch; "fraud check within a second" means stream.
- Say "event time" and "watermark" and explain each in one sentence. That is the signal that you understand streaming.
- Name what the stream job keys by and what its state is, and estimate the state size as in the worked example.
- When asked about exactly-once, explain that it comes from replayable input, checkpointed state, and an idempotent or transactional sink together.

**Common mistakes:**

- Windowing by processing time, so a backlog after an outage lands in the wrong minutes.
- Claiming exactly-once across a pipeline whose sink is a plain, non-idempotent insert.
- Putting a stream processor in a design that only needs a nightly report.
- Forgetting skew: one hot key (a viral product) sends all its events to one parallel task, just like a hot Kafka partition.

## Common follow-up questions

### How do you handle a hot key in a stream aggregation?

Split it. Add a random suffix to the hot key (`product_7#0` to `product_7#9`) so ten tasks count it in parallel, then sum the ten partial counts in a second, much smaller stage. Batch engines do the same for skewed joins.

### How do you join two streams?

Within a time bound. For example, join each ad click to the impression for the same ad that happened up to 10 minutes before it. The job buffers impressions for 10 minutes of event time in state and drops them once the watermark passes, which keeps state finite. Joining a stream to a slowly changing table (product names) instead uses a copy of the table kept in local state, fed from a compacted topic or change stream.

### What happens when you change a stream job's code?

Take a savepoint (a manually triggered checkpoint), stop the job, deploy the new version, and start it from the savepoint, so it keeps its state and offsets. If the state format changes incompatibly, you migrate it or replay from the log with the new code, as in Kappa.

### Is micro-batching real streaming?

It processes small batches every few hundred milliseconds or seconds, which is fine for most dashboards and alerting. Record-at-a-time engines like Flink reach lower latency. What matters more for correctness is whether the engine supports event time and watermarks, which both styles can.

### Why not just run the batch job every minute?

For small data you can. At scale each run pays start-up cost and rereads its input, and you still need logic for events that arrive after their minute's run. A stream job keeps state warm and handles lateness explicitly.

## Go deeper

- [Tyler Akidau, Streaming 101](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/): the clearest explanation of event time, processing time, and windows, from one of the Dataflow authors.
- [The Dataflow Model paper](https://research.google/pubs/the-dataflow-model-a-practical-approach-to-balancing-correctness-latency-and-cost-in-massive-scale-unbounded-out-of-order-data-processing/): the model behind watermarks, triggers, and allowed lateness.
- [Apache Flink, Stateful stream processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/): how checkpoints and barriers give exactly-once state.
- [The MapReduce paper](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/): the original map, shuffle, and reduce design and its fault tolerance.
