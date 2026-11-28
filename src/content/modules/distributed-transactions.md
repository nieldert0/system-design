---
slug: distributed-transactions
title: Distributed transactions
section: availability
readFirst:
  - relational-and-acid
  - monolith-vs-microservices
  - handling-failure
sources:
  - id: wiki-2pc
    title: Wikipedia, Two-phase commit protocol
    url: https://en.wikipedia.org/wiki/Two-phase_commit_protocol
    license: CC BY-SA 4.0
    use: reworded
  - id: sagas-paper
    title: Garcia-Molina and Salem, Sagas (1987)
    url: https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf
    license: All rights reserved
    use: reworded
  - id: ms-saga
    title: Microsoft Azure Architecture Center, Saga distributed transactions pattern
    url: https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga
    license: CC BY 4.0
    use: reworded
  - id: outbox
    title: Chris Richardson, microservices.io, Transactional outbox
    url: https://microservices.io/patterns/data/transactional-outbox.html
    license: All rights reserved
    use: reworded
  - id: ms-comp
    title: Microsoft Azure Architecture Center, Compensating Transaction pattern
    url: https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: What is the main weakness of two-phase commit?
    options:
      - It cannot handle more than two participants
      - If the coordinator fails after participants vote yes, they are stuck holding locks until it recovers
      - It loses committed data
      - It does not use a log
    correct: 1
    explanation: A participant that voted yes has promised to commit and cannot decide alone. It blocks, holding its locks, until it learns the coordinator's decision.
  - prompt: A saga's step 3 fails after steps 1 and 2 committed. What happens?
    options:
      - The database rolls back steps 1 and 2 automatically
      - Compensating actions for steps 2 and then 1 run, undoing their effects in business terms
      - Nothing; the saga is left half done
      - Step 3 is retried forever
    correct: 1
    explanation: Each local commit is final, so a saga undoes them with new transactions, such as a refund for a charge, in reverse order.
  - prompt: What problem does the transactional outbox solve?
    options:
      - Slow queries
      - The dual write, where a service updates its database and publishes a message, and a crash between the two leaves them out of sync
      - Large messages
      - Encryption of events
    correct: 1
    explanation: Writing the event to an outbox table in the same local transaction as the data means both happen or neither does. A relay publishes the table to the broker afterwards.
  - prompt: Why must saga steps and their compensations be idempotent?
    options:
      - For speed
      - Because messages are delivered at least once, so a step or compensation can run twice
      - Because databases require it
      - They do not need to be
    correct: 1
    explanation: The outbox relay and the broker can both redeliver. A refund that runs twice refunds twice unless it is deduplicated by a key.
  - prompt: In the worked example, why is the order shown to the user as PENDING while the saga runs?
    options:
      - To slow users down
      - Because a saga has no isolation; intermediate states are visible, so the order is not confirmed until every step succeeds
      - Because 2PC is running
      - Because the database is locked
    correct: 1
    explanation: Other readers can see the charge before the reservation. A PENDING state, sometimes called a semantic lock, tells them the outcome is not final.
  - prompt: In the worked example, the inventory reservation fails after the $40 charge. Which order do the compensations run in?
    options:
      - Cancel the order, then refund
      - Refund the payment, then cancel the order
      - Only refund
      - Retry the charge
    correct: 1
    explanation: Compensation runs backwards from the failed step. First undo the payment, then the first step, the order itself.
  - prompt: When is 2PC still a reasonable choice?
    options:
      - Across many independent companies' APIs
      - Inside one database system that runs it internally across its own shards, such as Spanner or CockroachDB
      - For long-running workflows of several days
      - Never
    correct: 1
    explanation: Distributed databases use 2PC internally across their shards, with each participant replicated by consensus so a coordinator failure does not block for long.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import SagaOutboxFlow from '#lib/diagrams/SagaOutboxFlow.svelte';
</script>

A distributed transaction is one business operation whose data lives in more than one database or service. You cannot wrap it in one `BEGIN ... COMMIT`, so you either coordinate the commit across all of them (two-phase commit) or give up atomicity and undo the finished parts when a later one fails (sagas).

