---
slug: event-driven-architecture
title: Event-driven architecture
section: architecture
readFirst:
  - pub-sub-and-event-streaming
  - monolith-vs-microservices
sources:
  - id: fowler-eda
    title: Martin Fowler, What do you mean by "Event-Driven"?
    url: https://martinfowler.com/articles/201701-event-driven.html
    license: All rights reserved
    use: reworded
  - id: fowler-es
    title: Martin Fowler, Event Sourcing
    url: https://martinfowler.com/eaaDev/EventSourcing.html
    license: All rights reserved
    use: reworded
  - id: fowler-cqrs
    title: Martin Fowler, CQRS
    url: https://martinfowler.com/bliki/CQRS.html
    license: All rights reserved
    use: reworded
  - id: ms-saga
    title: Microsoft Azure Architecture Center, Saga distributed transactions pattern
    url: https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: What is the difference between an event and a command?
    options:
      - There is none
      - An event states a fact that already happened and has any number of listeners; a command asks one specific receiver to do something and can be rejected
      - Commands are asynchronous and events are synchronous
      - Events always carry the full entity
    correct: 1
    explanation: OrderPlaced is a fact; ChargeCard is a request addressed to one service.
  - prompt: In choreography, who decides what happens after an order is placed?
    options:
      - A central orchestrator
      - Each service, by reacting to the events it subscribes to
      - The database
      - The API gateway
    correct: 1
    explanation: There is no central coordinator; the flow emerges from subscriptions.
  - prompt: What does event sourcing store as the source of truth?
    options:
      - The latest state of each entity
      - The full ordered sequence of events for each entity, from which current state is derived
      - Only snapshots
      - Logs for debugging
    correct: 1
    explanation: State is a fold over the events; snapshots are an optimisation.
  - prompt: In the worked example, an account has 20,000 events and a snapshot every 500 events. How many events must be replayed to load it?
    options:
      - 20,000
      - At most 499, after loading the latest snapshot
      - 500 snapshots
      - None
    correct: 1
    explanation: Load the snapshot at event 20,000 (or the last multiple of 500) and apply only the events after it.
  - prompt: The read model lags the write side by 800 ms. A user places an order and the "my orders" page does not show it. What is a reasonable fix?
    options:
      - Make every read go through event replay
      - Return the new order's ID from the command and have the client show it optimistically or read that one order from the write side until the projection catches up
      - Remove CQRS
      - Make projections synchronous across all services
    correct: 1
    explanation: Read-your-writes is solved locally for the user who wrote; everyone else tolerates the lag.
  - prompt: The saga has five steps and the business wants one place to see which step each order is on and to change the order of steps. Which style fits?
    options:
      - Choreography
      - Orchestration, with a coordinator that tracks each order's state
      - Two-phase commit
      - Polling
    correct: 1
    explanation: Orchestration centralises the flow, which helps visibility and change once the flow grows.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import EventChoreographyFlow from '#lib/diagrams/EventChoreographyFlow.svelte';
</script>

In an event-driven architecture, services announce facts ("an order was placed") and other services react, instead of calling each other directly. That decouples teams and makes it easy to add new reactions, but it moves complexity into ordering, duplicates, eventual consistency, and seeing what the system actually did.

## What it is

Here is the problem. An order service calls payments, then inventory, then shipping, then email, each over HTTP. Checkout latency is the sum of four calls. If email is down, the order fails even though email does not matter for the order. When the loyalty team wants to award points, they have to get the order team to add a fifth call. Every new feature is a change to the busiest service, and a slow downstream service slows checkout.

**Event-driven architecture** turns this around. The order service records the order and publishes an **event**, **OrderPlaced**, to a broker such as Kafka or SNS. Payments, inventory, shipping, email, and loyalty each subscribe and react on their own time. The order service no longer knows who they are. <Src id="fowler-eda" />

The phrase covers several different patterns, and mixing them up is the most common source of confusion. Martin Fowler lists four: <Src id="fowler-eda" />

1. **Event notification.** The event says something happened and carries little data ("order 7731 placed"); receivers call back if they need more.
2. **Event-carried state transfer.** The event carries the data receivers need (items, address, total), so they never call back and can keep their own copy.
3. **<Term id="event-sourcing">Event sourcing</Term>.** The events are the database: the stored history of events is the source of truth, and current state is computed from it.
4. **<Term id="cqrs">CQRS</Term>.** Separate models for writes and reads, often fed by events.

This module builds on [pub/sub and event streaming](/modules/pub-sub-and-event-streaming), which covers the broker side: topics, partitions, consumer groups, and replay.

## How it works

### Events versus commands

