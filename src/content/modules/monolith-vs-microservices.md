---
slug: monolith-vs-microservices
title: Monolith vs microservices vs serverless
section: architecture
upgraded: true
readFirst:
  - performance-vs-scalability
  - api-design
  - reverse-proxies-api-gateways
sources:
  - id: primer-ms
    title: The System Design Primer, Microservices
    url: https://github.com/donnemartin/system-design-primer#microservices
    license: CC BY 4.0
    use: reworded
  - id: wiki-ms
    title: Wikipedia, Microservices
    url: https://en.wikipedia.org/wiki/Microservices
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-mono
    title: Wikipedia, Monolithic application
    url: https://en.wikipedia.org/wiki/Monolithic_application
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-sls
    title: Wikipedia, Serverless computing
    url: https://en.wikipedia.org/wiki/Serverless_computing
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is a monolith?
    options:
      - An app split into many small services
      - One application deployed as a single unit, with all features in one codebase and process
      - A database with one table
      - A function that runs on demand
    correct: 1
    explanation: Every feature ships together; a change to one part redeploys the whole thing.
  - prompt: What is a key benefit of microservices?
    options:
      - Teams can deploy and scale each service independently
      - There is less to monitor
      - Transactions across services are easy
      - Calls between parts are faster
    correct: 0
    explanation: Independent deploys and scaling are the point; the cost is a distributed system.
  - prompt: In microservices, why should each service own its data?
    options:
      - Databases are cheap
      - So services stay decoupled; others go through its API instead of its tables
      - So joins are faster
      - It is required by HTTP
    correct: 1
    explanation: A shared database couples services' schemas and deploys back together.
  - prompt: In the worked example, checkout calls five services in a chain and each is up 99.9% of the time. Roughly how available is checkout?
    options:
      - 99.9%, the same as each service
      - About 99.5%, because the failures multiply (0.999^5)
      - 99.99%, because there are more servers
      - About 95%
    correct: 1
    explanation: A request succeeds only if every hop succeeds, so availabilities multiply. Five nines-of-three become about 99.5%, or roughly 3.6 hours down a month instead of 43 minutes.
  - prompt: In the worked example, why is splitting search out of the monolith a better first move than splitting checkout?
    options:
      - Search has the most code
      - Search needs very different scaling (it uses most of the CPU) and only reads data, so it can be cut out without a cross-service transaction
      - Checkout is never busy
      - Search cannot run in a monolith
    correct: 1
    explanation: A good first service has a clear scaling or team reason and a clean data boundary. Checkout touches orders, stock and payment in one transaction, so splitting it first forces sagas.
  - prompt: A function runs 1,000 times a second, all day, every day. Why might serverless be the wrong choice?
    options:
      - It cannot handle that many calls
      - At steady high load, paying per request and per GB-second costs several times more than a few always-on servers
      - Serverless functions cannot call databases
      - Cold starts happen on every call
    correct: 1
    explanation: Serverless wins on spiky or low traffic because idle costs nothing. Busy all the time, you pay a premium for capacity you could have rented flat.
  - prompt: Two services must both be redeployed together whenever either changes, and they share one database schema. What is this called?
    options:
      - A modular monolith
      - A distributed monolith
      - A service mesh
      - Serverless
    correct: 1
    explanation: It has the network costs of microservices and the coupling of a monolith, the worst of both.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import MonolithVsMicroservices from '#lib/diagrams/MonolithVsMicroservices.svelte';
</script>

How you cut an application into deployable pieces decides how teams ship, how the system scales, and how it breaks. It is also one of the decisions people most often make for fashion rather than for a reason.

## What it is

Here is the problem. A shop starts as one codebase run by five engineers, and that is fine. Three years later there are 120 engineers, the build takes 40 minutes, every release bundles changes from twelve teams, and one bad change to the recommendations widget takes down checkout. Search needs ten times the CPU of everything else, but the only way to give it more is to run more copies of the entire application. The question is where to draw the lines so that teams, scaling and failures stop being tangled together, without paying more than the lines are worth.

