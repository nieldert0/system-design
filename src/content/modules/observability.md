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
  - prompt: In the worked example, the SLO is 99.9% of requests succeeding over 30 days at 1,000 requests/s. How many failed requests does the error budget allow?
    options:
      - About 2,600
      - About 26,000
      - About 2.6 million
      - About 260,000
    correct: 2
    explanation: 30 days × 86,400 s × 1,000/s is about 2.6 billion requests, and 0.1% of that is about 2.6 million failures, or about 43 minutes of total outage.
  - prompt: Why should alerts fire on symptoms such as error rate and latency rather than on high CPU alone?
    options:
      - Users feel errors and slowness; high CPU may be harmless
      - Latency is easier to fake
      - Alerts should never fire
      - CPU cannot be measured
    correct: 0
    explanation: Alert on what hurts users (SLOs), and use cause metrics to debug.
  - prompt: The error rate jumps to 1.44% against a 99.9% SLO. Why page someone now instead of waiting a day?
    options:
      - Any error should page
      - At a burn rate of 14.4, the whole 30-day budget is gone in about 2 days, and 2% of it is spent every hour
      - Because CPU is probably high too
      - The SLO resets every hour
    correct: 1
    explanation: Burn rate is the error rate divided by the budgeted rate (1.44% / 0.1% = 14.4). A fast burn needs a page; a slow burn can be a ticket.
  - prompt: You add a user_id label to a request-count metric with 5 status codes and 20 endpoints. There are 1 million users. Roughly how many time series can that create?
    options:
      - 100
      - About 1 million
      - Up to 100 million
      - 26
    correct: 2
    explanation: Each unique label combination is a series, 5 × 20 × 1,000,000 = 100 million. Put per-user detail in logs or traces instead.
  - prompt: You sample 1% of traces at the start of each request (head-based sampling). Why might you miss the trace you need?
    options:
      - Sampled traces are compressed
      - The decision is made before anyone knows the request will be slow or fail, so 99% of rare errors are dropped; tail-based sampling decides after the trace completes
      - Traces cannot record errors
      - Head-based sampling only works for metrics
    correct: 1
    explanation: Tail-based sampling keeps all slow or failed traces plus a small share of normal ones.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TraceFlow from '#lib/diagrams/TraceFlow.svelte';
</script>

When a request is slow or failing in a system of many services, you need to find out why from the outside, quickly, without first shipping new code to add a print statement.

## What it is

Here is the problem. Checkout is slow for some users. The request passes through a gateway, an orders service, an inventory service, a payment service and two databases, each with 10 or more instances. Every service's CPU graph looks normal. Logging into servers and reading files one by one could take hours, and the slowness may be gone by then. In a [monolith](/modules/monolith-vs-microservices) a stack trace tells you where time went; across services, nothing does unless you planned for it.

**<Term id="observability">Observability</Term>** is the ability to understand a system's internal state from what it outputs, its **telemetry**. A system is observable when you can answer new questions about it, such as "why is checkout slow for users in Europe on Android?", using data it already emits, without shipping new code. <Src id="otel-obs" /> **Monitoring** is the narrower part: watching known indicators and alerting when they go wrong.

Telemetry comes in three main signals, each answering a different question: <Src id="otel-signals" />

- **Metrics:** how much and how often? (request rate, error rate, latency)
- **Logs:** what exactly happened? (this request, this error, this user)
- **Traces:** where did the time go for this one request across services?

## How it works

### Metrics

**Metrics** are numbers measured over time: request rate, error rate, latency <Term id="percentile">percentiles</Term>, queue depth, CPU. Each metric is a set of time series, one per combination of **labels**, for example `http_requests_total{service="checkout", status="500"}`. Storing a number every 15 seconds per series is cheap, so metrics drive dashboards and alerts and are kept for months. <Src id="otel-signals" />

Latency is recorded as a **histogram** (counts of requests in buckets such as under 50 ms, under 100 ms, under 250 ms), from which you estimate p50, p99 and so on. Averages hide the slow requests that users complain about; see [latency against throughput](/modules/latency-vs-throughput) and <Term id="tail-latency">tail latency</Term>.

The catch is **<Term id="metric-cardinality">cardinality</Term>**. Every unique label combination is a new series, so a label with unbounded values, such as user ID or full URL, multiplies the series count and can take down the metrics system. Keep labels to small, fixed sets (service, endpoint, status class, region).

### Logs

**Logs** are timestamped records of events. **Structured logs**, JSON with fields such as `level`, `user_id`, `order_id` and `trace_id`, can be searched and filtered by field and joined to traces, unlike free-text lines you have to grep. Logs carry the detail metrics leave out, so per-user and per-request facts belong here. They are also the most expensive signal at volume: a service doing 10,000 requests/s with one 1 KB log line per request writes about 860 GB a day. <Src id="otel-obs" />

### Traces