## What it is

Here is the problem. In a monolith, placing an order is one database <Term id="transaction">transaction</Term>: insert the order, charge the payment, decrement the stock, commit. If anything fails, the database rolls all of it back. Then the company splits into [microservices](/modules/monolith-vs-microservices): orders, payments and inventory each own their own database. Now "place an order" is three separate commits on three machines. If the payment commits and the inventory service crashes, the customer has paid for an item nobody reserved. If the order service writes the order and then crashes before telling anyone, the order sits there forever.

Only one database can make an <Term id="acid">ACID</Term> promise about its own data. Across several, you have two families of answers:

- **Atomic commit**: make all the databases commit or none of them, using <Term id="two-phase-commit">two-phase commit (2PC)</Term>. Strong, but slow and fragile when the coordinator fails.
- **<Term id="saga">Sagas</Term>**: let each service commit locally, one after another, and if a later step fails, run a <Term id="compensating-transaction">compensating transaction</Term> for each earlier step. Available and loosely coupled, but intermediate states are visible.

Both depend on one more piece: a reliable way for a service to change its data *and* tell others about it, which is the <Term id="transactional-outbox">transactional outbox</Term>.

## How it works

### Two-phase commit

2PC has one **coordinator** and several **participants** (the databases). <Src id="wiki-2pc" />

1. **Prepare.** The coordinator sends "prepare" to every participant. Each one does all the work of the transaction, writes it durably to its <Term id="write-ahead-log">write-ahead log</Term>, keeps its locks, and votes yes ("I promise I can commit") or no.
2. **Commit.** If every participant voted yes, the coordinator writes "commit" to its own log and tells everyone to commit. If any voted no or timed out, it tells everyone to abort.

The weak point is the gap between the phases. A participant that voted yes has given up the right to decide alone; it must wait for the coordinator. If the coordinator crashes after collecting the votes, the participants sit **in doubt**, holding row locks, until it comes back. Other transactions touching those rows queue behind them. That is why 2PC is called a **blocking** protocol. <Src id="wiki-2pc" />

The cost is also steady-state: two round trips, and at least two forced disk writes per participant, while locks are held the whole time. Throughput falls as the number of participants and the latency between them rise.

In practice, 2PC is used **inside** one distributed database, which controls all the participants and makes the coordinator itself fault tolerant by replicating it with [consensus](/modules/consensus-and-leader-election). Spanner and CockroachDB do this across their shards. Across separate services owned by different teams, often with different databases, it is rarely used: the XA standard exists, but few message brokers and almost no HTTP APIs support it.

### Sagas

A saga, from a 1987 paper by Garcia-Molina and Salem, breaks a long transaction into a sequence of local transactions T1, T2, ..., Tn, each with a compensation C1, C2, ..., Cn. If Tk fails, the saga runs C(k−1), ..., C1, in reverse order. <Src id="sagas-paper" />

A compensation is not a rollback. T1 really committed, other people may have seen its effect, and it cannot be erased. The compensation is a new transaction that undoes it in business terms: a refund for a charge, a release for a reservation, a cancellation email for a confirmation email. Some steps cannot be compensated at all (you cannot unsend a parcel), so put those last, after everything that can fail. <Src id="ms-comp" />

There are two ways to coordinate a saga: <Src id="ms-saga" />

- **Choreography.** No central controller. Each service listens for events and reacts: the order service publishes OrderCreated, payment listens and publishes PaymentCaptured, inventory listens and publishes either ItemReserved or ReserveFailed, and so on. Simple for 2 or 3 steps, but the flow is spread across services and hard to see or change.
- **Orchestration.** A saga orchestrator (often part of the order service, or a workflow engine such as Temporal or AWS Step Functions) tells each service what to do and tracks the saga's state in its own database. The flow lives in one place, which is easier to read, test and monitor, at the cost of one more component.

