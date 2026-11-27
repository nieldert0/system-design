---
slug: reverse-proxies-api-gateways
title: Reverse proxies and API gateways
section: edge
upgraded: true
readFirst:
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, Reverse proxy (web server)
    url: https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server
    license: CC BY 4.0
    use: reworded
  - id: wiki-gw
    title: Wikipedia, API management (API gateway)
    url: https://en.wikipedia.org/wiki/API_management
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: Is a reverse proxy useful with only one backend server?
    options:
      - No, it needs several
      - Yes, for TLS termination, caching, compression, static files, and hiding the backend
      - Only for databases
      - Only with UDP
    correct: 1
    explanation: Load balancing needs several servers; the other reverse proxy jobs help even with one.
  - prompt: What does an API gateway typically add on top of a reverse proxy?
    options:
      - Disk storage
      - API concerns such as authentication, rate limiting, and routing to many services
      - DNS resolution
      - Database sharding
    correct: 1
    explanation: A gateway is a reverse proxy specialised for APIs.
  - prompt: Which tool can act as both a layer 7 reverse proxy and a load balancer?
    options:
      - Redis
      - NGINX or HAProxy
      - PostgreSQL
      - Kafka
    correct: 1
    explanation: Both route HTTP requests and spread them across a pool of servers.
  - prompt: What is the difference between a forward proxy and a reverse proxy?
    options:
      - There is none
      - A forward proxy acts for clients reaching the internet; a reverse proxy acts for servers receiving requests
      - A forward proxy only handles UDP
      - A reverse proxy runs on the client
    correct: 1
    explanation: The direction is about whom the proxy represents. A reverse proxy hides the servers; a forward proxy hides the clients.
  - prompt: In the worked example, the gateway validates JWTs locally instead of calling the auth service. Why does that matter at 5,000 requests/s?
    options:
      - It doesn't; both cost the same
      - It removes 5,000 network calls per second and the auth service as a dependency of every request, at the cost of not seeing revocations until the token expires
      - JWTs cannot be checked locally
      - It makes requests unauthenticated
    correct: 1
    explanation: A signature check is CPU-only, around microseconds. The trade is that a revoked token stays valid until expiry, so keep token lifetimes short.
  - prompt: Slow mobile clients take 2 s to upload a request. Why does putting NGINX in front of the app servers help?
    options:
      - It makes the network faster
      - NGINX buffers the slow upload and hands the app a complete request in milliseconds, so app workers are not held for 2 s each
      - It compresses the upload
      - It retries the upload
    correct: 1
    explanation: Buffering lets a cheap event loop absorb slow clients, while the expensive app worker only sees fast, complete requests.
  - prompt: A team adds per-customer pricing logic to the gateway. What is the main risk?
    options:
      - None, the gateway is the right place
      - The gateway becomes a shared bottleneck and coupling point every team must change and deploy through
      - Gateways cannot run code
      - It disables TLS
    correct: 1
    explanation: Keep cross-cutting concerns at the gateway and business logic in services.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import GatewayFlow from '#lib/diagrams/GatewayFlow.svelte';
</script>

A reverse proxy is the single front door to your servers. An API gateway is a reverse proxy that also handles API chores such as authentication, rate limits, and routing to many services.

## What it is

Start with the failure. Your company has twelve services, each on its own hostname, and the mobile app talks to all of them directly. Each service handles TLS certificates, checks login tokens its own way, and has its own idea of rate limits. When the orders service moves to a new address, you have to ship an app update. When one service forgets to check a token, it leaks data. And every server's address is public, so attackers can probe each one.

A **<Term id="reverse-proxy">reverse proxy</Term>** fixes the front half of this. It is a server that clients connect to *instead of* your backends: it accepts the request, forwards it to a backend that can handle it, and returns the response as if it had produced it. Clients see one address, and the backends behind it can move, multiply, or change without clients knowing. <Src id="primer" />

"Reverse" distinguishes it from a *forward* proxy, which sits in front of clients (a corporate proxy that all employee browsing goes through). A forward proxy represents clients to the internet; a reverse proxy represents servers to clients.

An **API gateway** is a reverse proxy specialised for APIs. On top of forwarding, it routes each call to the right service by path or host and enforces the concerns every API needs: <Term id="authentication">authentication</Term>, <Term id="rate-limiting">rate limiting</Term>, request and response transformation, and per-client analytics. With [microservices](/modules/monolith-vs-microservices), it gives clients one endpoint and hides the internal layout. <Src id="wiki-gw" />

## How it works

### What a reverse proxy does

A request arrives at the proxy, which terminates the client's connection, reads the HTTP request, picks a backend, sends the request over its own connection (often a pooled, kept-alive one), and streams the response back. Along the way it can do several jobs: <Src id="primer" />