There are three broad answers.

A **<Term id="monolith">monolith</Term>** is one application built and deployed as a single unit. The UI, business logic and data access live in one codebase and usually run in one process, against one database. <Src id="wiki-mono" />

**<Term id="microservices">Microservices</Term>** split the application into many small services, each owned by one team, deployed on its own and built around one business capability (users, catalog, cart, orders, payments). Services talk over the network, usually <Term id="http">HTTP</Term> or <Term id="rpc">RPC</Term>, and each owns its own data store; nobody else reads its tables. <Src id="primer-ms" /> <Src id="wiki-ms" />

**<Term id="serverless">Serverless</Term>** goes further: you write functions, and the cloud provider runs them when an event arrives, scales them up and down to zero, and bills per call and per millisecond of run time. You never manage a server. <Src id="wiki-sls" />

Between the first two sits the option many teams should pick first: a **<Term id="modular-monolith">modular monolith</Term>**, one deployable with strict internal boundaries, so that a module can later be lifted out into a service without a rewrite.

## How it works

### Monolith

One build, one deploy, one database. A call from the order code to the stock code is an in-process function call: it takes nanoseconds and cannot time out on the network. Because everything shares one database, "reserve stock, create order, record payment" can be a single <Term id="transaction">transaction</Term> that either fully happens or fully does not. You scale by running more identical copies behind a <Term id="load-balancer">load balancer</Term>, which works well as long as the copies are <Term id="stateless">stateless</Term>. <Src id="wiki-mono" />

The costs show up with size. Builds and test suites slow down, one memory leak or bad deploy takes out every feature, and you cannot give one hot feature more resources without scaling all of them. Without discipline the code becomes a "big ball of mud" where everything calls everything, which is the real thing people are escaping when they move to microservices.

### Microservices

A shop might have separate user, catalog, cart, order and payment services. Clients usually come in through an [API gateway](/modules/reverse-proxies-api-gateways), which routes each path to the right service. Each service has its own database, team and release schedule, and finds the others through [service discovery](/modules/service-discovery) because instances come and go. <Src id="primer-ms" /> <Src id="wiki-ms" />

<MonolithVsMicroservices />

What used to be a function call is now a network call, and that changes the engineering. Every call needs a timeout, retries that are safe to repeat, and a <Term id="circuit-breaker">circuit breaker</Term> so one slow service does not tie up every caller's threads. Debugging a slow request means following it across services with <Term id="distributed-tracing">distributed tracing</Term>. And because there is no transaction across two databases, a business operation that spans services becomes a <Term id="saga">saga</Term>: a sequence of local steps, each with a compensating step (refund, release stock) if a later one fails. The data across services is then only <Term id="eventual-consistency">eventually consistent</Term>, usually kept in sync with events on a [queue or stream](/modules/queues-and-back-pressure). <Src id="wiki-ms" />

### Serverless

An event (an HTTP request, a new file in <Term id="object-storage">object storage</Term>, a queue message, a timer) triggers a function. The provider finds or starts a small execution environment, runs your code, and keeps the environment warm for a while in case another event comes. If none is warm, the first call pays a <Term id="cold-start">cold start</Term>: tens of milliseconds for a small Node or Python function, up to seconds for a large Java one. Functions keep no state between calls, so long-lived state lives in managed databases, caches and storage. <Src id="wiki-sls" />

### Moving from one to another

Nobody should rewrite a monolith into fifty services in one go. The usual path is the <Term id="strangler-fig">strangler fig</Term> pattern: put a gateway or proxy in front of the monolith, build one new service, route its paths to it, and repeat, until the old code is either gone or small enough to keep. Each step is reversible, and the system keeps working throughout.

## Worked example

