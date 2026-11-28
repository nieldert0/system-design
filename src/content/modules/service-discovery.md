---
slug: service-discovery
title: Service discovery
section: architecture
upgraded: true
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
  - prompt: In client-side discovery, who picks the instance?
    options:
      - The database
      - The user's browser
      - The DNS root servers
      - The calling service, after querying the registry
    correct: 3
    explanation: The client asks the registry and load balances itself; server-side discovery puts a load balancer in between.
  - prompt: How does a registry learn an instance has died?
    options:
      - DNS TTL
      - It never does
      - Missed heartbeats or failed health checks
      - The user reports it
    correct: 2
    explanation: Instances send heartbeats or the registry polls a health endpoint, and expired entries are removed.
  - prompt: What is a drawback of DNS-based discovery?
    options:
      - Cached records can point to dead instances until the TTL expires
      - DNS is too new
      - It needs a client library in every language
      - DNS cannot return several addresses
    correct: 0
    explanation: Short TTLs help, but some clients cache longer than they should.
  - prompt: In the worked example, 2,000 requests/s spread over 40 instances and one instance crashes. Callers keep sending to it for 30 seconds. With no retries, about how many requests fail?
    options:
      - About 50
      - About 1,500
      - About 60,000
      - None, the registry removes it instantly
    correct: 1
    explanation: Each instance gets 2,000 / 40 = 50 requests/s, and 50 × 30 s = 1,500. Shrinking the detection window or retrying on another instance is what reduces it.
  - prompt: Why does a deploy that stops instances gracefully cause almost no errors, while a crash causes many?
    options:
      - Crashes are rarer
      - A graceful stop deregisters first and drains in-flight requests, so callers learn before it disappears; a crash is only noticed after health checks fail
      - Deploys use a different registry
      - Callers retry only during deploys
    correct: 1
    explanation: The error window is the time between the instance stopping and callers learning about it. A graceful shutdown makes it close to zero.
  - prompt: The registry cluster goes down for five minutes. What lets services keep calling each other?
    options:
      - Nothing; all calls fail
      - Clients and proxies keep using their last known instance list until the registry returns
      - DNS root servers take over
      - The load balancer generates new addresses
    correct: 1
    explanation: Discovery data changes slowly, so a cached list is mostly right for minutes. That is why registries are often designed to fail open.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import ServiceDiscoveryFlow from '#lib/diagrams/ServiceDiscoveryFlow.svelte';
</script>

In a system of many services, instances start, stop and move all the time. Service discovery lets callers find the ones that are alive right now, and the interesting part is how quickly they learn when that changes.

## What it is

Here is the problem. The checkout service calls the orders service at `10.0.3.17:8080`, written in a config file. Then <Term id="autoscaling">autoscaling</Term> adds six new orders instances at a sale, a deploy replaces all of them with new addresses, and one machine dies at 3 a.m. Checkout never hears about any of it: it keeps calling the one old address, ignores the new capacity, and fails when that address goes away. With dozens of services each running tens of instances, nobody can keep those config files right by hand.

**<Term id="service-discovery">Service discovery</Term>** is the automatic tracking of which instances of each service exist, where they are, and whether they are healthy, so a caller can ask for `orders` by name and get a working address. <Src id="wiki-sd" />

At its centre is a **<Term id="service-registry">service registry</Term>**: a small, replicated database of services, their instances and their health. Consul, etcd, ZooKeeper and Netflix's Eureka are common registries, and on <Term id="kubernetes">Kubernetes</Term> the cluster's own control plane plays that role. Many of these also double as a key-value store for shared configuration. <Src id="primer-sd" />

It matters most once you have [split a system into services](/modules/monolith-vs-microservices); a single monolith behind one [load balancer](/modules/load-balancers) mostly does not need it.

## How it works

1. **Register.** When an instance starts, it records its service name, address and port in the registry. It can do this itself (self-registration), or a platform such as Kubernetes or an agent on the host does it for it (third-party registration), which keeps the logic out of application code.
2. **Stay healthy.** Either the instance sends a <Term id="heartbeat">heartbeat</Term> every few seconds, or the registry runs a <Term id="health-check">health check</Term> against an endpoint like `/health`. An instance that misses enough of them is marked unhealthy and removed. <Src id="primer-sd" />
3. **Look up.** A caller asks the registry for the healthy instances of a service, gets their addresses, and picks one. Good clients also subscribe to changes (a *watch*) instead of asking on every call.
4. **Deregister.** On a clean shutdown, the instance removes itself first and finishes in-flight requests before exiting, so no caller is sent to it after it is gone.

