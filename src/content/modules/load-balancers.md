---
slug: load-balancers
title: Load balancers
section: edge
readFirst:
  - performance-vs-scalability
  - how-the-internet-works
sources:
  - id: primer
    title: The System Design Primer, Load balancer
    url: https://github.com/donnemartin/system-design-primer#load-balancer
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What do load balancers do?
    options:
      - Store sessions on disk
      - Distribute incoming client requests to computing resources such as application servers and databases
      - Translate names to IPs
      - Compress images
    correct: 1
    explanation: They spread requests across servers and return each response to the right client.
  - prompt: What does a layer 4 load balancer look at?
    options:
      - Cookies and headers
      - Source and destination IP addresses and ports, not the packet contents
      - The request body
      - DNS records
    correct: 1
    explanation: Layer 4 works at the transport layer.
  - prompt: You want /video traffic on video servers and /billing on hardened servers. What do you need?
    options:
      - A layer 4 load balancer
      - A layer 7 load balancer
      - DNS round robin
      - UDP
    correct: 1
    explanation: Layer 7 reads the application message, so it can route by path, header or cookie.
  - prompt: What is SSL termination at the load balancer?
    options:
      - Blocking HTTPS
      - Decrypting requests and encrypting responses so backends skip that work
      - Expiring certificates
      - Closing idle connections
    correct: 1
    explanation: It also removes the need to install certificates on every server.
  - prompt: Why should servers behind a load balancer be stateless?
    options:
      - Stateless servers are cheaper per CPU
      - So any server can handle any request; sessions live in a shared store like Redis
      - Load balancers cannot route stateful traffic
      - To save disk
    correct: 1
    explanation: If user data lives on one server, losing or adding servers breaks sessions.
  - prompt: A single load balancer is a single point of failure. What is the common fix?
    options:
      - Remove it
      - Run multiple load balancers in active-passive or active-active mode
      - Use bigger hardware
      - Use UDP
    correct: 1
    explanation: Redundant load balancers remove the single point of failure, at some complexity.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

A load balancer sits in front of a group of servers and spreads requests across them, so you can add servers and survive losing one.

## What it is

**<Term id="load-balancer">Load balancers</Term>** distribute incoming client requests to computing resources such as application servers and databases. In each case, the load balancer returns the response from the computing resource to the appropriate client. Load balancers are effective at: <Src id="primer" />

- Preventing requests from going to unhealthy servers
- Preventing overloading resources
- Helping to eliminate a single point of failure

Load balancers can be implemented with hardware (expensive) or with software such as HAProxy. <Src id="primer" />

## How it works

Additional benefits include: <Src id="primer" />

- **SSL termination** - Decrypt incoming requests and encrypt server responses so backend servers do not have to perform these potentially expensive operations
  - Removes the need to install X.509 certificates on each server
- **Session persistence** - Issue cookies and route a specific client's requests to same instance if the web apps do not keep track of sessions

To protect against failures, it's common to set up multiple load balancers, either in active-passive or active-active mode. Load balancers can route traffic based on various metrics, including random, least loaded, and session/cookies. <Src id="primer" />

**Layer 4.** Layer 4 load balancers look at info at the transport layer to decide how to distribute requests. Generally, this involves the source, destination <Term id="ip-address">IP addresses</Term>, and ports in the header, but not the contents of the packet. Layer 4 load balancers forward network packets to and from the upstream server, performing Network Address Translation (NAT). <Src id="primer" />

**Layer 7.** Layer 7 load balancers look at the application layer to decide how to distribute requests. This can involve contents of the header, message, and cookies. Layer 7 load balancers terminate network traffic, reads the message, makes a load-balancing decision, then opens a connection to the selected server. For example, a layer 7 load balancer can direct video traffic to servers that host videos while directing more sensitive user billing traffic to security-hardened servers. <Src id="primer" />

At the cost of flexibility, layer 4 load balancing requires less time and computing resources than Layer 7, although the performance impact can be minimal on modern commodity hardware. <Src id="primer" />

Load balancers make <Term id="horizontal-scaling">horizontal scaling</Term> work, which brings its own needs: <Src id="primer" />

- Servers should be stateless: they should not contain any user-related data like sessions or profile pictures
- Sessions can be stored in a centralized data store such as a database (SQL, <Term id="nosql">NoSQL</Term>) or a persistent <Term id="cache">cache</Term> (Redis, Memcached)
- Downstream servers such as caches and databases need to handle more simultaneous connections as upstream servers scale out

## Trade-offs

- The load balancer can become a performance bottleneck if it does not have enough resources or if it is not configured properly. <Src id="primer" />
- Introducing a load balancer to help eliminate a single point of failure results in increased complexity. <Src id="primer" />
- A single load balancer is a single point of failure, configuring multiple load balancers further increases complexity. <Src id="primer" />

## Interview tips

- Put a load balancer in front of any tier with more than one server, and say it does health checks.
- Pick L4 for raw speed or non-HTTP traffic, L7 when you route by path, header or cookie.
- Say where sessions live (Redis or the database), so app servers stay stateless.
