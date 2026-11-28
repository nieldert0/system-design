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
    use: reworded
  - id: wiki-amdahl
    title: Wikipedia, Amdahl's law
    url: https://en.wikipedia.org/wiki/Amdahl%27s_law
    license: CC BY-SA 4.0
    use: reworded
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
  - prompt: In the worked example, each checkout makes 12 sequential database queries of 20 ms. After batching them into 2 queries, what happens to the number of app servers needed for 2,000 checkouts per second?
    options:
      - It stays the same; query count does not affect capacity
      - It drops sharply, because each request holds a worker for about 40 ms instead of 240 ms
      - It doubles
      - It drops by exactly one server
    correct: 1
    explanation: Each request ties up a worker for its whole duration. Cutting 240 ms to about 40 ms lets each worker serve six times more requests, so far fewer servers are needed. Fixing performance first made scaling cheaper.
  - prompt: In the worked example, after adding app servers the database sits at 95% CPU. What is the next sensible step?
    options:
      - Add even more app servers
      - Move read queries to read replicas or a cache, because the shared database is now the bottleneck
      - Remove the load balancer
      - Lower the request timeout
    correct: 1
    explanation: Scaling one tier moves the bottleneck to the next shared resource. More app servers would only push more load onto the saturated database.
  - prompt: By Amdahl's law, if 10% of the work must run on one shared resource, what is the best possible speed-up from adding machines?
    options:
      - Unlimited
      - About 10×
      - About 2×
      - About 100×
    correct: 1
    explanation: The serial 10% never gets faster, so even with infinite machines the total cannot drop below one tenth of the original time.
  - prompt: What is horizontal scaling?
    options:
      - Buying a bigger machine
      - Adding more machines that share the work
      - Making the code faster
      - Adding indexes
    correct: 1
    explanation: Horizontal scaling adds machines. Vertical scaling makes one machine bigger.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import ScaleUpOutFlow from '#lib/diagrams/ScaleUpOutFlow.svelte';
</script>

Performance is how fast the system is for one user. Scalability is whether it stays fast as you add users and add machines. They have different causes and different fixes, so the first job is to tell which one you have.

## What it is

Here is the failure. A shop's checkout is slow, so the team doubles its app servers from 10 to 20. The bill doubles, and checkout gets no faster at all, because every checkout was spending most of its time waiting on one overloaded database that all 20 servers still share. Or the opposite: checkout takes 3 seconds even at 3 a.m. with one customer online, and no number of extra servers will change that, because the slow part is inside each request.

These are two different problems wearing the same symptom:

- A **performance problem** means the system is slow even for a single user. <Src id="primer" />
- A **scalability problem** means the system is fast for a single user but slow under heavy load. <Src id="primer" />

A service is **<Term id="scalability">scalable</Term>** if adding resources (servers, CPU, memory) increases its performance in proportion to what you added. Usually "more performance" means serving more units of work, such as more requests per second, but it can also mean handling bigger units of work as datasets grow. <Src id="primer" /> Doubling the machines and getting roughly double the capacity is the goal; doubling them and getting 10% more is the sign that something shared is in the way.

## How it works

### Performance lives inside one request

A performance problem has a cause you can find by following one request: a slow query, a missing <Term id="index">index</Term>, a loop that makes a network call per item (often called an N+1 query), a large uncompressed page, or work that could have been done once and cached. More servers do not help, because each new server runs the same slow request.

You fix it by measuring where one request spends its time. Profiling tools and <Term id="distributed-tracing">distributed tracing</Term> show the breakdown: 5 ms in the app, 200 ms waiting on the database, 40 ms rendering. Then you remove the biggest cost. This is usually the cheapest kind of fix, since it costs engineering time but no extra hardware.

### Scalability lives in what requests share

A scalability problem appears only under load. Each request is fine alone, but together they exhaust something they share: CPU on one server, the database's connections or disk, a lock in the code, a single queue consumer, a third-party API's <Term id="rate-limiting">rate limit</Term>. As that resource fills up, requests wait in line for it, and latency climbs. [Latency vs throughput](/modules/latency-vs-throughput) shows why waiting grows so sharply as a resource nears 100% busy.

### Two ways to add capacity