<ServiceDiscoveryFlow />

### Client-side or server-side lookup

There are two places the lookup can happen. <Src id="wiki-sd" />

- **Client-side discovery.** The calling service queries the registry, caches the list, and does its own load balancing, for example round-robin or least-requests. There is no extra hop and the client can be smart (retry on another instance, prefer the same zone), but every service needs a discovery library, in every language you use.
- **Server-side discovery.** The caller sends every request to a fixed router or [load balancer](/modules/load-balancers), which looks up the registry and forwards it. Clients stay simple and language-neutral; the router is one more hop and one more thing to run and scale.

A **<Term id="service-mesh">service mesh</Term>** is a way to get client-side behaviour without the library: a <Term id="sidecar">sidecar</Term> proxy runs next to each service instance, the service calls `localhost`, and the proxy handles discovery, load balancing, retries and <Term id="mtls">mutual TLS</Term>. A central control plane pushes the instance lists to every sidecar. <Src id="wiki-mesh" />

### DNS-based discovery

The registry can also answer <Term id="dns">DNS</Term> queries, so `orders.service.internal` resolves to the addresses of live instances. A <Term id="srv-record">SRV record</Term> can carry the port as well. It works with any client in any language, which is its big advantage. The weakness is caching: resolvers and client libraries keep answers until the <Term id="ttl">TTL</Term> runs out, and some (older JVMs, for example) cache far longer, so callers keep hitting dead instances. DNS also cannot express load or health weights well, so DNS discovery is usually paired with short TTLs and client retries. <Src id="wiki-srv" />

### Consistency of the registry

Registries choose a side of the [CAP trade-off](/modules/cap-theorem). ZooKeeper, etcd and Consul's servers are <Term id="cp">CP</Term>: they use a consensus protocol and refuse writes when they lose a <Term id="quorum">quorum</Term>, so the list is never contradictory. Eureka is <Term id="ap">AP</Term>: every server accepts registrations and they sync with each other, so the list may be briefly stale but is always available. For discovery, a slightly stale list is usually less harmful than no list, which is why clients always cache the last good answer.

## Worked example

The orders service runs **40 instances** behind client-side discovery and receives **2,000 requests a second**, so each instance gets 2,000 / 40 = **50 requests a second**. Instances send a heartbeat every 10 seconds, and the registry removes one after **3 missed heartbeats**. Callers watch the registry and update their lists about 1 second after it changes.

**Step 1, an instance crashes.** The process dies with no warning. The registry only notices after 3 missed heartbeats, so between 20 and 30 seconds later depending on where in the cycle it died; take the worst case, 30 seconds, plus 1 second for callers to update. For 31 seconds, 1 in 40 requests goes to a dead address. That is 50 × 31 ≈ **1,550 failed requests**, about 2.5% of traffic for half a minute.

**Step 2, shrink the window.** Halve the heartbeat interval to 5 seconds and the window becomes about 16 seconds and **800 failures**. Going further means more heartbeat traffic (40 instances every second is fine, 40,000 is not) and a higher risk of removing healthy instances during a short network hiccup or a garbage-collection pause. Detection speed and false alarms pull in opposite directions.

**Step 3, retry on another instance.** The better fix is in the client. A connection refused, or a timeout after 200 ms, retries once on a different instance. The 1,550 requests now succeed on the second try, at the cost of up to 200 ms extra for those few. Retries must only be used for requests that are safe to repeat, or carry an <Term id="idempotency-key">idempotency key</Term>. Many clients also eject an instance locally after a few consecutive errors (*outlier detection*), which is faster than waiting for the registry.

**Step 4, a deploy.** A rolling deploy replaces all 40 instances, five at a time. If each instance simply exits, every batch repeats Step 1: eight batches × 5 instances × 50 req/s × 31 s ≈ **62,000 failed requests**. With graceful shutdown (deregister, wait a few seconds for callers to update, finish in-flight work, exit), callers stop sending before the instance stops listening, and failures drop to almost **zero**.

**Step 5, the slow-cache trap.** Suppose a team uses DNS discovery with a 60-second TTL and a client library that caches DNS for 5 minutes. After a crash, that caller keeps sending its share of traffic to the dead address for up to **5 minutes**, ten times the Step 1 window. The fix is to configure the client's cache to respect the TTL, or move it onto watches.

## In the real world

