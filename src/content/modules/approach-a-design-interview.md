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
    use: copied
quiz:
  - prompt: Who is expected to lead a system design interview?
    options:
      - The interviewer, step by step
      - You, the candidate
      - Nobody; it is a fixed checklist
      - Whoever draws the first box
    correct: 1
    explanation: The interview is an open-ended conversation and you are expected to lead it.
  - prompt: What should you do first when given "Design a URL shortener"?
    options:
      - Pick a database
      - Draw the load balancer
      - Ask about use cases, scale and constraints
      - Write the API code
    correct: 2
    explanation: Step 1 is to gather requirements and scope the problem before designing anything.
  - prompt: Which question helps you size the system?
    options:
      - Which cloud provider do you like?
      - How many requests per second do we expect?
      - Should we use tabs or spaces?
      - What colour is the logo?
    correct: 1
    explanation: Requests per second, data volume and the read to write ratio decide how big the system must be.
  - prompt: What belongs in the high level design step?
    options:
      - The main components and how they connect, with reasons
      - Every database column
      - Exact server counts per region
      - The deployment pipeline
    correct: 0
    explanation: Sketch the main components and connections, and justify your ideas. Details come in step 3.
  - prompt: When do you add load balancers, caching or sharding?
    options:
      - Always, from the first sketch
      - Never; interviewers dislike them
      - When scaling the design, to fix bottlenecks the constraints expose
      - Only if the interviewer names them
    correct: 2
    explanation: Step 4 identifies bottlenecks, given the constraints, and then picks fixes for them.
  - prompt: The interviewer asks "why not just use a cache?" What makes a strong answer?
    options:
      - "Caches are always good."
      - Name what the cache improves, what it costs, and when you'd add it
      - Refuse to change the design
      - Add three more caches
    correct: 1
    explanation: Everything is a trade-off. Showing the cost as well as the benefit is what interviewers listen for.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import InterviewGrowsFlow from '#lib/diagrams/InterviewGrowsFlow.svelte';
</script>

A design interview is a conversation you lead. Work through four steps: scope the problem, sketch a high-level design, go deep on the core parts, then scale it.

## What it is

The system design interview is an **open-ended conversation**. You are expected to lead it. <Src id="primer" />

There is no single right answer. The interviewer watches how you turn a vague prompt ("design a URL shortener") into clear requirements, a working design and a reasoned set of trade-offs.

## How it works

You can use the following steps to guide the discussion. <Src id="primer" />

### Step 1: Outline use cases, constraints, and assumptions

Gather requirements and scope the problem. Ask questions to clarify use cases and constraints. Discuss assumptions. <Src id="primer" />

- Who is going to use it?
- How are they going to use it?
- How many users are there?
- What does the system do?
- What are the inputs and outputs of the system?
- How much data do we expect to handle?
- How many requests per second do we expect?
- What is the expected read to write ratio?

Write the answers down where the interviewer can see them. They are the numbers you will design against.

### Step 2: Create a high level design

Outline a high level design with all important components. <Src id="primer" />

- Sketch the main components and connections
- Justify your ideas

A first sketch is often just clients, a <Term id="load-balancer">load balancer</Term>, a few app servers and a database. Make it work end to end before making it big.

### Step 3: Design core components

Dive into details for each core component. <Src id="primer" /> For a URL shortener that means how you generate and store the short code, how a short code turns back into the full URL, and what the API looks like.

### Step 4: Scale the design

Identify and address bottlenecks, given the constraints. <Src id="primer" /> Ask whether you need a load balancer, <Term id="horizontal-scaling">horizontal scaling</Term>, caching or database <Term id="sharding">sharding</Term>, and for each one say what problem it solves.

Discuss potential solutions and trade-offs. Everything is a trade-off. <Src id="primer" />

<InterviewGrowsFlow />

### Estimates

You might be asked to do some estimates by hand. <Src id="primer" /> See [Back-of-the-envelope numbers](/modules/back-of-the-envelope) for the numbers and the method.

## Trade-offs

- **Breadth vs depth.** Covering every box shallowly reads as memorised. Going deep on one part and skipping the rest leaves the design broken. Do a quick end-to-end pass first, then go deep where the interviewer leads.
- **Asking vs assuming.** Too many questions stalls the interview. Too few and you design the wrong system. Ask the few that change the design (scale, read/write ratio, consistency needs), then state your assumptions for the rest.
- **Simple vs scalable.** Start with the simplest design that works. Add complexity only when a requirement or bottleneck forces it, and say which one.

## Interview tips

- Spend the first 5–10 minutes on requirements. Write down users, requests per second, data size and the read to write ratio.
- Think out loud. Silence hides the reasoning that is being graded.
- Draw the request path from the client to the data and back before adding anything else.
- For every component you add, say what it fixes and what it costs.
- Expect "what if traffic grows 10×?" and "what fails first?" Have a bottleneck in mind.
- Keep an eye on the clock. Leave time to scale the design; that is where most of the signal is.