- **Security.** Backend servers have private addresses and are not reachable from the internet. The proxy can block abusive IPs, cap connections per client, reject oversized requests, and hide server version headers.
- **TLS termination.** The proxy decrypts <Term id="tls">TLS</Term> and holds the certificates, so backends speak plain HTTP inside the private network (or a separate internal TLS). See [HTTP, HTTPS and TLS](/modules/http-https-tls).
- **Compression.** It gzip- or Brotli-compresses text responses, often cutting JSON and HTML by 70-90%.
- **Caching.** It stores responses that are safe to reuse and serves them without touching the backend.
- **Static files.** It serves images, CSS, and JavaScript straight from disk, which an event-driven proxy does far more cheaply than an application framework.
- **Buffering slow clients.** It reads a slow client's entire request before passing it on, and accepts the full response quickly so the backend is free while the proxy trickles bytes to the client.
- **Load balancing.** With more than one backend, it spreads requests across them, which is why the same software often fills both roles.

### Reverse proxy or load balancer?

A [load balancer](/modules/load-balancers) exists to spread traffic across a pool of servers that all do the same job, so it only makes sense with several servers. A reverse proxy is useful even in front of a single server, for the jobs above. NGINX, HAProxy, and Envoy do both, so in practice the difference is the role you give the box, not the product. <Src id="primer" />

### What a gateway adds

<GatewayFlow />

The gateway runs a chain of steps (often called filters, plugins, or policies) on every request before routing it: <Src id="wiki-gw" />

1. **Authenticate.** Check an API key, or validate a <Term id="jwt">JWT</Term> or an <Term id="oauth">OAuth</Term> access token, and reject the request with 401 if it fails. The gateway can pass the verified user id to the backend in a header so services do not repeat the check.
2. **Rate limit.** Count requests per API key or user and return 429 when a client exceeds its quota. See [Rate limiting](/modules/rate-limiting) for the algorithms.
3. **Route.** Map `/users/*` to the users service and `/orders/*` to the orders service, find a healthy instance through [service discovery](/modules/service-discovery), and forward.
4. **Transform.** Rewrite paths, add or strip headers, translate REST to gRPC, or combine several backend calls into one response for a mobile client (sometimes called a backend-for-frontend).
5. **Observe.** Log every call, emit metrics per route and client, and start a trace so the request can be followed through services with <Term id="distributed-tracing">distributed tracing</Term>.

The gateway also protects backends from each other's failures with timeouts, retries, and a <Term id="circuit-breaker">circuit breaker</Term> that stops calling a service that keeps failing.

## Worked example

A shopping app gets **5,000 requests/s** at peak through a gateway to four services: users, catalog, cart, and orders. About 40% of traffic is catalog reads, and 30% of those are for the same few hundred popular product pages.

**Step 1, authentication.** Every request carries a JWT. Option A: the gateway calls the auth service to check each token, adding about 2 ms and **5,000 calls/s** to auth, which now must be as available as the whole site. Option B: the gateway verifies the token's signature locally with the auth service's public key, which takes tens of microseconds and no network call. Option B wins on latency and removes a dependency, but a revoked token keeps working until it expires. With 15-minute token lifetimes, that is the longest a stolen token works; that is usually an acceptable trade.

**Step 2, rate limiting.** Free-tier keys get 100 requests/minute. The gateway runs 4 instances, so a purely local counter would let a client get 400/minute by hitting all four. The fix is a shared counter in Redis (about 0.5 ms per check) or giving each instance a quarter of the quota, which is cheaper but less exact.

**Step 3, caching.** Catalog is 2,000 requests/s and 600/s of those are popular products. Caching those responses at the gateway for 30 s means the catalog service sees roughly 1,400 requests/s plus one refresh per product every 30 s, a 30% cut for one line of config. This only works because product pages are the same for every user; a response that depends on the user (the cart) must not be cached in a shared cache, or users see each other's data.

**Step 4, slow clients.** Mobile users on weak networks take up to 2 s to send a request with an image upload. If the app server read the request itself, each upload would hold one of its 200 worker threads for 2 s, so just 100 slow uploads per second would occupy every worker. The proxy buffers the full upload in its event loop, which handles thousands of connections cheaply, and hands the app a complete request that it processes in 20 ms.

**Step 5, the latency budget.** End to end, the gateway adds TLS (amortised over kept-alive connections), JWT check (~0.05 ms), rate-limit check (~0.5 ms), and routing (~0.2 ms): under 1 ms on a 50 ms request. If the gateway's p99 latency grows to tens of milliseconds, something heavy has crept in, usually synchronous calls to other services from a plugin.

