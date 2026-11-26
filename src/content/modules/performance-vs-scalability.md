---
slug: performance-vs-scalability
title: Performance vs scalability
section: start-here
readFirst:
  - approach-a-design-interview
sources:
  - id: primer
    title: The System Design Primer, Performance vs scalability
    url: https://github.com/donnemartin/system-design-primer#performance-vs-scalability
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: A page takes 4 seconds to load even when only one person uses the site. What kind of problem is this?
    options:
      - A scalability problem
      - A performance problem
      - An availability problem
      - A consistency problem
    correct: 1
    explanation: Slow for a single user is a performance problem.
  - prompt: The site is fast at night but slow at lunchtime peak. What kind of problem is this?
    options:
      - A performance problem
      - A scalability problem
      - A security problem
      - Not a problem
    correct: 1
    explanation: Fast for one user but slow under heavy load is a scalability problem.
  - prompt: When is a service scalable?
    options:
      - When it never needs new servers
      - When adding resources increases performance in proportion
      - When it runs on Kubernetes
      - When it uses a NoSQL database
    correct: 1
    explanation: Scalable means performance grows in proportion to the resources you add.
  - prompt: You double the servers and throughput rises only 10%. What does that suggest?
    options:
      - The system scales well
      - A shared bottleneck, such as one database, limits scaling
      - The servers are too fast
      - Latency must have doubled
    correct: 1
    explanation: When adding resources barely helps, something shared (a database, a lock, a single queue) is the bottleneck.
  - prompt: What is horizontal scaling?
    options:
      - Buying a bigger machine
      - Adding more machines that share the work
      - Making the code faster
      - Adding indexes
    correct: 1
    explanation: Horizontal scaling adds machines. Vertical scaling makes one machine bigger.
  - prompt: Which is usually the first fix for a performance problem?
    options:
      - Add ten more servers
      - Find and fix what is slow for a single request
      - Shard the database
      - Move to microservices
    correct: 1
    explanation: If one request is slow, more servers just run more slow requests. Profile and fix the slow path first.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

Performance is how fast the system is for one user. Scalability is whether it stays fast as you add users and add machines.

## What it is

A service is **<Term id="scalability">scalable</Term>** if it results in increased **performance** in a manner proportional to resources added. Generally, increasing performance means serving more units of work, but it can also be to handle larger units of work, such as when datasets grow. <Src id="primer" />

Another way to look at performance vs scalability: <Src id="primer" />

- If you have a **performance** problem, your system is slow for a single user.
- If you have a **scalability** problem, your system is fast for a single user but slow under heavy load.

## How it works

The two questions call for different fixes.

**A performance problem** lives inside one request. A slow query, a missing index, a chatty loop of network calls or a large page all make even a lone user wait. More servers do not help: each one would run the same slow request. You fix it by measuring where one request spends its time and removing that cost.

**A scalability problem** appears only under load. Each request is fine, but something they all share runs out: CPU on a single server, connections to one database, a lock, a single queue. You fix it by adding capacity in the right place, and by removing shared bottlenecks so that new capacity actually helps.

There are two ways to add capacity:

- **Vertical scaling** (scaling up): give one machine more CPU, memory or faster disks. It is simple and needs no code changes, but it has a ceiling and one machine is still one point of failure.
- **<Term id="horizontal-scaling">Horizontal scaling</Term>** (scaling out): add more machines and spread the work across them, usually behind a <Term id="load-balancer">load balancer</Term>. There is no hard ceiling, but the app must be able to run as many copies, which usually means keeping no user state on the servers themselves.

A system scales well when doubling the machines roughly doubles the work it can do. If doubling the machines adds only a little, look for the shared part that every request still goes through.

## Trade-offs

- **Fix performance first.** It is usually cheaper to make one request 10× faster than to run 10× more servers.
- **Vertical scaling is simple but capped.** It is a fine first step, and the right answer for many databases, until the biggest machine is not big enough.
- **Horizontal scaling adds moving parts.** You gain capacity and redundancy, and take on load balancing, shared state, deployment of many copies and harder debugging.
- **Scaling one tier moves the bottleneck.** More app servers can overwhelm the database. Plan the next bottleneck as you fix the current one.

## Interview tips

- Ask early whether the concern is "slow for everyone" or "slow at peak". It tells you which problem you are solving.
- When you add servers, say what makes that work: stateless app servers, and a load balancer in front.
- Name the next bottleneck. "With more app servers, the database becomes the limit, so next I'd add read replicas or a <Term id="cache">cache</Term>."
- Use numbers: "one server handles about 1,000 requests per second, we need 10,000, so about 10 servers plus headroom."
