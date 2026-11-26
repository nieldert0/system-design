---
slug: api-design
title: 'API design: REST, gRPC and GraphQL'
section: communication
readFirst:
  - http-https-tls
sources:
  - id: primer
    title: The System Design Primer, RPC and REST
    url: https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc
    license: CC BY 4.0
    use: copied
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
    explanation: RPC exposes behaviours; REST exposes resources.
  - prompt: Which REST call reads a person's items?
    options:
      - GET /readUsersItemsList?personid=1234
      - GET /persons/1234/items
      - POST /persons/items/read
      - DELETE /persons/1234
    correct: 1
    explanation: REST nests resources in the path and uses the verb for the action.
  - prompt: Why is gRPC popular for internal service-to-service calls?
    options:
      - Browsers support it natively everywhere
      - It is fast, with compact binary messages over HTTP/2 and generated typed clients
      - It needs no schema
      - It is easier to cache on CDNs
    correct: 1
    explanation: Protobuf schemas and HTTP/2 make it efficient; public APIs still favour REST.
  - prompt: What problem does GraphQL mainly solve?
    options:
      - Encryption
      - Over- and under-fetching; the client asks for exactly the fields it needs in one request
      - Database sharding
      - DNS lookups
    correct: 1
    explanation: REST views often need several round trips or return unused fields.
  - prompt: Why prefer cursor pagination over offset pagination for a large, changing feed?
    options:
      - Offsets are not allowed in SQL
      - Cursors stay stable when rows are inserted and do not slow down on deep pages
      - Cursors return more data
      - Offsets need GraphQL
    correct: 1
    explanation: OFFSET 100000 scans and skips rows, and new inserts shift pages.
  - prompt: A client retries a POST /payments after a timeout. How do you avoid charging twice?
    options:
      - Use GET instead
      - Require an idempotency key and return the stored result for repeats
      - Disable retries
      - Use UDP
    correct: 1
    explanation: The server remembers each key and replays the first result.
  - prompt: How should you ship a breaking change to a public API?
    options:
      - Change the existing endpoint in place
      - Release a new version (e.g. /v2) and keep the old one until clients move
      - Rename the domain
      - Remove fields silently
    correct: 1
    explanation: Versioning lets old clients keep working.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RestVsGraphqlFlow from '#lib/diagrams/RestVsGraphqlFlow.svelte';
</script>

An API is a contract between services. Pick a style (REST, RPC or GraphQL), then get the details right: pagination, idempotency and versioning.

## What it is

**<Term id="rest">REST</Term>** is an architectural style enforcing a client/server model where the client acts on a set of resources managed by the server. The server provides a representation of resources and actions that can either manipulate or get a new representation of resources. All communication must be stateless and cacheable. <Src id="primer" />

**<Term id="rpc">RPC</Term>**: in an RPC, a client causes a procedure to execute on a different address space, usually a remote server. The procedure is coded as if it were a local procedure call, abstracting away the details of how to communicate with the server from the client program. <Src id="primer" />

**gRPC** is a modern RPC framework: services and messages are defined in Protocol Buffers, clients are generated from that schema, and calls run over <Term id="http">HTTP</Term>/2 with streaming support. <Src id="wiki-grpc" />

**GraphQL** is a query language for APIs. The client sends one query that names exactly the fields it wants, across related objects, and the server returns that shape. <Src id="wiki-graphql" />

<RestVsGraphqlFlow />

## How it works

There are four qualities of a RESTful interface: <Src id="primer" />

- **Identify resources (URI in HTTP)** - use the same URI regardless of any operation.
- **Change with representations (Verbs in HTTP)** - use verbs, headers, and body.
- **Self-descriptive error message (status response in HTTP)** - Use status codes, don't reinvent the wheel.
- **HATEOAS (HTML interface for HTTP)** - your web service should be fully accessible in a browser.

RPC and REST calls compared: <Src id="primer" />

| Operation | RPC | REST |
|---|---|---|
| Signup | POST /signup | POST /persons |
| Read a person | GET /readPerson?personid=1234 | GET /persons/1234 |
| Read a person's items | GET /readUsersItemsList?personid=1234 | GET /persons/1234/items |
| Update an item | POST /modifyItem | PUT /items/456 |
| Delete an item | POST /removeItem | DELETE /items/456 |

**Pagination.** Never return an unbounded list. *Offset* pagination (`?offset=200&limit=50`) is simple but slows down on deep pages and skips or repeats rows when data changes. *Cursor* pagination (`?after=abc&limit=50`) returns an opaque pointer to the last item seen, staying fast and stable.

**<Term id="idempotency-key">Idempotency</Term>.** Networks time out, so clients retry. GET, PUT and DELETE are idempotent by definition; POST is not. For POSTs with side effects, the client sends an `Idempotency-Key` header; the server stores the result under that key and returns the same result for any repeat.

**Versioning.** Add fields freely, but never remove or change meaning in place. Breaking changes go into a new version (`/v2/...` or a version header), and the old one stays until clients have moved.

## Trade-offs

**RPC.** RPC clients become tightly coupled to the service implementation. A new API must be defined for every new operation or use case. It can be difficult to debug RPC. RPCs are often used for performance reasons with internal communications. <Src id="primer" />

**REST.** With REST being focused on exposing data, it might not be a good fit if resources are not naturally organized or accessed in a simple hierarchy. Fetching complicated resources with nested hierarchies requires multiple round trips between the client and server to render single views. Over time, more fields might be added to an API response and older clients will receive all new data fields, even those that they do not need. <Src id="primer" />

**GraphQL.** Clients get exactly what they need in one round trip, but caching by URL no longer works, and one expensive query can overload the server unless you limit query depth and cost. <Src id="wiki-graphql" />

| | REST | gRPC | GraphQL |
|---|---|---|---|
| Best for | Public APIs | Internal service calls | Varied clients, nested data |
| Payload | JSON | Binary protobuf | JSON |
| HTTP caching | Easy | Hard | Hard |

## Interview tips

- Write two or three key endpoints with verbs, paths and response shapes; it anchors the rest of the design.
- Paginate every list endpoint, preferably with cursors.
- Mention idempotency keys on any create or payment endpoint that clients may retry.
- Default: REST publicly, gRPC between services, GraphQL when many clients need different shapes.
