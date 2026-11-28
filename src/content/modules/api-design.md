---
slug: api-design
title: 'API design: REST, gRPC and GraphQL'
section: communication
upgraded: true
readFirst:
  - http-https-tls
sources:
  - id: primer
    title: The System Design Primer, RPC and REST
    url: https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc
    license: CC BY 4.0
    use: reworded
  - id: wiki-graphql
    title: Wikipedia, GraphQL
    url: https://en.wikipedia.org/wiki/GraphQL
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-grpc
    title: Wikipedia, gRPC
    url: https://en.wikipedia.org/wiki/GRPC
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: REST is focused on exposing what?
    options:
      - Behaviours
      - Data, as resources identified by URIs
      - Database tables directly
      - Binary streams only
    correct: 1
    explanation: RPC exposes behaviours (verbs like signup or transfer); REST exposes resources (nouns like /persons/1234).
  - prompt: Why is gRPC popular for internal service-to-service calls?
    options:
      - Browsers support it natively everywhere
      - It is fast, with compact binary messages over HTTP/2 and generated typed clients
      - It needs no schema
      - It is easier to cache on CDNs
    correct: 1
    explanation: Protobuf schemas and HTTP/2 make it efficient and type-safe; public APIs still favour REST because every client can speak JSON over HTTP.
  - prompt: What problem does GraphQL mainly solve?
    options:
      - Encryption
      - Over- and under-fetching; the client asks for exactly the fields it needs in one request
      - Database sharding
      - DNS lookups
    correct: 1
    explanation: A REST screen often needs several round trips or receives fields it never uses.
  - prompt: In the worked example, the home screen makes 22 sequential calls at 150 ms per mobile round trip. Roughly how long until the screen can render?
    options:
      - 150 ms
      - About 300 ms
      - About 3 seconds
      - About 30 seconds
    correct: 2
    explanation: 22 sequential round trips × 150 ms ≈ 3.3 s. A single aggregated endpoint or a GraphQL query brings it back to about one round trip.
  - prompt: A feed has 10 million rows and a client asks for page 50,000 with OFFSET pagination at 20 rows per page. Why is that slow, and what fixes it?
    options:
      - The database must read and discard about a million rows; a compound cursor (WHERE (created_at, id) < (:ts, :id)) jumps straight to the right place in the index
      - JSON is slow; switch to protobuf
      - The page is too small; return 1,000 rows
      - OFFSET is fast; the network is the problem
    correct: 0
    explanation: OFFSET 999,980 still walks those rows. A cursor turns it into an index seek, and new inserts no longer shift pages.
  - prompt: A client retries POST /payments after a timeout, but the first request had actually succeeded. With idempotency keys, what does the second request get?
    options:
      - A second charge
      - A 409 error and no information
      - The stored response of the first request, with no new charge
      - A 500
    correct: 2
    explanation: The server finds the key, sees it already finished, and replays the saved result. The client cannot tell the difference, which is the point.
  - prompt: You want to rename the field name to full_name in a public API. What is the safe sequence?
    options:
      - Rename it in place and announce it
      - Add full_name alongside name, mark name deprecated, watch its usage fall to zero, then remove it (or remove it only in /v2)
      - Remove name first so clients notice quickly
      - Change the meaning of name instead
    correct: 1
    explanation: Additive changes never break old clients; removal waits for traffic data or a new major version.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RestVsGraphqlFlow from '#lib/diagrams/RestVsGraphqlFlow.svelte';
</script>

An API is the contract between a client and a service. You choose a style (REST, RPC, or GraphQL), and then you get the details right that every interviewer probes: pagination, retries, errors, and how the contract changes without breaking anyone.

## What it is

Here is the problem. A mobile app, a web app, three partner companies, and twenty internal services all talk to your order system. If each of them reaches into its database, or calls whatever function happens to exist, then every schema change breaks somebody, a retried request charges a customer twice, and a list endpoint that returned 50 rows last year now returns 400,000 and times out. An API fixes this by putting a stable, deliberately designed contract between the callers and the code: what you can ask for, in what shape, what errors mean, and how it is allowed to evolve.

There are three common styles for that contract.

**<Term id="rest">REST</Term>** models the system as *resources* (nouns) with URLs, such as `/persons/1234` or `/persons/1234/items`, and uses the standard <Term id="http">HTTP</Term> methods as the verbs: GET to read, POST to create, PUT or PATCH to change, DELETE to remove. Each request carries everything the server needs, so the server keeps no per-client session between calls (it is <Term id="stateless">stateless</Term>), and responses can be cached by URL. <Src id="primer" />