A shop serves **3,000 requests a second** at peak from one monolith on 20 servers, each with 8 cores. Profiling shows search uses **60% of all CPU** even though it is only 30% of requests, and its traffic is spiky around sales.

**Step 1, scaling cost.** To handle a sale that triples search traffic, the monolith has to add servers for everything. Search alone needs 0.6 × 20 = 12 servers' worth of CPU today, so tripling it needs 24 more servers' worth, and because every copy runs every feature you add 24 full copies. As a separate service, search adds 24 search servers and nothing else; the other 8 servers' worth of work stays put. That is a real reason to split.

**Step 2, the price of the split.** Now look at checkout if it were also split out. One checkout calls cart, stock, pricing, payment and order in sequence. In the monolith those are function calls, so their overhead is negligible. As services, each hop adds around 1 to 2 ms inside one data centre, so about 5 to 10 ms more per checkout, which is acceptable. Availability is the bigger cost. A request succeeds only if all five services answer, so if each is up 99.9% of the time, checkout is up about 0.999⁵ ≈ **99.5%**. That moves from about 43 minutes of downtime a month to about **3.6 hours**, unless you add retries, timeouts and fallbacks (see [Availability patterns](/modules/availability-patterns)).

**Step 3, consistency.** Checkout in the monolith is one transaction. Split across stock, payment and order services, it becomes a saga: reserve stock, charge the card, create the order. If creating the order fails after the charge, a compensating step refunds the card. For a few seconds a customer could see a charge without an order, and the code to handle every failure in between is real work.

**Step 4, the decision.** Split out search first: it has a clear scaling reason, it mostly reads (from its own index, fed by catalog change events), and it needs no cross-service transaction. Keep checkout inside the monolith, organised as a module, until a team or scaling reason forces the issue.

**Step 5, the serverless side job.** The shop also makes thumbnails for uploaded product photos, about **1 million a month**, at 512 MB of memory for 1 second each. On AWS Lambda's list price (roughly $0.20 per million requests plus about $0.0000167 per GB-second), that is 1,000,000 × 0.5 GB × 1 s = 500,000 GB-seconds ≈ **$8.30 a month**, plus $0.20 for the requests. No server sits idle waiting for uploads. Compare a function serving **1,000 requests a second around the clock** at 100 ms and 512 MB: about 2.6 billion calls and 130 million GB-seconds a month, around **$2,700 a month**, far more than a few always-on servers that could handle the same load. Serverless is a good fit for spiky, event-driven work and a poor fit for steady heavy traffic.

## In the real world

- **Shopify** runs one of the largest Ruby on Rails monoliths as a modular monolith. They split the code into components with enforced boundaries using their open-source tool Packwerk, which fails the build when one component reaches into another's private code. They kept one deploy and gained most of the team independence.
- **Amazon Prime Video**'s audio and video quality monitoring team wrote in 2023 that moving from AWS Step Functions and Lambda to a single process on EC2 cut that system's infrastructure cost by about 90%, because the serverless design passed every video frame through S3 between functions. The knob that mattered was data transfer between steps, not compute.
- **Segment** moved from more than 140 small per-destination services back into one service in 2018. The many services had near-identical code, each with its own queue and scaling settings, and a shared library change meant deploying all of them. It is the standard story of a <Term id="distributed-monolith">distributed monolith</Term>.
- **AWS Lambda** has the knobs interviewers ask about: memory from 128 MB to 10,240 MB (CPU scales with it), a default timeout of 3 seconds and a maximum of 15 minutes, a default regional concurrency limit of 1,000 simultaneous executions, and *provisioned concurrency* to keep environments warm and hide cold starts, at the price of paying for them while idle.

## Trade-offs

