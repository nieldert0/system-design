---
slug: load-balancers
title: Load balancers
section: edge
upgraded: true
readFirst:
  - performance-vs-scalability
  - how-the-internet-works
sources:
  - id: primer
    title: The System Design Primer, Load balancer
    url: https://github.com/donnemartin/system-design-primer#load-balancer
    license: CC BY 4.0
    use: reworded
  - id: wiki-lb
    title: Wikipedia, Load balancing (computing)
    url: https://en.wikipedia.org/wiki/Load_balancing_(computing)
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does a layer 4 load balancer look at to pick a server?
    options:
      - Cookies and headers
      - Source and destination IP addresses and ports, not the request contents
      - The request body
      - DNS records
    correct: 1
    explanation: Layer 4 works at the transport layer, so it sees connections, not HTTP requests.
  - prompt: You want /video traffic on video servers and /billing on hardened servers. What do you need?
    options:
      - A layer 4 load balancer
      - A layer 7 load balancer
      - DNS round robin
      - UDP
    correct: 1
    explanation: Layer 7 reads the HTTP request, so it can route by path, header or cookie.
  - prompt: Why should servers behind a load balancer be stateless?
    options:
      - Stateless servers are cheaper per CPU
      - So any server can handle any request; sessions live in a shared store like Redis
      - Load balancers cannot route stateful traffic
      - To save disk
    correct: 1
    explanation: If session data lives on one server, losing or adding servers logs users out.
  - prompt: A single load balancer is a single point of failure. What is the common fix?
    options:
      - Remove it
      - Run a pair or more in active-passive or active-active mode, sharing a floating or anycast IP
      - Use bigger hardware
      - Put it behind DNS with a 1-day TTL
    correct: 1
    explanation: Redundant load balancers remove the single point of failure, at some extra complexity.
  - prompt: In the worked example, 4 servers each handle 1,000 requests/s and traffic is 3,000 requests/s. One server dies, and health checks run every 5 s with 3 failures needed. Roughly how many requests fail before it is removed?
    options:
      - None, the load balancer notices instantly
      - About 11,000, the dead server's quarter of traffic for about 15 s
      - All 45,000 requests in those 15 s
      - About 750
    correct: 1
    explanation: The dead server gets 750 requests/s until it is marked down after 3 × 5 s = 15 s, so about 11,000 requests fail unless retries or passive checks catch them sooner.
  - prompt: Requests take anywhere from 5 ms to 2 s depending on the endpoint. Why does least-connections beat round robin here?
    options:
      - It is cheaper to compute
      - Round robin keeps handing new requests to a server stuck on slow ones, while least-connections steers them to servers with fewer requests in flight
      - Round robin does not support health checks
      - Least-connections encrypts traffic
    correct: 1
    explanation: Round robin balances request counts, not work. When request cost varies, counting in-flight requests tracks real load much better.
  - prompt: You enable sticky sessions and one server holds 40% of active users after a deploy. What went wrong?
    options:
      - Nothing, stickiness always balances evenly
      - Stickiness pins users to the servers that were up when they arrived, so servers that restart or join late stay underloaded while old ones stay hot
      - The load balancer switched to layer 4
      - DNS cached the old IPs
    correct: 1
    explanation: Sticky sessions trade balance for affinity. Moving session state to a shared store removes the need for them.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import LoadBalancerFlow from '#lib/diagrams/LoadBalancerFlow.svelte';
</script>

A load balancer sits in front of a group of servers and spreads requests across them, so you can add servers when traffic grows and lose one without users noticing.

## What it is

Start with the failure. One web server handles about 1,000 requests a second, and your launch brings 3,000. You can buy a bigger machine, but there is always a ceiling, and when that one machine reboots for a kernel patch, the whole site is down. So you run four servers instead. Now clients need one address to connect to, something has to decide which server gets each request, and something has to notice when a server dies and stop sending it traffic.

That something is a **<Term id="load-balancer">load balancer</Term>**: a component that receives every client request, forwards it to one of a pool of servers (often called *backends* or *upstreams*), and relays the response back. It does three jobs. It spreads load so no server is overloaded, it runs <Term id="health-check">health checks</Term> so unhealthy servers stop getting requests, and it removes the single server as a single point of failure. <Src id="primer" /> <Src id="wiki-lb" />