An **event** is a fact in the past tense: OrderPlaced, PaymentCaptured, StockReserved. It cannot be rejected, because it already happened, and the publisher does not care who listens. A **command** is a request in the imperative: ChargeCard, ReserveStock. It is addressed to one receiver, which may refuse it. <Src id="fowler-eda" />

The distinction matters because it decides the direction of coupling. If the order service publishes "SendConfirmationEmail", it is still deciding what email does, just over a queue. If it publishes "OrderPlaced", the email team decides what to do. Use commands where one service genuinely tells another to act, and events where you are announcing.

### Choreography and orchestration

Many business flows span several services, such as charge the card, reserve stock, then book a courier. Each step has its own database, so there is no single transaction across them. The usual answer is a <Term id="saga">saga</Term>: a sequence of local transactions, where each failure triggers **compensating** steps that undo earlier work (refund the card) rather than a rollback. There are two ways to coordinate one. <Src id="ms-saga" />

- **<Term id="choreography">Choreography</Term>.** No coordinator. Each service listens for events and publishes its own. Payments hears OrderPlaced and publishes PaymentCaptured; inventory hears PaymentCaptured and publishes StockReserved. Easy to start and fully decoupled, but the flow lives nowhere: to know what happens after OrderPlaced you must read every subscriber.
- **<Term id="orchestration">Orchestration</Term>.** A coordinator (a service or a workflow engine) holds the state of each order and sends commands: "payments, charge", then "inventory, reserve". Each service replies with an event. The flow is in one place, easy to change and to monitor, at the cost of a central component that knows every step.

A common rule of thumb: choreography for two or three steps, orchestration once a flow has many steps, branches, or timeouts.

<EventChoreographyFlow />

### Event sourcing

In a normal database, an account row says "balance: 120". In an event-sourced system, the account is stored as its events: Opened, Deposited 100, Deposited 50, Withdrew 30. The balance, 120, is computed by replaying them in order. Events are appended and never updated. <Src id="fowler-es" />

This gives you a perfect audit log, the ability to answer "what was the balance on 3 March?", and the ability to build new views from history later. The costs: loading an entity means replaying its events, so long-lived entities need periodic **snapshots** (store the computed state every N events and replay only the tail), and the event schema can never really change, because old events stay forever and code must still read them.

Writes need a check to stay consistent. Each append says which version it expects ("append Withdrew 30 if this account is at version 4"), and the store rejects it if someone else appended version 5 first. This is optimistic concurrency, the same idea as compare-and-set.

### CQRS

Command Query Responsibility Segregation means using one model for writes (validate the command, append events or update normalised tables) and separate models for reads, shaped for each screen. <Src id="fowler-cqrs" />

**Projections** read the event stream and update read models: a denormalised "my orders" table, a search index, a monthly totals table. Each can live in whatever store suits it. Because projections run after the write, read models are [eventually consistent](/modules/consistency-patterns): there is a gap, usually milliseconds to seconds, before a write is visible on the read side. A projection that has a bug can be fixed and rebuilt from offset 0.

CQRS does not require event sourcing, and event sourcing does not strictly require CQRS, but they are often paired, since an event log is hard to query directly.

### Publishing reliably

A service that writes to its database and then publishes to Kafka can crash between the two, leaving the order saved but the event lost. The fix is the <Term id="transactional-outbox">transactional outbox</Term>: write the event into an outbox table in the same database transaction, and let a relay or change data capture tool publish it. Consumers then get each event at least once, so every handler must be idempotent, for example by recording processed event IDs in the same transaction as its own update.

## Worked example

A shop runs checkout as a choreographed saga across three services: orders, payments, and inventory. Peak load is **1,000 orders per second**.

**Step 1, the happy path.** The order service writes the order (status PENDING) and an outbox row in one transaction, about 5 ms. The relay publishes OrderPlaced to Kafka within about 100 ms. Payments charges the card through the card network, about 300 ms, and publishes PaymentCaptured. Inventory reserves stock, about 20 ms, and publishes StockReserved. The order service hears it and marks the order CONFIRMED. End to end that is roughly 0.5 seconds, but checkout itself returns after the first 5 ms with "order received". In the call-chain version, the user waited for all of it, and any one service being down failed the order.

**Step 2, a failure.** For 2% of orders, inventory finds the item out of stock, so 20 orders per second. It publishes StockRejected. Payments has already captured the money, so it must compensate: it listens for StockRejected and issues a refund, then publishes PaymentRefunded. The order service marks the order CANCELLED. There is a window of about a second when money was taken for an order that will be cancelled; the business has to accept that or reserve stock before charging (reorder the saga).