A **<Term id="distributed-tracing">trace</Term>** follows one request through every service it touches. It is a tree of **<Term id="span">spans</Term>**: each span records one operation (an HTTP call, a database query) with its start time, duration, parent span and attributes such as status code. <Src id="otel-traces" />

The trace ID travels with the request in headers, which is **context propagation**, usually the W3C `traceparent` header, so each service adds its spans to the same trace instead of starting a new one. Each service sends its spans to a collector, which joins them by trace ID into one timeline. For example, a request enters at a gateway, which calls an orders service, which calls payments: one trace, three spans, and the timeline shows at a glance that payments took 800 of the 900 ms. <Src id="otel-ctx" />

<TraceFlow />

Tracing every request is expensive, so traces are **sampled**. **Head-based sampling** decides at the start of the request (keep 1%), which is cheap but drops 99% of the rare slow ones too. **<Term id="tail-based-sampling">Tail-based sampling</Term>** buffers spans until the trace finishes and then keeps every slow or failed trace plus a small share of normal ones. <Src id="otel-traces" />

### Alerting on what users feel

Pick a few **<Term id="sli">service level indicators</Term>** (SLIs) that users feel, such as "the share of checkout requests that succeed within 300 ms". Set a **<Term id="slo">service level objective</Term>** (SLO) for each, such as 99.9% over 30 days. <Src id="wiki-sli" /> <Src id="wiki-sre" /> The 0.1% you are allowed to miss is the **<Term id="error-budget">error budget</Term>**: as long as budget remains, the team can ship freely; when it runs out, reliability work comes first.

Alerts then fire on how fast the budget is being spent, the **<Term id="burn-rate">burn rate</Term>**, not on every error. A common starting set of things to watch is the **four golden signals**: latency, traffic, errors, and saturation (how full the most constrained resource is, such as CPU, memory, or connection pool). <Src id="sre-book" /> Cause metrics such as CPU stay on dashboards for debugging, but they do not page anyone on their own.

## Worked example

A checkout service handles **1,000 requests/s**. Its SLO is **99.9% of requests succeed** over a 30-day window.

**Step 1, size the error budget.** 30 days is 2,592,000 s, so the window has about **2.6 billion requests**. 0.1% of that is about **2.6 million** failed requests allowed per month, the same as about 43 minutes of total outage.

**Step 2, decide when to page.** The burn rate is the current error rate divided by the budgeted rate (0.1%). A burn rate of 1 spends the budget in exactly 30 days. The SRE workbook's standard fast-burn alert pages at a **burn rate of 14.4 over 1 hour** (and also over 5 minutes, so it stops quickly after recovery). That means an error rate of 1.44%, which spends 14.4 ÷ 720 hours ≈ **2% of the monthly budget in one hour** and would exhaust it in about two days. A slow-burn alert at a rate of 1 over 3 days files a ticket instead of waking someone.

**Step 3, an incident.** At 14:02 the error rate rises to **3%**, 30 failed requests a second, a burn rate of 30. The 5-minute burn rate crosses 14.4 almost at once, but the alert needs the 1-hour rate above 14.4 too, and that average only gets there after about 29 minutes (30 × 29 ÷ 60 ≈ 14.5). So the page goes out around 14:31, by which time 29 × 60 × 30 ≈ 52,000 requests have failed, about 2% of the budget, exactly the loss the threshold was designed to allow. A CPU alert would not have fired at all, because CPU is at 40%.

**Step 4, find the cause.** The on-call engineer opens the checkout dashboard: errors are all HTTP 504 (gateway timeout), and p99 latency has jumped from 280 ms to 5 s, but only for the payment step. They filter traces for `status=error` in the last 10 minutes (tail-based sampling has kept every one of them). A typical failing trace: gateway 5,010 ms, checkout 5,005 ms, **payment-client span 5,000 ms, ending in a timeout**, and inventory a normal 12 ms. The payment span's attributes show `payment.provider=acme` on every failing trace. Taking the trace ID from one span, they search the logs: `{"level":"error","trace_id":"4bf9...","msg":"acme timeout after 5000ms","region":"eu-west"}`.

So in about 10 minutes: metrics said *something is wrong and how badly*, traces said *where*, and logs said *exactly what*. The fix is to fail over to the second payment provider and lower the client timeout so a slow provider does not hold connections, ideally behind a <Term id="circuit-breaker">circuit breaker</Term>.

**Step 5, the cost of getting it wrong.** Suppose someone had added `user_id` as a metric label to make that investigation easier. With 20 endpoints, 5 status codes and 1 million active users, that can create **100 million series**. Prometheus uses a few kilobytes of memory per active series, so that is hundreds of gigabytes, and the metrics server falls over during the incident you needed it for. That detail belonged in traces and logs.

## In the real world