**<Term id="rpc">RPC</Term>** (remote procedure call) models the system as *actions*. The client calls something that looks like a local function, `CreateOrder(...)` or `TransferFunds(...)`, and a library turns it into a network message. **<Term id="grpc">gRPC</Term>** is the most common modern RPC framework: you describe services and messages in a <Term id="protobuf">Protocol Buffers</Term> schema, generate client and server code in each language, and calls travel as compact binary over HTTP/2, which also supports streaming in both directions. <Src id="primer" /> <Src id="wiki-grpc" />

**<Term id="graphql">GraphQL</Term>** exposes one endpoint and a typed schema of everything that can be fetched. The client sends a query naming exactly the fields it wants, across related objects, and gets back exactly that shape in one response. <Src id="wiki-graphql" />

<RestVsGraphqlFlow />

None of these is "best". REST is the common language of public APIs, gRPC is the usual choice between your own services, and GraphQL earns its complexity when many different clients need different slices of nested data. APIs are often placed behind an API gateway; see [Reverse proxies and API gateways](/modules/reverse-proxies-api-gateways) for that layer.

## How it works

### REST in practice

A RESTful interface comes down to four habits. <Src id="primer" />

- **Identify resources by URL.** The same URL names the same thing regardless of what you do to it.
- **Act with methods, headers, and body.** The HTTP method says what you are doing; headers carry metadata such as auth and caching; the body carries the representation.
- **Use status codes for errors.** 400 for a malformed request, 401 for missing credentials, 403 for forbidden, 404 for not found, 409 for a conflict, 429 for too many requests, 5xx for server faults. Add a JSON body with a machine-readable error code and a human message.
- **Link to related resources.** The formal name is HATEOAS (hypermedia as the engine of application state): responses include URLs for what the client can do next. Few APIs go all the way, but returning links to related resources is cheap and helpful.

The same operations look like this in each style: <Src id="primer" />

| Operation | RPC | REST |
|---|---|---|
| Signup | POST /signup | POST /persons |
| Read a person | GET /readPerson?personid=1234 | GET /persons/1234 |
| Read a person's items | GET /readUsersItemsList?personid=1234 | GET /persons/1234/items |
| Update an item | POST /modifyItem | PUT /items/456 |
| Delete an item | POST /removeItem | DELETE /items/456 |

### gRPC in practice

A `.proto` file is the contract. Each field has a number, and the wire format sends the number instead of the name, so messages are small and parsing is fast. Because fields are identified by number, you can add new fields freely and old clients simply ignore them; what you must never do is reuse or renumber a field. gRPC calls also carry a **deadline**: the client says "I need an answer within 300 ms", and that deadline is passed down to every service the call fans out to, so nobody keeps working on a request whose caller has already given up. <Src id="wiki-grpc" />

The catch is the browser. Browsers cannot speak raw gRPC, so public web clients need a translation layer such as gRPC-Web or a REST gateway in front.

### GraphQL in practice

The server defines types (`User`, `Order`) and a *resolver* function for each field that knows how to fetch it. A query like "this user's name and their last 20 orders with each order's total" runs the user resolver once and the orders resolver once. The trap is the <Term id="n-plus-one">N+1 query problem</Term>: if the `total` resolver hits the database separately for each order, one GraphQL query becomes 22 database queries. The standard fix is a batching layer (DataLoader in JavaScript) that collects all the IDs requested in one pass and fetches them in a single query. <Src id="wiki-graphql" />

### Pagination

Never return an unbounded list; a list that is small at launch grows. There are two ways to page.

- **Offset pagination** (`?offset=200&limit=50`) is easy to build and lets a user jump to page 9. But the database still reads and throws away every skipped row, so deep pages get slower and slower, and if rows are inserted while someone is paging, items shift between pages and get skipped or shown twice.
- **<Term id="cursor-pagination">Cursor pagination</Term>** (`?after=eyJpZCI6OTk5fQ&limit=50`) returns an opaque token that encodes where the last page ended, usually the sort key of its last row. The next query is `WHERE id < 999 ORDER BY id DESC LIMIT 50`, which is a direct seek in the [index](/modules/indexes-and-sql-tuning), equally fast on page 1 and page 50,000, and stable while new rows arrive.

### Idempotency and retries

