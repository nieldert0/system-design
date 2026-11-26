---
slug: reverse-proxies-api-gateways
title: Reverse proxies and API gateways
section: edge
readFirst:
  - load-balancers
sources:
  - id: primer
    title: The System Design Primer, Reverse proxy (web server)
    url: https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server
    license: CC BY 4.0
    use: copied
  - id: wiki-gw
    title: Wikipedia, API management (API gateway)
    url: https://en.wikipedia.org/wiki/API_management
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is a reverse proxy?
    options:
      - A proxy that hides clients from servers
      - A web server that centralizes internal services and provides unified interfaces to the public
      - A DNS server
      - A database replica
    correct: 1
    explanation: Clients talk to the reverse proxy; it forwards to backend servers.
  - prompt: Is a reverse proxy useful with only one backend server?
    options:
      - No, it needs several
      - Yes, for TLS termination, caching, compression, static files and hiding the backend
      - Only for databases
      - Only with UDP
    correct: 1
    explanation: Load balancers need multiple servers; reverse proxies help even with one.
  - prompt: What does an API gateway typically add on top of a reverse proxy?
    options:
      - Disk storage
      - API concerns such as authentication, rate limiting and routing to many microservices
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
    explanation: The primer names NGINX and HAProxy as supporting both.
  - prompt: What is a downside of a single reverse proxy?
    options:
      - It cannot cache
      - It is a single point of failure
      - It exposes backend IPs
      - It cannot do TLS
    correct: 1
    explanation: Run several with failover, which adds complexity.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

A reverse proxy is the single front door to your servers. An API gateway is a reverse proxy that also handles API chores like auth and rate limits.

## What it is

A **<Term id="reverse-proxy">reverse proxy</Term>** is a web server that centralizes internal services and provides unified interfaces to the public. Requests from clients are forwarded to a server that can fulfill it before the reverse proxy returns the server's response to the client. <Src id="primer" />

An **API gateway** is a reverse proxy for APIs. It routes each call to the right backend service and handles shared concerns such as authentication, rate limiting, request transformation and analytics. <Src id="wiki-gw" />

## How it works

Benefits of a reverse proxy include: <Src id="primer" />

- **Increased security** - Hide information about backend servers, blacklist IPs, limit number of connections per client
- **Increased scalability and flexibility** - Clients only see the reverse proxy's IP, allowing you to scale servers or change their configuration
- **SSL termination** - Decrypt incoming requests and encrypt server responses so backend servers do not have to perform these potentially expensive operations
- **Compression** - Compress server responses
- **Caching** - Return the response for cached requests
- **Static content** - Serve static content directly (HTML/CSS/JS, photos, videos)

Load balancer vs reverse proxy: <Src id="primer" />

- Deploying a load balancer is useful when you have multiple servers. Often, load balancers route traffic to a set of servers serving the same function.
- Reverse proxies can be useful even with just one web server or application server, opening up the benefits described in the previous section.
- Solutions such as NGINX and HAProxy can support both layer 7 reverse proxying and load balancing.

With microservices, the gateway gives clients one endpoint and maps paths such as `/users` and `/orders` to different services, so clients do not need to know the internal layout. <Src id="wiki-gw" />

## Trade-offs

- Introducing a reverse proxy results in increased complexity. <Src id="primer" />
- A single reverse proxy is a single point of failure, configuring multiple reverse proxies (ie a failover) further increases complexity. <Src id="primer" />
- A gateway that does too much (business logic, heavy transforms) becomes a bottleneck and a coupling point between teams.

## Interview tips

- Draw the edge as: DNS → CDN → load balancer / gateway → services.
- Put cross-cutting concerns at the gateway: auth checks, rate limiting, TLS. Keep business logic out of it.
- Remember the difference: a load balancer spreads load over identical servers; a reverse proxy or gateway is a front door and may route to different ones.