**Step 3, a duplicate.** Inventory crashes after reserving stock but before committing its Kafka offset. On restart it reads PaymentCaptured for order 7731 again. Because it stored "processed event e-889" in the same transaction as the reservation, it sees the duplicate and skips it. Without that, it would reserve two units.

**Step 4, event sourcing the wallet.** Customers also have a store-credit wallet, event sourced. A heavy user's wallet has **20,000 events**. Replaying them at, say, 1 µs each takes 20 ms, too slow on every request. With a snapshot every 500 events, loading means reading one snapshot and at most 499 events, under 1 ms.

**Step 5, the read side.** The "my orders" page reads from a projection in a separate database. Its lag is normally **about 800 ms**. A user who places an order and immediately opens the page would not see it. The fix is local: the checkout response includes the order ID, and the client shows it as "processing" until the projection includes it. Other users never notice the lag.

**Step 6, visibility.** Support asks "why is order 7731 stuck?". With choreography, the answer is spread across three services' logs. Tagging every event with the order ID and a trace ID, and using [distributed tracing](/modules/observability), makes the flow searchable. When the flow grows to six steps with timeouts ("cancel if the courier is not booked in 30 minutes"), the team moves to an orchestrator that records each order's step in one table.

## In the real world

- **Kafka with the outbox via Debezium.** A common stack: services write outbox rows, Debezium reads the database's change log and publishes to Kafka topics, and consumers are idempotent by event ID.
- **Temporal and AWS Step Functions.** Workflow engines for orchestration. Temporal keeps a durable history of each workflow and replays it to rebuild state after a crash; Step Functions defines the flow as a state machine with built-in retries and timeouts per step.
- **EventStoreDB (now Kurrent).** A database built for event sourcing, with a stream per entity and an expected-version check on every append for optimistic concurrency.
- **Amazon EventBridge.** A managed event bus with rules that route events by their content to targets, and a schema registry; good for choreography across AWS services and SaaS sources.

## Trade-offs

- **Decoupling against visibility.** Adding a consumer is free, but the end-to-end flow is no longer in any one place. Tracing and event catalogues become mandatory.
- **Availability against consistency.** Checkout succeeds while downstream services are down, but the system is eventually consistent and needs compensations instead of rollbacks.
- **Event sourcing gives history, and costs simplicity.** Audits and time travel are free; schema changes, snapshots, and GDPR deletion (you cannot delete an event, so you encrypt personal data and delete the key) are hard.
- **CQRS gives fast reads, and costs lag.** Each read model is tuned for its screen, at the cost of replication lag and more moving parts.

## Interview tips

- Use events when one action triggers several independent reactions or when you need resilience to slow downstream services. Use plain calls when the caller needs the answer to continue.
- Name your events in the past tense and say whether they carry state.
- When a flow spans services, say "saga", and say whether it is choreographed or orchestrated, and why.
- Always mention the outbox for publishing and idempotent consumers for receiving.

**Common mistakes:**

- Calling a command an event ("SendEmail" on a topic) and recreating the coupling.
- Using event sourcing for a whole system when only one area (money, inventory) needs history.
- Forgetting the compensating step for each saga step that has a side effect.
- Ignoring read-your-writes: the user who just wrote sees stale read models.

## Common follow-up questions

### How do you keep events in order?

Only where it matters, which is usually per entity. Key the topic by order ID or account ID so all events for one entity go to one partition in order. Global order across entities is rarely needed and very expensive.

### How do you change an event's schema?

Treat events as a public API. Add optional fields only, never change the meaning of an existing field, and use a schema registry to reject incompatible changes. For a breaking change, publish a new event version alongside the old one until all consumers move. Event-sourced systems also use **upcasters** that convert old stored events to the new shape when they are read.

### How do you delete personal data from an event-sourced system?

You do not rewrite events. Store personal fields encrypted with a key per user, and delete the key on a deletion request ("crypto-shredding"). The events stay, but the personal data in them is unreadable.

### Choreography or orchestration for a 7-step onboarding flow?

Orchestration. With seven steps, branches, and timeouts, choreography spreads the logic across seven services and makes it hard to answer "where is this user stuck?". An orchestrator holds each instance's state, retries each step, and runs compensations in order.

### Is event-driven the same as asynchronous messaging?

No. You can send commands asynchronously through a queue, which is messaging but not event-driven. Event-driven means the publisher announces facts and does not decide who reacts.

## Go deeper

- [Martin Fowler, What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html): the four patterns that hide behind the phrase and when each fits.
- [Microsoft, Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga): choreography and orchestration compared, with compensating transactions.
- [Martin Fowler, Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html): the original description, with snapshots and replay.
- [Microservices.io, Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html): why publishing after a commit is unsafe and how the outbox fixes it.