- **<Term id="vertical-scaling">Vertical scaling</Term>** (scaling up): give one machine more CPU, memory or faster disks. It needs no code changes and keeps everything in one place, but there is a largest machine you can buy, prices rise faster than capacity near the top, and one machine is still a single point of failure.
- **<Term id="horizontal-scaling">Horizontal scaling</Term>** (scaling out): run many copies and spread the work across them, usually behind a <Term id="load-balancer">load balancer</Term>. There is no hard ceiling and you gain redundancy, but the app must be able to run as many interchangeable copies. In practice that means the servers are <Term id="stateless">stateless</Term>: sessions, uploads and caches live in shared stores, not in one server's memory.

<ScaleUpOutFlow />

### Why scaling stops being linear

If every request still has to pass through one shared resource, adding machines elsewhere stops helping. <Term id="amdahls-law">Amdahl's law</Term> puts a number on it: if a fraction of the work cannot be spread out, the total speed-up is capped by that fraction, however many machines you add. With 5% serial work, the best possible speed-up is 20×. <Src id="wiki-amdahl" /> In real systems coordination costs (locks, cross-node chatter, keeping copies consistent) can make throughput actually fall past some point.

So scaling well is mostly about removing shared bottlenecks: <Term id="replication">read replicas</Term> or a <Term id="cache">cache</Term> for read-heavy databases, <Term id="sharding">sharding</Term> when writes or data outgrow one database, <Term id="message-queue">queues</Term> to smooth bursts, and partitioned work so no single lock or consumer sees every request.

## Worked example

An online shop needs checkout to handle **2,000 requests per second** at peak (a sale), with p99 latency under 500 ms. Today it runs on 10 app servers, each with 50 worker threads, and one database.

**Step 1, measure one request.** With a single user, checkout takes about **260 ms**. Tracing shows 12 sequential database queries of about 20 ms each (240 ms), plus 20 ms of app work. That is a performance problem in disguise: every request holds one worker thread for 260 ms.

**Step 2, compute today's capacity.** One worker handles 1 / 0.26 s ≈ 3.8 requests per second. Ten servers × 50 workers = 500 workers, so about 500 × 3.8 ≈ **1,900 requests per second**, just under the target, and that is with every worker 100% busy, which in practice means long queues and terrible tail latency. To run at a safer 60% utilisation, the shop would need about 2,000 / (0.6 × 3.8 × 50) ≈ **18 servers**.

**Step 3, fix performance first.** Batching the 12 queries into 2 (one join for the cart and items, one for stock) brings checkout to about 2 × 20 + 20 = **60 ms**. Each worker now handles about 16 requests per second, and at 60% utilisation 2,000 / (0.6 × 16 × 50) ≈ **4 servers** are enough. The shop could even shrink the fleet. Fixing one request turned an 18-server problem into a 4-server one.

**Step 4, find the shared bottleneck.** The database now receives 2 queries × 2,000 = **4,000 queries per second**. It was sized for about 3,000, and at peak its CPU sits at 95% and query latency rises from 20 ms to 150 ms. Checkout latency rises with it. Adding app servers now would make this worse, since it only sends more concurrent queries to the database. This is the scalability problem: the shared tier is full.

**Step 5, scale the right tier.** The stock and product reads are 80% of queries and tolerate being a second or two stale, so they move to two read replicas and a cache. The primary now takes about 800 writes and fresh reads per second, well inside its capacity, and checkout returns to about 60 ms at peak. If the business grows 10×, the next bottleneck will be writes on the primary, and the answer then is sharding orders by customer or region, which you would mention but not build today.

The order of work was: measure, fix the single-request cost, then scale the tier that is actually shared. That order is the whole module.

## In the real world

