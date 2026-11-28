---
slug: approach-a-design-interview
title: How to approach a design interview
section: start-here
readFirst: []
sources:
  - id: primer
    title: The System Design Primer, How to approach a system design interview question
    url: https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question
    license: CC BY 4.0
    use: reworded
quiz:
  - prompt: Who is expected to lead a system design interview?
    options:
      - The interviewer, step by step
      - You, the candidate
      - Nobody; it is a fixed checklist
      - Whoever draws the first box
    correct: 1
    explanation: The interview is an open-ended conversation and you are expected to drive it, while following the interviewer's hints.
  - prompt: What should you do first when given "Design a URL shortener"?
    options:
      - Pick a database
      - Draw the load balancer
      - Ask about use cases, scale and constraints
      - Write the API code
    correct: 2
    explanation: Step 1 is to gather requirements and scope the problem before designing anything.
  - prompt: Which of these is a non-functional requirement?
    options:
      - Users can create a short link
      - Redirects must answer in under 50 ms at p99
      - Users can delete their links
      - Links can have a custom alias
    correct: 1
    explanation: Functional requirements say what the system does. Non-functional ones say how well it must do it, such as latency, availability and scale.
  - prompt: In the worked example, the shortener expects 100 million new links a month and a 100:1 read to write ratio. Roughly what is the average redirect rate?
    options:
      - About 40 per second
      - About 400 per second
      - About 4,000 per second
      - About 40,000 per second
    correct: 2
    explanation: 10^8 writes a month / 2.5 × 10^6 seconds ≈ 40 writes per second, and 100 reads per write gives about 4,000 redirects per second.
  - prompt: In the worked example, why does the candidate add a cache in step 4 and not before?
    options:
      - Caches are always added last by convention
      - The estimate showed reads dominate and a small hot set of links serves most redirects, so the database read path is the bottleneck a cache removes
      - The interviewer asked for one
      - Writes are too slow
    correct: 1
    explanation: Every component should be added to fix a bottleneck the numbers expose. With 100 reads per write and popular links, the read path is that bottleneck.
  - prompt: The interviewer asks "why not just use a cache?" What makes a strong answer?
    options:
      - "Caches are always good."
      - Name what the cache improves, what it costs, and when you'd add it
      - Refuse to change the design
      - Add three more caches
    correct: 1
    explanation: Everything is a trade-off. Showing the cost as well as the benefit is what interviewers listen for.
  - prompt: You are 35 minutes into a 45-minute interview and still detailing the database schema. What is the best move?
    options:
      - Keep going; depth is always rewarded
      - Summarise the schema in a sentence and move on to scaling and bottlenecks
      - Start the design over
      - Ask the interviewer to extend the time
    correct: 1
    explanation: Scaling and trade-offs carry most of the signal. Running out of time before reaching them is one of the most common ways to fail.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import InterviewGrowsFlow from '#lib/diagrams/InterviewGrowsFlow.svelte';
</script>

A design interview is a conversation you lead. Work through four steps: scope the problem, sketch a high-level design, go deep on the core parts, then scale it. Every box you draw should be there because a number or a requirement put it there.

## What it is

Here is the failure this module is about. A candidate hears "design a URL shortener", says "sure", and draws a load balancer, Kafka, three databases and a cache in the first two minutes. Twenty minutes later the interviewer asks how many links a day it stores, and the candidate does not know, so nobody can tell whether any of those boxes were needed. The design might even be fine, but it reads as memorised, and the interviewer has learned nothing about how the candidate thinks.

A system design interview is an **open-ended conversation that you are expected to lead**. <Src id="primer" /> There is no single right answer. The interviewer gives you a vague prompt and watches how you turn it into three things: clear requirements, a design that works end to end, and a reasoned set of trade-offs. They are grading the reasoning, so the reasoning has to be visible.

A reliable way to make it visible is a four-step structure, which most interview guides share in some form: <Src id="primer" />

1. Outline use cases, constraints and assumptions.
2. Create a high-level design.
3. Design the core components.
4. Scale the design.

The structure keeps you from skipping requirements, keeps you from drowning in detail too early, and leaves time for the scaling discussion where most of the signal lives.

## How it works

### Step 1: Outline use cases, constraints and assumptions

Gather requirements and scope the problem before designing anything. Ask questions to pin down the use cases and the constraints, and say your assumptions out loud so the interviewer can correct them. <Src id="primer" />

Split what you learn into two lists:

- **<Term id="functional-requirements">Functional requirements</Term>**: what the system does. "Users can shorten a URL. Visiting the short URL redirects to the original. Links can expire."
- **<Term id="non-functional-requirements">Non-functional requirements</Term>**: how well it must do it. Scale, <Term id="latency">latency</Term>, availability, consistency, durability, cost.

Questions that usually change the design:

- Who uses it, and how? (A public consumer app, an internal tool, an API for other services.)
- How many users, and how many requests per second at peak?
- How much data is stored, and for how long?
- What is the read to write ratio?
- How fresh must reads be? Is it acceptable for a new link to take a second to work everywhere?
- What are the inputs and outputs of the system?