| | Monolith | Microservices | Serverless |
| --- | --- | --- | --- |
| Deploy | All at once | Per service | Per function |
| Scale | Whole app | Per service | Automatic, per call |
| Calls between parts | In-process | Network | Network or events |
| Transactions | Easy (one DB) | Hard (sagas, events) | Hard |
| Operations | Simple | Heavy: discovery, tracing, many pipelines | Light, but vendor lock-in |
| Cost shape | Flat | Flat, plus platform overhead | Per use; cheap idle, pricey busy |
| Watch out for | A big ball of mud, slow builds | A distributed monolith | Cold starts, run-time limits |

- **Microservices trade code complexity for operational complexity.** You need retries, timeouts, circuit breakers, tracing, a deploy pipeline per service, and someone who runs the platform. <Src id="wiki-ms" />
- **Team size is the strongest signal.** Microservices mostly solve an organisational problem: many teams stepping on each other in one codebase. With one or two teams, the overhead rarely pays back.
- **A modular monolith** keeps one deploy and one database while giving clear ownership, and makes a later split much easier because the boundaries already exist.
- **Serverless** removes server management and idle cost, but limits run time, adds cold starts, and ties you to one provider's event sources and APIs. <Src id="wiki-sls" />

## Interview tips

- Default to a monolith or a few coarse services for a new product, and say what would make you split later: team count, very different scaling needs, a different release cadence, or isolation of something risky such as payments.
- When you draw microservices, show the gateway, service discovery, a database per service, and a queue for async work, and mention timeouts and retries on the arrows.
- Translate the cost into numbers, as in the worked example: chained availability, added latency per hop, and what a saga's compensating step is.
- Reach for serverless for spiky, event-driven work such as thumbnails, webhooks or nightly jobs, and say when you would not.

**Common mistakes:**

- **Splitting by technical layer** (a "database service", a "UI service") instead of by business capability, so every feature change touches every service.
- **Sharing one database between services.** Any schema change couples their deploys again, and you get a distributed monolith.
- **Chatty services**: a page that makes 30 sequential internal calls, each adding latency and another chance to fail.
- **Choosing microservices for a small team** because big companies use them, then spending most of the time on infrastructure rather than product.

## Common follow-up questions

### How do you decide where to draw service boundaries?

Around business capabilities that change together and own their own data, often called bounded contexts in domain-driven design. A good test is whether a typical feature can be built and shipped by changing one service. If most features need three services to change in lockstep, the boundary is wrong. Team structure matters too: a service should be owned by one team.

### How do you do a transaction across services?

You mostly do not. Two-phase commit across services is slow and fragile, so most systems use a saga: each service commits its local step and publishes an event, and if a later step fails, earlier steps run compensating actions. To avoid losing events between the database write and the publish, write the event into an outbox table in the same local transaction and have a relay publish it.

### How do services find and call each other?

Through [service discovery](/modules/service-discovery): instances register in a registry, or a platform such as <Term id="kubernetes">Kubernetes</Term> tracks them, and callers look up a healthy instance by name. Synchronous calls go over HTTP or gRPC with timeouts; anything that does not need an answer right away goes through a [message queue](/modules/queues-and-back-pressure) so a slow consumer cannot slow the caller.

### When would you move back from microservices to a monolith?

When services are always deployed together, share data, or are so small that the network and operational cost outweigh the independence, as at Segment. Merging them back is a legitimate fix, not a failure.

### How do you handle cold starts in serverless?

Keep functions small, choose a fast-starting runtime, initialise clients outside the handler so warm calls reuse them, and for latency-sensitive paths pay for pre-warmed capacity (Lambda provisioned concurrency). If the path must always answer in a few milliseconds, a long-running service may simply fit better.

## Go deeper

- [Martin Fowler and James Lewis, Microservices](https://martinfowler.com/articles/microservices.html): the 2014 article that defined the term and its characteristics.
- [Martin Fowler, MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html): why most successful microservice systems started as monoliths.
- [Shopify, Deconstructing the monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity): how a very large codebase got team boundaries without splitting the deploy.
- [AWS Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html): the memory, timeout and concurrency limits that shape a serverless design.