Sagas give up the **I** in ACID: isolation. While a saga is running, other readers can see its partial results. The usual defence is a **semantic lock**: mark records with a state such as PENDING so that readers and other sagas know the outcome is not final.

### The dual-write problem and the outbox

Every saga step does two things: update its own database and publish an event. Doing them as two separate calls is a **dual write**, and it breaks in both orders. Commit then publish: a crash in between loses the event, and the saga stalls. Publish then commit: a crash in between sends an event about a change that never happened.

The transactional outbox fixes this. The service writes the event as a row in an `outbox` table **in the same local transaction** as its data change. Either both are committed or neither is. A separate relay reads the outbox and publishes each row to the broker, marking it sent afterwards. <Src id="outbox" />

The relay can crash after publishing and before marking the row, so it may publish the same event twice. The outbox gives <Term id="at-least-once-delivery">at-least-once delivery</Term>, and every consumer must be idempotent, deduplicating by event ID, as described in [timeouts, retries and idempotency](/modules/handling-failure). The relay is often built with change data capture: a tool such as Debezium reads the database's write-ahead log and turns outbox inserts into Kafka messages, with no polling.

<SagaOutboxFlow />

## Worked example

A shop sells a **$40** item. Placing an order touches three services, each with its own database: orders, payments and inventory. The shop takes **200 orders/s** at peak. Each service is in the same region, about **1 ms** apart, and a forced disk write takes about **2 ms**.

**Step 1, why not 2PC?** With 2PC across the three databases, each order needs a prepare round (1 ms network + 2 ms disk) and a commit round (1 ms + 2 ms), about **6 ms** of lock time on every row it touches, more with a slow participant. The inventory row for a popular item is touched by every order for that item, so only about 1,000 / 6 ≈ **160 orders/s** can go through for that item, below the 200 peak. Worse, if the coordinator crashes, that inventory row stays locked until it recovers. And the payment service calls an external card provider over HTTP, which does not take part in 2PC at all. 2PC is out.

**Step 2, the saga.** An orchestrated saga with three steps:

1. T1, order service: insert order 9001 with status **PENDING**, plus an OrderCreated row in its outbox, in one local transaction. C1 is "set status CANCELLED".
2. T2, payment service: charge $40 with idempotency key `order-9001-charge`, plus a PaymentCaptured outbox row. C2 is "refund $40" with key `order-9001-refund`.
3. T3, inventory service: decrement stock for the item. No compensation needed, because it is the last step that can fail.

Then the order is marked **CONFIRMED** and the confirmation email is sent, the step that cannot be undone, placed last on purpose.

**Step 3, the happy path.** Each step is one local transaction of about 3 ms, plus the broker hop. The whole saga finishes in roughly **20 to 50 ms**, and no lock is held across services. The user sees "order placed, confirming" for that time.

**Step 4, a failure.** For order 9002, payment succeeds, but inventory finds stock is 0 and publishes ReserveFailed. The orchestrator runs compensations backwards: C2 refunds $40 (key `order-9002-refund`), then C1 marks the order CANCELLED. The customer sees "sorry, that item sold out, you have not been charged". The money was briefly captured, which is visible on the card statement as a charge and a refund. If that is unacceptable, reorder the saga: reserve inventory first (easy to release) and charge last, or authorise the card in T2 and capture it only after T3.

**Step 5, a crash.** The payment service commits the charge and the outbox row for order 9003, then crashes before the relay publishes it. When it restarts, the relay finds the unsent row and publishes it. The broker delivers it, the payment service's relay crashes again before marking it sent, and on restart it publishes it a second time. The inventory service receives PaymentCaptured for 9003 twice; it has already recorded event ID `evt-77` in its processed-events table, so the second copy is ignored. Stock is decremented once.

**Step 6, isolation.** During order 9004's saga, a support agent looks up the customer's account and sees a $40 charge for an order that is not yet confirmed. Because the order shows PENDING, the support tool says "being processed" instead of "confirmed". That status is the saga's semantic lock.

## In the real world