Networks time out, and when they do the client cannot tell whether the request failed or only the response was lost. So clients retry, and the API must make retries safe. GET, PUT, and DELETE are idempotent by definition (doing them twice leaves the same state as doing them once); POST is not. For any POST with a side effect, the client generates a unique <Term id="idempotency-key">idempotency key</Term> and sends it in an `Idempotency-Key` header. The server records the key with the response it produced, and any repeat of that key gets the stored response instead of running again.

### Versioning and evolution

Additive changes (a new optional field, a new endpoint) are safe, because well-written clients ignore what they do not know. Removing a field, renaming it, changing its type, or changing what it means is a breaking change. Those go into a new version, either in the path (`/v2/orders`) or in a header, and the old version keeps running until its traffic has gone.

## Worked example

You are designing the API for a shop's mobile home screen. It shows the user's name and avatar plus their **20 most recent orders**, each with status and total. Mobile round trips cost about **150 ms**; the backend answers each call in about 20 ms.

**Step 1, naive REST.** The app calls `GET /users/42` (one round trip), then `GET /users/42/orders?limit=20`, which returns only order IDs, then `GET /orders/:id` for each of the 20. If the app does them one after another, that is 22 round trips × 150 ms ≈ **3.3 seconds** before the screen renders. Even firing the 20 order calls in parallel leaves 3 sequential round trips (≈ 450 ms) plus 20 requests' worth of radio and battery. Meanwhile each order response returns 60 fields, and the screen uses 3. This is under-fetching (too many calls) and over-fetching (too much data per call) at once.

**Step 2, fix it in REST.** Make the list endpoint return what lists need: `GET /users/42/orders?limit=20&fields=id,status,total` returns the 20 summaries in one response of about 2 KB instead of 20 × 4 KB. Add a small "backend for frontend" endpoint, `GET /home`, that returns profile and orders together. Now it is **one round trip, about 170 ms**. The cost is that every new screen tends to want its own endpoint.

**Step 3, the same screen in GraphQL.** One query asks for the user's `name` and `avatarUrl` and `orders(first: 20)` with `id status total`. One round trip, exactly the fields needed. But on the server, naive resolvers run 1 user query + 1 orders query + 20 queries for order totals = **22 database queries** (the N+1 problem). With DataLoader batching the 20 total lookups into one `WHERE order_id IN (...)`, it drops to **3 queries**.

**Step 4, the retry.** The user taps "Pay". The app sends `POST /payments` with `Idempotency-Key: 7f3c...` and the server charges the card, but the response is lost when the phone switches from Wi-Fi to LTE. After a 10 s timeout the app retries with the same key. The server looks up `7f3c...`, finds a completed record, and returns the original `201 Created` with the same payment ID. The customer is charged **once**. Without the key the server would have seen two identical, legitimate-looking POSTs and charged twice.

**Step 5, the deep page.** A support tool lists all 10 million orders, 20 per page, with offset pagination. Page 50,000 means `OFFSET 999980`: the database walks almost a million index entries to return 20. Switching to a cursor makes every page a single index seek, a few milliseconds whatever the depth. The cursor must be unique, though: many orders share a `created_at`, and a timestamp-only cursor skips or repeats them at a page boundary. So encode both the timestamp and the ID of the last row, and query `WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC LIMIT 20`, backed by an index on `(created_at, id)`.

## In the real world

- **Stripe** is the reference REST API. Every POST accepts an `Idempotency-Key` header, and Stripe keeps keys for 24 hours, replaying the original status code and body for repeats. Lists use cursor pagination with `starting_after` and `limit` (default 10, maximum 100). Versions are dated (for example `2024-06-20`), pinned per account, and selectable per request with the `Stripe-Version` header, so Stripe can ship breaking changes without breaking anyone who has not opted in.
- **Google APIs** are designed in protobuf first and exposed both as gRPC and as REST/JSON through a transcoding layer. Their API design guide sets conventions such as standard methods (`Get`, `List`, `Create`, `Update`, `Delete`), `page_size` and `page_token` for pagination, and field masks for partial updates.
- **gRPC** itself sets no deadline by default, which means a call can wait forever, so the documentation tells you to set one on every call. Received messages are capped at **4 MB** by default (`grpc.max_receive_message_length`), a limit that surprises people sending large payloads.
- **GitHub** runs both a REST API and a GraphQL API. The GraphQL API limits clients by computed query *cost* rather than request count, 5,000 points an hour for a user, and rejects queries that could return more than 500,000 nodes, which is how a public GraphQL API stops one query from scanning the world.

