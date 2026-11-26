---
slug: service-discovery
title: Service discovery
section: architecture
readFirst:
  - monolith-vs-microservices
  - load-balancers
  - dns
sources:
  - id: primer-sd
    title: The System Design Primer, Service discovery
    url: https://github.com/donnemartin/system-design-primer#service-discovery
    license: CC BY 4.0
    use: reworded
  - id: wiki-sd
    title: Wikipedia, Service discovery
    url: https://en.wikipedia.org/wiki/Service_discovery
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-mesh
    title: Wikipedia, Service mesh
    url: https://en.wikipedia.org/wiki/Service_mesh
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-srv
    title: Wikipedia, SRV record
    url: https://en.wikipedia.org/wiki/SRV_record
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What problem does service discovery solve?
    options:
      - Finding bugs in services
      - Finding the current network addresses of healthy instances of a service
      - Encrypting traffic between services
      - Choosing a database
    correct: 1
    explanation: Instances come and go with autoscaling and failures, so hard-coded addresses go stale.
  - prompt: What does a service registry hold?
    options:
      - Source code
      - A list of services and the addresses of their live instances
      - User passwords
      - Cached web pages
    correct: 1
    explanation: Instances register on start and are removed when they stop or fail health checks.
  - prompt: In client-side discovery, who picks the instance?
    options:
      - The DNS root servers
      - The calling service, after querying the registry
      - The database
      - The user's browser
    correct: 1
    explanation: The client asks the registry and load balances itself; server-side discovery puts a load balancer in between.
  - prompt: How does a registry learn an instance has died?
    options:
      - It never does
      - Missed heartbeats or failed health checks
      - The user reports it
      - DNS TTL
    correct: 1
    explanation: Instances send heartbeats or the registry polls a health endpoint, and expired entries are removed.
  - prompt: Which tools are commonly used as a service registry?
    options:
      - Consul, etcd and ZooKeeper
      - Redis Pub/Sub only
      - Git
      - S3
    correct: 0
    explanation: They are consistent key-value stores with health checks or watches.
  - prompt: What is a drawback of DNS-based discovery?
    options:
      - DNS cannot return several addresses
      - Cached records can point to dead instances until the TTL expires
      - DNS is too new
      - It needs a client library in every language
    correct: 1
    explanation: Short TTLs help, but some clients cache longer than they should.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

In a system of many services, instances start, stop and move all the time. Service discovery lets callers find the ones that are alive right now.

## What it is

**<Term id="service-discovery">Service discovery</Term>** is the automatic detection of services and their network locations. Instead of hard-coding `10.0.3.17:8080`, a caller asks for `orders` and gets the address of a healthy instance. <Src id="wiki-sd" />

At its core is a **<Term id="service-registry">service registry</Term>**: a database of services, their instances and their health. Tools such as Consul, etcd and ZooKeeper are commonly used, and they often double as a key-value store for shared config. <Src id="primer-sd" />

## How it works

1. **Register.** When an instance starts it registers its name, address and port (or a platform such as Kubernetes does it for it).
2. **Stay healthy.** The instance sends heartbeats, or the registry calls a health endpoint like `/health`. Instances that miss checks are removed. <Src id="primer-sd" />
3. **Look up.** A caller asks the registry for healthy instances of a service.

Two styles of lookup: <Src id="wiki-sd" />

- **Client-side discovery.** The caller queries the registry and picks an instance itself, for example round-robin. Fewer hops, but each client needs discovery logic.
- **Server-side discovery.** The caller sends requests to a load balancer or router, which queries the registry and forwards them. Clients stay simple; the router is one more hop to run.

**DNS-based discovery.** The registry serves DNS, so `orders.service.internal` resolves to live instances. SRV records can also carry the port. It works with any client, but caching means stale answers until the TTL runs out. <Src id="wiki-srv" />

In Kubernetes, a Service gets a stable name and virtual IP, and the platform keeps the list of healthy pods behind it up to date. A service mesh adds a sidecar proxy next to each service that handles discovery, retries and TLS. <Src id="wiki-mesh" />

## Trade-offs

- **Registry availability matters.** If it is down, nobody can find anybody. Run it as a replicated cluster, and let clients cache the last known list.
- **Consistency vs availability.** ZooKeeper and etcd favour consistency (CP); some registries favour availability (AP) and accept briefly stale lists.
- **Client-side** saves a hop but ties every service to a library; **server-side** and **DNS** are language-neutral.
- **Health checks** must be cheap but meaningful, or the registry keeps sending traffic to broken instances.

## Interview tips

- Mention discovery whenever you draw many services or autoscaling; don't hard-code addresses.
- Name a registry (Consul, etcd, ZooKeeper) or the platform (Kubernetes Services).
- Explain registration, health checks and lookup, and pick client- or server-side with a reason.