- **Prometheus.** Pulls (scrapes) metrics from each target's `/metrics` endpoint, by default every 1 minute (`scrape_interval`), though 15 to 30 seconds is the common setting; keeps 15 days of data locally by default (`--storage.tsdb.retention.time`). Alerts are PromQL rules evaluated by Prometheus and routed by Alertmanager, which groups, silences and de-duplicates them. Its naming guide (`_total` for counters, base units such as `_seconds`) is the de facto convention.
- **OpenTelemetry.** The vendor-neutral standard for emitting all three signals. Apps use its SDKs; the **Collector** receives, batches, filters and exports telemetry to any backend, and its `tail_sampling` processor implements tail-based sampling with policies such as "keep all errors" and "keep traces over 500 ms". <Src id="otel-obs" />
- **Google Dapper.** The 2010 paper that introduced the trace and span model most tools still use. Dapper sampled as little as 1 in 1,024 requests in high-traffic services and still found most latency problems, which shows how far sampling can go when traffic is high.
- **Grafana stack and commercial suites.** Grafana dashboards over Prometheus or Mimir (metrics), Loki (logs, indexed only by labels to keep storage cheap) and Tempo (traces); Datadog, Honeycomb and New Relic sell the same three signals as a service, usually priced per host, per GB of logs, or per span, which is why sampling and log levels are a cost decision.

## Trade-offs

| Signal | Answers | Cost | Watch out for |
| --- | --- | --- | --- |
| Logs | What happened, in detail | High at volume | Noise; secrets and personal data in logs |
| Metrics | How much, how often, trends | Low | High-cardinality labels |
| Traces | Where the time went in one request | Medium | Sampling can drop the request you need |

- **Sampling** keeps tracing affordable, but head-based sampling may miss the rare slow request; tail-based sampling keeps the interesting ones at the cost of buffering every span until the trace ends. <Src id="otel-traces" />
- **Vendor-neutral instrumentation** such as OpenTelemetry lets you change backends without rewriting code. <Src id="otel-obs" />
- **Alert sensitivity against fatigue.** Tight thresholds catch more problems but page people for noise, and people who are paged for noise start ignoring pages. Burn-rate alerts on SLOs fire less often and mean more.

## Interview tips

- Add a monitoring box to every design: metrics plus alerts on error rate and p99 latency against an SLO.
- For microservices, mention distributed tracing with trace IDs passed in headers, and logs that carry the same trace ID.
- Tie alerts to SLOs and burn rate, not to CPU, and keep high-cardinality detail out of metrics.
- Quote an error budget in numbers, as in the worked example; it shows you know what "three nines" means.

**Common mistakes:**

- Paging on causes (CPU over 80%, one pod restarted) instead of symptoms users feel, which produces noisy pages and still misses real outages like the payment timeout above.
- Putting user IDs, request IDs or raw URLs in metric labels, which explodes cardinality.
- Reporting average latency. The average can look fine while p99, the experience of 1 in 100 requests, is terrible.
- Logging without a trace or request ID, so logs from five services cannot be joined to one request.
- Logging secrets or personal data such as passwords, tokens and card numbers, which turns the log store into a breach.

## Common follow-up questions

### How would you choose SLIs and SLOs for a new service?

Start from what the user does: for an API, the share of requests that succeed and the share faster than a threshold, measured as close to the user as you can (at the load balancer, not inside the service). Set the SLO a little below what the service already achieves, not at 100%, because 100% leaves no budget for deploys or experiments. Review it after a month of data.

### Logs, metrics or traces: which would you build first?

Metrics with a few SLO alerts, because they tell you that something is wrong at the lowest cost. Then structured logs with a request or trace ID, which are easy to add. Then tracing, which pays off once a request crosses several services. In a single service, logs and metrics are often enough.

### How do you trace through a message queue?

Put the trace context in the message's headers or metadata when producing, and have the consumer start a span linked to it when it processes the message. Because the consumer may run much later and may batch messages, the consumer span is usually a new trace with a *link* to the producer's span rather than a child of it. Also export queue depth and <Term id="consumer-lag">consumer lag</Term> as metrics; see [queues and back pressure](/modules/queues-and-back-pressure).

### How do you keep observability costs under control?

Sample traces (tail-based, keeping errors and slow requests), keep metric labels bounded, log at info level with debug off by default, drop or aggregate noisy logs in the collector, and set retention by value: metrics for months, logs for days to weeks, traces for days. Telemetry spend commonly runs to a meaningful share of infrastructure cost, so it needs a budget like anything else.

### What is the difference between monitoring and observability?

Monitoring watches known failure modes with predefined dashboards and alerts: you decided in advance what to measure. Observability is having rich enough data, with high-cardinality detail in traces and structured logs, to investigate failures you did not predict, by slicing by any field after the fact.

## Go deeper

- [Google SRE workbook, Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/): builds up multi-window, multi-burn-rate alerts step by step, with the 14.4 threshold derived.
- [Dapper, a large-scale distributed systems tracing infrastructure (2010)](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/): the original trace and span design, and why low sampling rates still work.
- [OpenTelemetry, Sampling](https://opentelemetry.io/docs/concepts/sampling/): head-based against tail-based sampling and how to configure each.
- [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/): what to measure in online services, queues and batch jobs, and how to avoid cardinality traps.