## Trade-offs

| | REST | gRPC | GraphQL |
|---|---|---|---|
| Best for | Public APIs, simple CRUD | Internal service calls | Many clients, nested data |
| Payload | JSON, human-readable | Binary protobuf, compact | JSON, exact shape |
| Contract | OpenAPI, optional | `.proto`, required and generated | Typed schema, required |
| HTTP caching | Easy, by URL | Hard | Hard (one POST endpoint) |
| Browser support | Native | Needs gRPC-Web or a gateway | Native |
| Main risk | Chatty clients, over-fetching | Tight coupling, hard to debug by eye | Expensive queries, N+1 |

**RPC** clients become tightly coupled to the service's operations; every new use case tends to need a new method, and binary traffic is hard to inspect with ordinary tools. In return you get speed, generated types, and streaming, which is why it is the internal default. <Src id="primer" />

**REST** fits awkwardly when the data is not a neat hierarchy, and rendering one screen of nested data can take several round trips. Responses also tend to grow over time, so old clients download fields they never use. <Src id="primer" />

**GraphQL** gives clients exactly what they ask for in one trip, but URL-based HTTP caching stops working, and one deeply nested query can do a lot of work on the server unless you limit depth and cost. <Src id="wiki-graphql" />

## Interview tips

- Write two or three key endpoints with method, path, request body, and response shape early. It anchors the data model and the rest of the design.
- Default to REST publicly, gRPC between services, and GraphQL only when you can name the different clients that need different shapes.
- Paginate every list endpoint, and say "cursor" and why.
- Mention idempotency keys on any create or payment endpoint that clients may retry, and say how long keys are kept.
- Say how the API will change: additive fields, deprecation, and a new version only for breaking changes.

**Common mistakes:**

- Treating POST as safe to retry. Without an idempotency key, a timeout plus a retry is a duplicate order or a double charge.
- Using offset pagination for a large, constantly changing feed, which gets slow on deep pages and shows duplicates as new rows arrive.
- Putting verbs in REST paths (`POST /createOrder`), which throws away the uniform method semantics that caches, proxies, and retry logic depend on.
- Exposing database rows directly as API resources, so every schema change becomes a breaking API change.
- Shipping GraphQL publicly without depth or cost limits, so one query can take the backend down.

## Common follow-up questions

### How do you implement idempotency keys on the server?

Store a row keyed by client and idempotency key, with a status and the final response. On a request, insert the row first under a unique constraint. If the insert fails because the key exists and is finished, return the stored response; if it exists and is still in progress, return 409 so the client waits and retries. Record the response in the same database transaction as the side effect where possible, so a crash cannot leave a charge with no record, and expire keys after a day or so.

### PUT or PATCH?

PUT replaces the whole resource with the body you send, which makes it naturally idempotent but means the client must send every field. PATCH sends only the changes, which is smaller but only idempotent if the patch itself is: setting `status` to `shipped` is, "add 1 to quantity" is not. Many APIs use PATCH with "set these fields" semantics for that reason.

### How do you handle long-running operations?

Do not hold the HTTP request open for minutes. Return `202 Accepted` with a URL for a job resource (`/jobs/88`), then let the client poll it or receive a webhook (an HTTP call from your server to a URL the client registered) when it finishes. The work itself usually goes onto a queue; see [Queues and back pressure](/modules/queues-and-back-pressure).

### How do you protect an API from abuse?

Authenticate every call with API keys or OAuth tokens (see [Authentication and authorization](/modules/authentication-and-authorization)), apply per-key [rate limits](/modules/rate-limiting) that return 429, cap page sizes and request bodies, and for GraphQL compute a cost per query and reject anything over budget.

### Why not use gRPC everywhere?

Browsers cannot call it directly, binary payloads are hard to debug with curl, and HTTP caches and CDNs do not understand it. For a public API those costs outweigh the speed, so teams expose REST at the edge and translate to gRPC inside.

## Go deeper

- [Google Cloud API design guide](https://cloud.google.com/apis/design): resource-oriented design, standard methods, pagination, and versioning rules used across Google's APIs.
- [Stripe, Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency): why retries need keys, and how Stripe pairs them with exponential backoff.
- [gRPC core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/): the four call types (one unary and three streaming), deadlines, and cancellation.
- [GraphQL best practices](https://graphql.org/learn/best-practices/): pagination, evolving a schema without versions, and server-side batching, from the official site.