Write the answers where the interviewer can see them. They are the numbers you will design against, and you will refer back to them in step 4. Then turn them into a quick estimate: requests per second, storage per year, network bandwidth. [Back-of-the-envelope numbers](/modules/back-of-the-envelope) covers the method.

Scope out explicitly what you will not cover ("I'll skip analytics and user accounts unless you want them"). That is not dodging; it is managing a 45-minute budget.

### Step 2: Create a high-level design

Sketch the main components and the connections between them, and justify each one. <Src id="primer" /> The first sketch is usually small: clients, a <Term id="load-balancer">load balancer</Term>, a few application servers and a database. Make it work end to end first: trace one write and one read through it, say what each box does with the request, and name the API calls (`POST /links`, `GET /{code}`).

The goal of this step is a design that is correct for the requirements, not one that is already big. If the estimate says 50 requests per second, one server and one database may genuinely be the right answer, and saying so shows judgement.

### Step 3: Design the core components

Go into detail on the parts that make this system different from every other system. <Src id="primer" /> For a URL shortener that means how the short code is generated (a counter encoded in <Term id="base62">base62</Term>, or a hash of the URL), how collisions are avoided, what the table looks like, and how a code is looked up on redirect. For a chat app it would be message delivery and ordering; for a feed it would be how the timeline is assembled.

Let the interviewer steer here. If they ask about one component, go deep on it, then come back to the structure.

### Step 4: Scale the design

Find the bottlenecks, given the constraints from step 1, and address them. <Src id="primer" /> Walk the request path and ask, for each box, what breaks first at the target load. The usual tools are <Term id="horizontal-scaling">horizontal scaling</Term> of stateless servers behind a load balancer, a <Term id="cache">cache</Term> in front of hot reads, <Term id="replication">replication</Term> for read capacity and availability, database <Term id="sharding">sharding</Term> once one database cannot hold the data or the writes, and a <Term id="message-queue">message queue</Term> to move slow work off the request path.

For each one, say which bottleneck it fixes and what it costs. Everything is a trade-off. <Src id="primer" /> [Performance vs scalability](/modules/performance-vs-scalability) explains how to tell a slow request from a system that cannot take more load, which is the first question of this step, and [Latency vs throughput](/modules/latency-vs-throughput) gives you the vocabulary to state targets.

<InterviewGrowsFlow />

### A time budget

For a 45-minute interview, a workable split is about 5 to 10 minutes on step 1, 10 on step 2, 10 to 15 on step 3, and 10 on step 4, with a couple of minutes left for your own questions. Glance at the clock at each step boundary.

## Worked example

Here is the URL shortener run through the four steps with real numbers, as a candidate might say it.

**Step 1, requirements (7 minutes).** The candidate asks and the interviewer answers:

- Functional: shorten a URL, redirect on visit, optional expiry. No custom aliases, no analytics for now.
- Scale: 100 million new links a month.
- Read to write ratio: about 100 redirects per new link.
- Latency: redirects should feel instant, so the candidate proposes under 50 ms at <Term id="percentile">p99</Term> (the slowest 1 in 100 requests), and the interviewer agrees.
- Retention: keep links for 5 years.

The estimate, rounding a month to 2.5 × 10^6 seconds:

- Writes: 10^8 / 2.5 × 10^6 ≈ **40 per second**, maybe 200 at peak.
- Reads: 40 × 100 ≈ **4,000 per second**, maybe 20,000 at peak.
- Storage: 10^8 links a month × 60 months = 6 × 10^9 links. At about 500 bytes each (URL, code, timestamps) that is 3 × 10^12 bytes, **about 3 TB**.
- Code length: 6 × 10^9 links need a code space bigger than that. Base62 with 7 characters gives 62^7 ≈ 3.5 × 10^12, plenty.

The candidate says the conclusion out loud: "Writes are small. Reads dominate, 100 to 1. Storage fits on a few machines. So the hard part is serving redirects fast and reliably, not storing data."

**Step 2, high-level design (8 minutes).** Clients call a load balancer in front of stateless app servers, which talk to one database. `POST /links` with a long URL returns a short code. `GET /{code}` looks up the code and answers with an HTTP 301 or 302 redirect. The candidate traces both requests through the boxes.

**Step 3, core components (12 minutes).** The candidate picks a counter-based code: each app server reserves a block of 1,000 IDs from the database at a time and encodes each ID in base62, so codes never collide and servers do not need to coordinate per request. The table is `links(code PRIMARY KEY, long_url, created_at, expires_at)`, and the redirect is a single primary-key lookup. The interviewer asks about 301 vs 302: a 301 (permanent) is cached by browsers, which cuts load but hides repeat visits from any future analytics; the candidate picks 302 (temporary) to keep the option open and notes the cost.