- **AWS EC2 and RDS.** Vertical scaling is a one-click instance type change (for example from `db.r6g.large` to `db.r6g.4xlarge` on RDS), which needs a short restart. Horizontal scaling for app servers is an Auto Scaling group behind a load balancer, with a target-tracking policy such as "keep average CPU at 50%". RDS adds read replicas (up to 15 for Aurora) for read scaling, but writes still go to one primary.
- **PostgreSQL.** A single Postgres server scales vertically very well, but each client connection is a separate operating-system process, so thousands of app threads opening connections can exhaust it before CPU does. Teams put a <Term id="connection-pool">connection pooler</Term> such as PgBouncer in front and keep `max_connections` in the low hundreds.
- **Stack Overflow.** For years it famously served one of the busiest sites on the web from a handful of large, carefully tuned SQL Server and web machines, a deliberate choice of performance work and vertical scaling over a large horizontal fleet.
- **Kubernetes Horizontal Pod Autoscaler.** It adds or removes copies (pods) of a stateless service to keep a metric near a target, by default CPU utilisation. It is horizontal scaling automated, and it only helps if the bottleneck is the pods themselves, not a database they all call.

## Trade-offs

- **Fix performance first.** It is usually cheaper to make one request 5× faster than to run 5× more servers, and the gain compounds when you do scale.
- **Vertical scaling is simple but capped.** It is a fine first step, and the right answer for many databases, until the biggest machine is not big enough or one machine failing is not acceptable.
- **Horizontal scaling adds moving parts.** You gain capacity and redundancy, and take on load balancing, shared state, deploying many copies and harder debugging.
- **Scaling one tier moves the bottleneck.** More app servers can overwhelm the database. Plan the next bottleneck as you fix the current one.
- **Headroom costs money.** Running at 60% utilisation instead of 95% means buying more machines, and buys predictable latency at peak.

## Interview tips

- Ask early whether the concern is "slow for everyone" or "slow at peak". It tells you which problem you are solving.
- When you add servers, say what makes that work: stateless app servers, and a load balancer in front.
- Name the next bottleneck. "With more app servers, the database becomes the limit, so next I'd add read replicas or a cache."
- Use numbers: "one server handles about 1,000 requests per second, we need 10,000, so about 10 servers plus headroom."

**Common mistakes:**

- **Throwing servers at a slow request.** If one request takes 3 seconds alone, ten times the servers gives ten times the bill and the same 3 seconds.
- **Scaling the stateless tier while the database is the bottleneck.** More app servers push more concurrent load onto the shared database and make latency worse.
- **Keeping session state in server memory and then scaling out.** Users get logged out whenever the load balancer sends them to a different server.
- **Sizing for 100% utilisation.** The arithmetic says 10 servers; the queueing says latency explodes at that point. Plan for 50 to 70%.

## Common follow-up questions

### When would you choose vertical over horizontal scaling?

When the component is hard to split, the load fits on one large machine with room to grow, and a short failover is acceptable: most relational databases early in a product's life, for example. It avoids sharding, which is one of the most expensive changes to undo. Go horizontal when you outgrow the largest sensible machine, or when you need the redundancy of many copies.

### How do you know the bottleneck is the database and not the app?

Look at where requests wait. If app servers are at low CPU but request latency is high, and database CPU, I/O wait, connection count or lock waits are high, the database is the constraint. Traces make this explicit: the time is in the query spans. Then check whether the cost is a few slow queries (performance, fix with indexes or rewrites) or many fast queries (scalability, fix with replicas, caching or sharding).

### What does "linear scalability" mean, and is it realistic?

Linear means doubling machines doubles throughput. It is realistic only for work that shares nothing: stateless web servers, independent batch tasks, a well-partitioned key-value store. Anything that coordinates (transactions across shards, global locks, keeping replicas consistent) scales sub-linearly, and Amdahl's law sets the ceiling.

### Can a system have both problems at once?

Usually it does. A slow query is a performance problem at low load and becomes a scalability problem at high load, because it holds a database connection for longer and the connections run out sooner. Fixing the query helps both, which is another reason to fix performance first.

## Go deeper

- [The System Design Primer, Performance vs scalability](https://github.com/donnemartin/system-design-primer#performance-vs-scalability): the short definition, plus links to Werner Vogels' classic post on what scalability means.
- [A Word on Scalability, Werner Vogels](https://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html): Amazon's CTO on why scalability is defined by proportional growth and why redundancy is part of it.
- [PgBouncer documentation](https://www.pgbouncer.org/): how connection pooling stops a horizontally scaled app tier from overwhelming one Postgres server.
- [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/): the algorithm and defaults behind automated horizontal scaling.