## In the real world

- **NGINX.** The most common reverse proxy. `proxy_pass` forwards a location to an upstream, `proxy_buffering on` (the default) buffers backend responses, `client_max_body_size` defaults to 1 MB, and `proxy_cache` adds caching. Many API gateways (Kong, for example) are built on NGINX with OpenResty.
- **Envoy.** A proxy built for service-to-service traffic with configuration that can change at runtime through its xDS APIs. It ships circuit breaking (by default at most 1,024 connections and 1,024 pending requests per upstream cluster), retries, outlier detection, and rich metrics. It is the data plane in Istio and the base of gateways such as Envoy Gateway.
- **Kong.** An API gateway with plugins for `key-auth`, `jwt`, `rate-limiting` (with `local`, `cluster`, or `redis` counting policies), request transformation, and logging. Plugins can be applied globally, per service, per route, or per consumer.
- **AWS API Gateway.** A managed gateway. Default account throttling is 10,000 requests/s with a burst of 5,000, it can verify JWTs from an identity provider before invoking a backend, and REST APIs default to a 29 s integration timeout. Regional and private REST APIs can raise it with a quota increase, which may lower your account's throttle, but edge-optimized APIs stay capped at 29 s, so long-running requests usually belong elsewhere.

## Trade-offs

- **Another hop and another system.** Every request passes through it, adding a little latency and one more component to run, configure, and monitor. <Src id="primer" />
- **Single point of failure.** One proxy taking all traffic is exactly the failure it was meant to remove, so you run several behind a load balancer or anycast, which adds complexity. <Src id="primer" />
- **Centralised control against coupling.** Putting auth and limits in one place makes them consistent, but a gateway that also holds business logic or heavy transforms becomes a bottleneck every team must deploy through.
- **Buy against build.** A managed gateway saves operations work but sets limits (timeouts, payload sizes, price per million requests) that a self-hosted Envoy or Kong does not.

## Interview tips

- Draw the edge as <Term id="dns">DNS</Term> → <Term id="cdn">CDN</Term> → load balancer → gateway → services, and say what each layer does.
- Put cross-cutting concerns at the gateway: TLS, authentication, rate limiting, logging. Keep business logic in services.
- Distinguish the roles: a load balancer spreads load over identical servers; a reverse proxy or gateway is a front door that may route to different ones.
- When you add a gateway, say how it is made redundant and what it does when a backend is slow (timeouts and circuit breakers).

**Common mistakes:**

- Putting business logic in the gateway, so it turns into a shared monolith that every team's release depends on.
- Caching user-specific responses in a shared proxy cache, leaking one user's data to another. Responses that depend on a cookie or auth header must be marked private or varied by that header.
- Trusting `X-Forwarded-For` or a user-id header from the outside. Backends should only trust these when the proxy sets them and strips any copies the client sent.
- Having the gateway call the auth service on every request, making auth a hard dependency of the whole site.

## Common follow-up questions

### Do services still need to check authentication if the gateway does?

They should at least check that the request came from the gateway, for example with mutual TLS inside the network, because anything that bypasses the gateway would otherwise be trusted. Authorization (can this user see this order?) usually stays in the service, since only it knows who owns the data. See [Authentication and authorization](/modules/authentication-and-authorization).

### API gateway or service mesh?

A gateway handles *north-south* traffic: requests coming into your system from outside. A service mesh (Istio, Linkerd) puts a small proxy beside every service to handle *east-west* traffic between services, with mutual TLS, retries, and metrics. Many systems run both: a gateway at the edge, a mesh inside.

### How do you avoid the gateway becoming a bottleneck?

Keep it stateless so you can run many instances behind a load balancer and autoscale them. Keep plugins cheap and avoid synchronous calls from the gateway to other services, verifying tokens locally and keeping rate-limit state in a fast shared store. Give different clients separate gateway deployments if one client's traffic pattern threatens the others.

### What should the gateway do when a backend is slow?

Time out instead of waiting forever, retry only idempotent requests and only a limited number of times, and open a circuit breaker so a failing service gets a break instead of a flood of retries. Return a clear 503 or 504 so clients can back off.

## Go deeper

- [NGINX reverse proxy guide](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/): `proxy_pass`, header passing, and how buffering works.
- [Envoy architecture overview](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/arch_overview): listeners, filters, clusters, circuit breaking, and outlier detection.
- [Microservices.io, API gateway pattern](https://microservices.io/patterns/apigateway.html): when a gateway or backend-for-frontend fits, and its drawbacks.
- [Kong rate limiting plugin](https://developer.konghq.com/plugins/rate-limiting/): the local, cluster, and Redis counting policies and their accuracy trade-offs.