- **Kubernetes.** A *Service* gives a set of <Term id="pod">pods</Term> a stable name (`orders.shop.svc.cluster.local`, resolved by CoreDNS) and a virtual IP. The control plane keeps EndpointSlices (up to 100 endpoints each by default) listing the ready pods, and kube-proxy on every node programs iptables or IPVS rules so the virtual IP reaches one of them. A pod is only added once its *readiness probe* passes; the defaults are a check every 10 seconds (`periodSeconds`) with `failureThreshold: 3`, the same 30-second window as the worked example.
- **HashiCorp Consul.** A Raft-replicated server cluster, with an agent on each host running health checks and spreading membership by gossip. Services can be found over an HTTP API or Consul's DNS interface on port 8600 (`orders.service.consul`). `deregister_critical_service_after` removes instances that stay failing for that long.
- **Netflix Eureka.** An AP registry: clients renew a lease every 30 seconds and are evicted after 90 seconds without renewal, and clients fetch the registry every 30 seconds. With those defaults, a crashed instance can be called for a couple of minutes, which is why Netflix pairs Eureka with client-side retries. Its *self-preservation mode* stops evictions if too many renewals go missing at once, on the assumption that the network, not the instances, has failed.
- **Envoy and Istio.** Envoy receives instance lists from a control plane over its EDS (endpoint discovery) API. Istio is a service mesh that runs Envoy as a sidecar in each pod and feeds it from Kubernetes, adding retries, outlier detection and mTLS without application changes.

## Trade-offs

| Approach | Extra hop | Language support | Freshness | Ops cost |
| --- | --- | --- | --- | --- |
| Client-side library | None | One library per language | Seconds (watches) | Low infrastructure, high code |
| Server-side router | One | Any | Seconds | A router fleet to run |
| DNS | None | Any | TTL, often worse | Lowest |
| Service mesh | Local sidecar | Any | Seconds | Heavy control plane |

- **Registry availability matters.** If it is down and clients do not cache, nobody can find anybody. Run it as a replicated cluster of three or five nodes and let clients keep the last known list.
- **Detection speed against false alarms.** Short heartbeat intervals remove dead instances quickly but also evict healthy ones during brief pauses.
- **Health checks must be cheap but meaningful.** A check that always returns 200 keeps broken instances in rotation; one that queries every dependency marks everything unhealthy when one dependency blips.

## Interview tips

- Mention discovery whenever you draw many services or autoscaling, and never hard-code addresses.
- Name a registry (Consul, etcd, ZooKeeper, Eureka) or the platform (Kubernetes Services) and pick client-side, server-side or mesh with a reason.
- Quote the detection window and turn it into failed requests, as in the worked example, then fix it with retries and graceful shutdown.

**Common mistakes:**

- **Relying on DNS without checking client caching**, so a "30-second TTL" is really several minutes.
- **Shallow health checks** that report healthy while the instance cannot reach its database.
- **No graceful shutdown**, so every deploy produces a burst of errors that look like an outage.
- **Making the registry a hard dependency on every request** instead of caching and watching, so a registry blip takes down all traffic.

## Common follow-up questions

### What happens if the registry goes down?

Existing traffic should carry on, because clients and sidecars keep the last list they received and instance addresses change slowly. New instances cannot register and dead ones are not removed until it returns, so the list drifts. That is why registries run as three- or five-node clusters and why clients are built to fail open.

### How do you avoid sending traffic to an instance that is starting up?

Separate *alive* from *ready*. An instance registers or passes its readiness check only after it has warmed caches, opened its database pool and loaded config. Kubernetes models this with separate liveness and readiness probes: a failed readiness probe removes the pod from the Service without restarting it.

### Client-side or server-side discovery?

Client-side when you control the clients, use few languages and want no extra hop or smarter routing (zone-aware, retries). Server-side or DNS when clients are varied or external. A service mesh is the middle ground most large Kubernetes users land on: client-side behaviour, implemented once in a proxy.

### How does discovery work across regions?

Each region usually runs its own registry, and callers prefer local instances. Cross-region lookups are a fallback for when the local service is down, because a cross-region call adds tens of milliseconds. Consul federates datacenters this way, and meshes support locality-aware routing.

## Go deeper

- [Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/): how Services, EndpointSlices and DNS names fit together.
- [Consul service discovery](https://developer.hashicorp.com/consul/docs/concepts/service-discovery): registration, health checks and the DNS interface in one registry.
- [Envoy service discovery](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/service_discovery): the discovery types a proxy supports and how EDS feeds a mesh.
- [Netflix Eureka wiki](https://github.com/Netflix/eureka/wiki): the AP design, lease timings and self-preservation mode.
