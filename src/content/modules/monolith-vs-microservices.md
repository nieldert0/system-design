---
slug: monolith-vs-microservices
title: Monolith vs microservices vs serverless
section: architecture
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
  - prompt: Which problem do microservices add that a monolith does not have?
    options:
      - Code cannot be split into modules
      - You cannot use a database
      - You cannot scale horizontally
      - Function calls become network calls that can fail or be slow
    correct: 3
    explanation: Every remote call needs timeouts, retries and handling for partial failure.
  - prompt: A two-person startup is building its first product. What is the usual advice?
    options:
      - Write everything in one file
      - Start with 30 microservices
      - Start with a well-structured monolith and split out services when there is a clear reason
      - Use only serverless functions for everything, always
    correct: 2
    explanation: Service boundaries are hard to get right before you understand the domain.
  - prompt: In microservices, why should each service own its data?
    options:
      - Databases are cheap
      - So services stay decoupled; others go through its API instead of its tables
      - So joins are faster
      - It is required by HTTP
    correct: 1
    explanation: A shared database couples services' schemas and deploys back together.
  - prompt: What is a typical downside of serverless functions?
    options:
      - Cold starts add latency, and run time and vendor features are limited
      - You pay for idle servers
      - They cannot scale
      - You must patch the servers yourself
    correct: 0
    explanation: The provider manages servers and scales to zero, which brings cold starts and lock-in.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import MonolithVsMicroservices from '#lib/diagrams/MonolithVsMicroservices.svelte';
</script>

How you split an application into deployable pieces shapes how teams work, how it scales and how it fails.

## What it is

A **<Term id="monolith">monolith</Term>** is one application built and deployed as a single unit. The UI, business logic and data access live in one codebase and usually run in one process. <Src id="wiki-mono" />

**<Term id="microservices">Microservices</Term>** split the application into a suite of small services, each deployed on its own and focused on one business capability. Services talk over the network, usually <Term id="http">HTTP</Term> or <Term id="rpc">RPC</Term>, and each owns its own data. <Src id="primer-ms" /> <Src id="wiki-ms" />

**<Term id="serverless">Serverless</Term>** goes further: you write functions, and the cloud provider runs them on demand, scales them (down to zero) and bills per use. You manage no servers. <Src id="wiki-sls" />

## How it works

**Monolith.** One build, one deploy. Calls between parts are in-process function calls, so they are fast and cannot fail on the network. One database makes transactions simple. You scale by running more copies behind a <Term id="load-balancer">load balancer</Term>. <Src id="wiki-mono" />

**Microservices.** For example, a shop might have separate user, catalog, cart, order and payment services. Clients usually reach them through an API gateway. Each service has its own database, team and release schedule, and finds the others through <Term id="service-discovery">service discovery</Term>. <Src id="primer-ms" /> <Src id="wiki-ms" />

<MonolithVsMicroservices />

**Serverless.** An event (an HTTP request, a new file in <Term id="object-storage">object storage</Term>, a queue message) triggers a function. The provider starts a container, runs the function and may reuse it for later events. Long-lived state lives in managed databases and storage, not in the function. <Src id="wiki-sls" />

## Trade-offs

| | Monolith | Microservices | Serverless |
| --- | --- | --- | --- |
| Deploy | All at once | Per service | Per function |
| Scale | Whole app | Per service | Automatic, per call |
| Calls between parts | In-process | Network | Network or events |
| Transactions | Easy (one DB) | Hard (sagas, events) | Hard |
| Operations | Simple | Heavy: discovery, tracing, many pipelines | Light, but vendor lock-in |
| Watch out for | A big ball of mud, slow builds | A "distributed monolith" | Cold starts, run-time limits |

- **Microservices trade code complexity for operational complexity.** Each call can time out or fail, so you need retries, timeouts, circuit breakers and distributed tracing. <Src id="wiki-ms" />
- **Data consistency gets harder.** No cross-service transactions; use events and <Term id="eventual-consistency">eventual consistency</Term> or sagas. <Src id="wiki-ms" />
- **A modular monolith** (clear internal boundaries, one deploy) keeps most of the benefits with little of the cost, and makes a later split easier.
- **Serverless** is cheap for spiky or low traffic but can cost more than servers at steady high load. <Src id="wiki-sls" />

## Interview tips

- Default to a monolith or a few coarse services for a new product; say why you would split later (team size, different scaling needs, independent release).
- When you draw microservices, show the gateway, service discovery, a database per service, and a queue for async work.
- Mention the cost: network failures, eventual consistency, observability.
- Reach for serverless for spiky, event-driven work such as image thumbnails or webhooks.