**Step 4, scale (12 minutes).** At 20,000 redirects per second at peak, one database doing primary-key reads at maybe 5,000 per second is the bottleneck. The candidate adds a cache: if 20% of links get 80% of traffic, caching recent and popular codes in memory gives a <Term id="hit-ratio">hit ratio</Term> around 90%, so the database sees about 2,000 reads per second. Read replicas cover the rest and survive a node loss. Writes, at 200 per second, need no sharding; 3 TB over five years fits on one primary with replicas, and the candidate mentions sharding by code as the next step if growth is ten times higher. Last, the candidate names what fails first next: "If the cache cluster goes down, the database sees all 20,000 reads, so I'd run the cache replicated and rate-limit cache misses."

The whole design came from the numbers in step 1. That is what the interviewer wanted to see. [The URL shortener case study](/modules/url-shortener) goes much deeper on the same problem.

## In the real world

- **Google's design documents.** Google engineers write a design doc before building anything sizeable, with sections for context and scope, goals and non-goals, the design, alternatives considered, and cross-cutting concerns such as security and privacy. The interview is a 45-minute spoken version of one, and "non-goals" is exactly the scoping move from step 1.
- **Amazon's "working backwards".** Amazon starts new products from a press release and FAQ written from the customer's point of view, before any architecture. Its interviewers tend to push hard on requirements and on what happens when something fails, so step 1 and failure handling in step 4 matter even more there.
- **The Google Cloud Architecture Framework and AWS Well-Architected.** Both clouds publish checklists of non-functional pillars (reliability, security, cost, performance, operational excellence). They are a ready-made list of the non-functional questions worth asking in step 1.
- **Meta's product and infrastructure design rounds.** Meta splits system design into a product-flavoured round (APIs, data model, user-facing behaviour) and an infrastructure-flavoured one (storage, replication, scale). The four steps are the same, but where you spend time in step 3 changes, so ask your recruiter which one you have.

## Trade-offs

- **Breadth vs depth.** Covering every box shallowly reads as memorised. Going deep on one part and skipping the rest leaves the design broken. Do a quick end-to-end pass first, then go deep where the interviewer leads.
- **Asking vs assuming.** Too many questions stall the interview. Too few and you design the wrong system. Ask the few that change the design (scale, read to write ratio, consistency needs), then state your assumptions for the rest.
- **Simple vs scalable.** Start with the simplest design that works. Add complexity only when a requirement or bottleneck forces it, and say which one.
- **Precision vs speed in estimates.** Round to powers of ten. A factor-of-two error rarely changes the design; a five-minute long division always costs time.

## Interview tips

- Spend the first 5 to 10 minutes on requirements. Write down users, requests per second, data size and the read to write ratio.
- Think out loud. Silence hides the reasoning that is being graded.
- Draw the request path from the client to the data and back before adding anything else.
- For every component you add, say what it fixes and what it costs.
- Expect "what if traffic grows 10×?" and "what fails first?" Have a bottleneck in mind.
- Keep an eye on the clock. Leave time to scale the design; that is where most of the signal is.

**Common mistakes:**

- **Jumping to the solution.** Naming technologies before requirements means you cannot justify any of them.
- **Buzzword stacking.** Adding Kafka, <Term id="microservices">microservices</Term> and sharding to a system with 50 requests per second signals the opposite of judgement.
- **Running out of time in step 3.** Spending 30 minutes on a schema and never reaching scaling or failure handling.
- **Never stating assumptions.** If you assume 1 KB per item and the interviewer meant 1 MB, the whole design is off, and you will not find out unless you said it.
- **Treating the interviewer as an examiner instead of a colleague.** Their hints ("what about hot links?") are steering. Follow them.

## Common follow-up questions

### What if the interviewer gives you no numbers?

Propose them and ask for confirmation: "I'll assume 10 million daily users and 10 actions each, so about 1,000 requests per second, peaking at 5,000. Does that sound right?" An interviewer who wanted different numbers will say so. Never design without any scale at all.

### How do you handle a part of the design you don't know well?

Say so briefly, reason from first principles, and describe the properties you need rather than a product name: "I need a store with fast key lookups and replication; something like DynamoDB or Cassandra would fit, but the key point is a partitioned key-value store." Interviewers value honest reasoning far more than confident guessing.

### The interviewer changes a requirement halfway. What now?

Treat it as a gift: it is a scaling or trade-off question in disguise. Restate the new requirement, say which part of your design it breaks, and change only that part. "If links must work in all regions within 100 ms, a single-region database no longer works, so I'd replicate reads to each region and accept a short delay before new links work everywhere."

### How do you know when to stop going deep?

When you have explained how the component meets its requirement and named its main trade-off, stop and offer a choice: "I can go deeper on ID generation, or move on to scaling. Which is more useful?" That keeps the interviewer in control of depth and you in control of the clock.

## Go deeper

- [The System Design Primer, How to approach a system design interview question](https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question): the original four-step outline with sample questions and links to solved exercises.
- [Design Docs at Google](https://www.industrialempathy.com/posts/design-docs-at-google/): Malte Ubl's description of how real design documents are structured, which mirrors what interviewers want to hear.
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/): a practitioner's checklist of non-functional requirements (reliability, cost, security, performance) to borrow for step 1.