- **Google Spanner and CockroachDB.** Both run 2PC internally across shards, and each shard is itself a Paxos or Raft group, so a coordinator's state survives a machine failure and transactions block for an election, not for a human. Spanner adds synchronised clocks (TrueTime) to order transactions globally.
- **Temporal and AWS Step Functions.** Workflow engines used as saga orchestrators. You write the steps and compensations as code (Temporal) or a state machine (Step Functions), and the engine persists progress, retries failed steps with backoff, and runs compensations after a crash.
- **Debezium.** Open-source change data capture. Its outbox event router reads inserts into an outbox table from the PostgreSQL or MySQL log and publishes them to Kafka topics, so services do not need a polling relay.
- **Payments.** Card networks split a payment into authorise and capture. Shops authorise at checkout and capture when the item ships, which is a two-step saga where the compensation for an authorisation is simply a void, with no money moved.

## Trade-offs

| | Two-phase commit | Saga |
|---|---|---|
| Atomicity | All or nothing | Eventually all or compensated |
| Isolation | Yes, locks held until commit | No, intermediate states visible |
| Coordinator failure | Participants block, holding locks | Saga resumes from its log after restart |
| Latency and throughput | Locks across round trips limit throughput | Each step commits locally, no cross-service locks |
| Works with external APIs | Rarely | Yes, if each has an undo action |
| Code complexity | Low for the application | Compensations, idempotency and state tracking for every step |

- **Choreography against orchestration.** Choreography has no central component and suits short flows; orchestration makes long flows visible and testable but adds a service that everything depends on.
- **Avoiding the problem.** Often the best answer is to redraw service boundaries so that data changed together lives in one database. A distributed transaction between two services that are always called together is a sign they should be one.

## Interview tips

- When an operation spans services, say so explicitly, and say whether you use 2PC or a saga and why.
- For a saga, list the steps, each compensation, and which step cannot be undone, and put that step last.
- Name the dual-write problem and solve it with the outbox, then say the consumers are idempotent.
- Mention the states users see (PENDING, CONFIRMED, CANCELLED) so the lack of isolation is handled in the product.

**Common mistakes:**

- Writing to the database and then publishing to Kafka in two calls, with no outbox, and losing events on crashes.
- Designing compensations that are not idempotent, so a redelivered refund refunds twice.
- Putting an irreversible step (sending an email, shipping) in the middle of a saga, where a later failure cannot undo it.
- Proposing 2PC across services that call third-party HTTP APIs, which cannot take part in it.

## Common follow-up questions

### What if a compensation fails?

Retry it, with backoff, until it succeeds, which is why compensations must be idempotent and should be designed to always be possible (a refund of a captured charge always succeeds eventually). If it still fails after many attempts, park the saga in a failed state and alert a human; a <Term id="dead-letter-queue">dead-letter queue</Term> of stuck sagas is normal in payment systems.

### Does three-phase commit fix 2PC's blocking?

In theory it avoids blocking by adding a pre-commit phase, but only under assumptions about timing that real networks break: a partition can still make participants decide differently. Practical systems instead make the coordinator highly available with consensus, as Spanner does.

### How do you keep the outbox table from growing forever?

Delete or archive rows once they are published, for example with a scheduled job that removes sent rows older than a day. With change data capture, the relay reads the log, so rows can be deleted right after insert, in the same transaction, and still be published.

### How do you read data consistently across services during a saga?

You cannot get a consistent snapshot across separate databases. Either query the service that owns the final state (the order status), or build a read model that listens to all the saga's events. That is the idea behind CQRS (command query responsibility segregation): writes go to the owning services, and reads come from a separate view built from their events.

## Go deeper

- [Microsoft: Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga): choreography against orchestration with diagrams, and the countermeasures for missing isolation.
- [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html): the dual-write problem and both relay styles, polling and log tailing.
- [Sagas, Garcia-Molina and Salem (1987)](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf): the original paper, short and clear about why long transactions should not hold locks.
- [Spanner: Google's globally distributed database](https://research.google/pubs/spanner-googles-globally-distributed-database-2/): how 2PC on top of Paxos groups becomes practical at global scale.