Load balancers are what make <Term id="horizontal-scaling">horizontal scaling</Term> work. If you have not yet compared scaling up with scaling out, read [Performance vs scalability](/modules/performance-vs-scalability) first. Load balancers come as dedicated hardware appliances (F5 BIG-IP, which is fast and expensive), as software you run yourself (HAProxy, NGINX, Envoy), or as a managed cloud service (AWS Elastic Load Balancing, Google Cloud Load Balancing).

## How it works

<LoadBalancerFlow />

### Layer 4 and layer 7

The biggest design choice is how much of the traffic the load balancer reads. The names come from the layers of the networking model covered in [How the internet works](/modules/how-the-internet-works).

**Layer 4 (transport).** The load balancer looks only at <Term id="ip-address">IP addresses</Term> and ports of a <Term id="tcp">TCP</Term> or <Term id="udp">UDP</Term> connection. It picks a backend when the connection opens, then shuttles packets back and forth, usually rewriting addresses (network address translation, or NAT) so the backend's replies come back through it. It never parses HTTP, so it is fast, cheap, and works for any protocol: databases, game servers, MQTT. But it balances *connections*, not *requests*. A client that sends 10,000 requests down one long-lived connection sends all of them to the same server. <Src id="primer" />

**Layer 7 (application).** The load balancer terminates the client's connection, reads the full <Term id="http">HTTP</Term> request, decides, and sends the request over its own connection to a backend. Because it sees the path, headers, and cookies, it can route `/video` to video servers and `/billing` to security-hardened servers, retry a failed request on another backend, and balance each HTTP/2 or gRPC request individually even when they share one connection. The cost is more CPU per request and the need to hold the <Term id="tls">TLS</Term> certificate, since it must decrypt traffic to read it. On modern hardware the extra latency is usually well under a millisecond. <Src id="primer" />

Decrypting at the load balancer is called TLS termination. It saves backends the cost of encryption and means certificates live in one place instead of on every server. If traffic must stay encrypted inside the data center, the load balancer re-encrypts to the backend.

### Choosing a backend

The balancing algorithm decides which healthy server gets the next request or connection. <Src id="wiki-lb" />

- **Round robin** hands requests to each server in turn. It is the usual default and works well when requests cost roughly the same and servers are identical. **Weighted round robin** gives a bigger server a bigger share.
- **Least connections** (or least outstanding requests) sends the request to the server with the fewest in flight. It adapts when some requests are much slower than others, because a server stuck on slow work accumulates open requests and stops being chosen.
- **Power of two choices** picks two servers at random and sends the request to the less loaded one. It gets close to least-connections behaviour without every load balancer needing a perfectly current view of every server, which matters when you run many load balancer instances.
- **Hashing** on client IP, a header, or a URL sends the same key to the same server. Plain modulo hashing reshuffles almost every key when a server is added, so systems that need affinity use [consistent hashing](/modules/consistent-hashing) to move only about 1/N of keys.

### Health checks

An *active* health check probes each backend on a timer, for example `GET /healthz` every 5 seconds, and marks it down after a few failures in a row (often 2 or 3) and up again after a few successes. A *passive* check watches real traffic: if a backend returns several 5xx errors or connection resets, the load balancer ejects it for a while. Active checks catch servers that are idle but broken; passive checks react within a few requests. Good setups use both.

A health endpoint should check what the server needs to do useful work, but carefully. If `/healthz` fails whenever the shared database is slow, every backend fails at once and the load balancer has nothing left to send traffic to. Most load balancers have a "fail open" rule for this: if all backends look unhealthy, send traffic to all of them anyway.

### Sessions and statelessness

If a server keeps a user's session in its own memory, that user must keep hitting the same server. Load balancers can enforce this with <Term id="sticky-session">sticky sessions</Term>, usually by setting a cookie that names the backend. It works, but it fights the load balancer: users pile up on old servers, new servers stay idle, and when a server dies its users lose their sessions. <Src id="primer" />

