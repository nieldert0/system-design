---
slug: observability
title: Observability
section: devops
readFirst:
  - monolith-vs-microservices
  - availability-patterns
sources:
  - id: otel-obs
    title: OpenTelemetry Documentation, Observability primer
    url: https://opentelemetry.io/docs/concepts/observability-primer/
    license: CC BY 4.0
    use: reworded
  - id: otel-signals
    title: OpenTelemetry Documentation, Signals
    url: https://opentelemetry.io/docs/concepts/signals/
    license: CC BY 4.0
    use: reworded
  - id: otel-traces
    title: OpenTelemetry Documentation, Traces
    url: https://opentelemetry.io/docs/concepts/signals/traces/
    license: CC BY 4.0
    use: reworded
  - id: otel-ctx
    title: OpenTelemetry Documentation, Context propagation
    url: https://opentelemetry.io/docs/concepts/context-propagation/
    license: CC BY 4.0
    use: reworded
  - id: wiki-sre
    title: Wikipedia, Site reliability engineering
    url: https://en.wikipedia.org/wiki/Site_reliability_engineering
    license: CC BY-SA 4.0
    use: reworded
  - id: sre-book
    title: Google, Site Reliability Engineering, Monitoring Distributed Systems
    url: https://sre.google/sre-book/monitoring-distributed-systems/
    license: All rights reserved
    use: reworded
  - id: wiki-sli
    title: Wikipedia, Service level indicator
    url: https://en.wikipedia.org/wiki/Service_level_indicator
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What are the three classic signals of observability?
    options:
      - CPU, memory and disk
      - Logs, metrics and traces
      - Unit, integration and end-to-end tests
      - DNS, TCP and HTTP
    correct: 1
    explanation: Each answers a different question; together they explain what the system is doing.
  - prompt: Which signal is best for "how many 500 errors per second over the last week"?
    options:
      - Metrics
      - Traces
      - Core dumps
      - Logs
    correct: 0
    explanation: Metrics are cheap numeric time series, ideal for dashboards and alerts.
  - prompt: Which signal shows where time went in one slow request across five services?
    options:
      - The load balancer's config
      - DNS logs
      - Metrics
      - A distributed trace
    correct: 3
    explanation: The trace's spans show each service's share of the request's latency.
  - prompt: How does a downstream service know which trace a request belongs to?
    options:
      - Every request starts a new trace
      - It guesses from timestamps
      - The trace ID is passed along in request headers (context propagation)
      - The database tells it
    correct: 2
    explanation: The W3C traceparent header is the common standard.
  - prompt: Why use structured (JSON) logs with a request ID?
    options:
      - They look nicer
      - They can be searched and filtered by field, and joined to a trace
      - They are smaller than any other format
      - They are required by HTTP
    correct: 1
    explanation: Fields such as user_id and trace_id make logs queryable.
  - prompt: Why should alerts fire on symptoms such as error rate and latency rather than on high CPU alone?
    options:
      - Users feel errors and slowness; high CPU may be harmless
      - Latency is easier to fake
      - Alerts should never fire
      - CPU cannot be measured
    correct: 0
    explanation: Alert on what hurts users (SLOs), and use cause metrics to debug.
  - prompt: Why are high-cardinality labels such as user ID a problem in metrics?
    options:
      - They make graphs too smooth
      - They break HTTPS
      - They are not allowed in JSON
      - Each unique value creates a new time series, so storage and cost explode
    correct: 3
    explanation: Put per-user detail in logs or traces instead.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TraceFlow from '#lib/diagrams/TraceFlow.svelte';
</script>

When a request is slow or failing in a system of many services, you need to find out why from the outside, without adding new code first.

## What it is

**<Term id="observability">Observability</Term>** is the ability to understand a system's internal state by looking at what it outputs: its telemetry. A system is observable when you can answer new questions about it, such as "why is checkout slow for users in Europe?", without shipping new code. <Src id="otel-obs" />

Telemetry comes in three main signals: logs, metrics and traces. <Src id="otel-signals" />

## How it works

**Logs** are timestamped records of events. Structured logs (JSON with fields such as `level`, `user_id` and `trace_id`) can be searched and filtered, and joined to traces. They are detailed but costly to store at high volume. <Src id="otel-obs" />

**Metrics** are numbers measured over time: request rate, error rate, latency percentiles, queue depth, CPU. They are cheap to store and query, so they drive dashboards and alerts. Keep label values bounded: each unique combination is a new time series. <Src id="otel-signals" />

**Traces** follow one request through every service it touches. A **<Term id="distributed-tracing">trace</Term>** is a tree of **spans**; each span records one operation with its start time, duration and attributes. <Src id="otel-traces" /> The trace ID travels with the request in headers (context propagation, usually the W3C `traceparent` header), so every service adds its span to the same trace. Each service sends its spans to a collector, which joins them by trace ID into one timeline. For example, a request enters at a gateway, which calls an orders service, which calls payments: one trace, three spans. <Src id="otel-ctx" />

<TraceFlow />

**Alerting.** Pick a few service level indicators (SLIs) that users feel, such as the share of requests that succeed within 300 ms, set objectives (SLOs) for them, and alert when you are at risk of missing them. <Src id="wiki-sli" /> <Src id="wiki-sre" /> A common starting set is the **four golden signals**: latency, traffic, errors and saturation. <Src id="sre-book" />

## Trade-offs

| Signal | Answers | Cost | Watch out for |
| --- | --- | --- | --- |
| Logs | What happened, in detail | High at volume | Noise; secrets in logs |
| Metrics | How much, how often, trends | Low | High-cardinality labels |
| Traces | Where the time went in one request | Medium | Usually sampled |

- **Sampling** keeps tracing affordable, but you may miss the rare slow request; tail-based sampling keeps the interesting ones. <Src id="otel-traces" />
- **Vendor-neutral instrumentation** such as OpenTelemetry lets you change backends without rewriting code. <Src id="otel-obs" />

## Interview tips

- Add a monitoring box to every design: metrics plus alerts on error rate and p99 latency.
- For microservices, mention distributed tracing with trace IDs passed in headers.
- Tie alerts to SLOs, not to CPU, and log with request or trace IDs.