The better answer is to make app servers <Term id="stateless">stateless</Term>: keep sessions in a shared store such as Redis or the database, so any server can answer any request and servers can come and go freely. A consequence is that the shared store and the database now see connections from every app server, so plan for that with a <Term id="connection-pool">connection pool</Term>.

### Removing the load balancer as a single point of failure

A single load balancer is now the thing that takes the site down. The fix is to run at least two. In **active-passive**, one handles traffic and the other watches it through a heartbeat; on failure, the standby takes over a shared "floating" IP address (keepalived with VRRP is the classic tool). In **active-active**, all instances serve traffic, and something in front spreads clients across them: DNS with several records, or <Term id="anycast">anycast</Term>, where many machines advertise the same IP and the network routes each client to the nearest. Cloud load balancers do this for you behind one DNS name. <Src id="primer" />

## Worked example

An API runs on **4 servers**. Each handles about **1,000 requests/s** before latency climbs, so the pool tops out at 4,000. Peak traffic is **3,000 requests/s**, so each server runs at 750 requests/s, or 75% busy. Requests average 20 ms. A layer 7 load balancer uses round robin with an active health check every **5 s** that marks a server down after **3 failures**.

**Step 1, normal load.** Round robin sends 3,000 / 4 = 750 requests/s to each server. By [Little's law](/modules/performance-vs-scalability), each server has about 750 × 0.02 s = **15 requests in flight** on average.

**Step 2, a server dies.** Server 3 kernel-panics. The load balancer does not know yet, so it keeps sending it a quarter of traffic. Detection takes up to 3 checks × 5 s = **15 s**, during which about 750 × 15 ≈ **11,000 requests fail**. Two things shrink that: passive checks eject the server after a handful of connection errors, usually within a second, and the load balancer can retry an idempotent `GET` on another server so the user never sees the failure.

**Step 3, the survivors.** Once server 3 is removed, 3,000 requests/s land on 3 servers: **1,000 each, exactly their limit**. Any spike now pushes latency up and requests start queuing. This is why you plan capacity as N+1: with a 3,000 requests/s peak and 1,000 per server, you need 3 servers for load plus 1 spare, which is what we had, with no headroom left. Running 5 servers keeps each at 750 even with one down.

**Step 4, uneven requests.** Suppose 1% of requests are a report endpoint that takes 2 s instead of 20 ms. With round robin, each server gets 7.5 slow requests/s, each holding a worker for 2 s, so about 15 extra requests in flight per server, doubling concurrency. If those slow requests happen to cluster on one server, round robin keeps feeding it new work anyway. Least-connections sees that server's in-flight count rise and steers new requests elsewhere, which keeps tail latency down. This is why Envoy and NGINX users often switch from round robin to least-request for mixed workloads.

**Step 5, a deploy.** You restart servers one at a time. Before stopping each, the load balancer marks it as *draining*: no new requests, but in-flight ones finish (connection draining, often with a 30 s limit). Without draining, every restart drops the 15 or so requests in progress on that server.

## In the real world

- **HAProxy.** A software load balancer known for speed and detailed stats. `balance roundrobin` is the default; `balance leastconn` and `balance source` (client IP hash) are common alternatives. Health checks are set per server with `check inter 2s fall 3 rise 2`: probe every 2 s, down after 3 failures, up after 2 successes. `mode tcp` is layer 4 and `mode http` is layer 7.
- **NGINX.** The `upstream` block defaults to round robin, with `least_conn`, `ip_hash`, and `hash $key consistent` as options. Open-source NGINX only does passive checks (`max_fails=1 fail_timeout=10s` by default); active health checks are an NGINX Plus feature.
- **AWS Elastic Load Balancing.** The Application Load Balancer is layer 7: it routes by path and host, uses round robin by default with "least outstanding requests" as an option, and checks targets every 30 s by default with an unhealthy threshold of 2. The Network Load Balancer is layer 4, preserves client IPs, and handles millions of connections per second. Connection draining is called deregistration delay and defaults to 300 s.
- **Envoy.** The proxy behind most service meshes. Its default policy is round robin, and `LEAST_REQUEST` uses power of two choices. It combines active health checks with *outlier detection*, which ejects a host after 5 consecutive 5xx responses by default.

## Trade-offs

| | Layer 4 | Layer 7 |
| --- | --- | --- |
| Sees | IPs and ports | Full HTTP request |
| Balances | Connections | Individual requests |
| Routing | By address only | By path, host, header, cookie |
| Cost | Very low | TLS and parsing per request |
| Protocols | Anything over TCP/UDP | HTTP, gRPC, WebSocket |

- **Extra hop and extra system.** A load balancer adds a little latency and is one more component to configure and monitor. A misconfigured or undersized one becomes the bottleneck. <Src id="primer" />
- **Redundancy adds complexity.** Removing the single point of failure means floating IPs, heartbeats, or anycast, each with its own failure modes. <Src id="primer" />
- **Affinity against balance.** Sticky sessions and hashing keep a user or key on one server, which helps caches but makes load uneven and failures more visible.

## Interview tips

- Put a load balancer in front of any tier with more than one server, and say that it runs health checks and drains servers during deploys.
- Pick layer 4 for raw speed or non-HTTP traffic, layer 7 when you route by path, header, or cookie or need per-request balancing for HTTP/2 and gRPC.
- Say where sessions live (Redis or the database), so app servers stay stateless and stickiness is not needed.
- Show the load balancer is redundant too: two in active-passive with a floating IP, or a managed service.

**Common mistakes:**

- Sizing the pool for peak with no spare, so losing one server overloads the rest, as in step 3 of the worked example.
- Health checks that depend on a shared database, so one slow database marks every server down at once.
- Using round robin with layer 4 for gRPC, where one long-lived connection carries all of a client's requests to a single server.
- Forgetting connection draining, so every deploy drops in-flight requests.

## Common follow-up questions

### How does the load balancer itself scale?

Run many instances and spread clients across them. Inside one region, cloud load balancers add capacity behind a single DNS name automatically. At larger scale, a layer 4 tier using anycast and consistent hashing (Google's Maglev, Facebook's Katran) spreads packets over many layer 7 proxies, which then balance requests to the application. Each tier is stateless enough to scale horizontally.

### How do you do zero-downtime deploys?

Take servers out one at a time (or a batch at a time). Mark a server as draining so it gets no new requests, wait for in-flight requests to finish, deploy, wait for its health check to pass, and put it back. For safer rollouts, use the load balancer's weights to send a small share of traffic to the new version first, a <Term id="canary-release">canary release</Term>.

### What is the difference between a load balancer and DNS round robin?

DNS round robin returns several IPs and lets clients pick. It costs nothing, but clients and resolvers cache answers for the <Term id="ttl">TTL</Term> and keep using a dead IP, and DNS knows nothing about server load. A load balancer sees every request, reacts to a failure in seconds, and balances by real load. Large systems use both: DNS (often geographic) picks a region, and load balancers spread traffic inside it. See [DNS](/modules/dns).

### How does the backend learn the real client IP?

A layer 7 load balancer opens its own connection, so the backend sees the load balancer's IP. It adds an `X-Forwarded-For` header with the client's address. Layer 4 balancers either preserve the source IP directly or use the PROXY protocol, a short header prepended to the connection. Only trust these headers when they come from your own load balancer, or clients can forge them.

### What happens when every backend is overloaded?

Spreading load does not create capacity. The load balancer should limit queued requests and fail fast with a 503 rather than letting every request time out, which is a form of [back-pressure](/modules/queues-and-back-pressure). Pair that with <Term id="autoscaling">autoscaling</Term> on CPU or request rate, and <Term id="rate-limiting">rate limits</Term> on abusive clients.

## Go deeper

- [Maglev: A Fast and Reliable Software Network Load Balancer (NSDI 2016)](https://research.google/pubs/maglev-a-fast-and-reliable-software-network-load-balancer/): Google's layer 4 load balancer and the consistent hashing it uses to survive machine failures.
- [HAProxy configuration manual](https://docs.haproxy.org/2.8/configuration.html): every `balance` algorithm and health check option with their defaults.
- [Envoy load balancing overview](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/overview): round robin, least request with power of two choices, ring hash, and Maglev in one place.
- [AWS Elastic Load Balancing documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/what-is-load-balancing.html): how Application and Network Load Balancers differ and how health checks and deregistration delay work.
