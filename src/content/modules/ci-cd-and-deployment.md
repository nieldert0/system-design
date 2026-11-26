---
slug: ci-cd-and-deployment
title: CI/CD and deployment strategies
section: devops
readFirst:
  - docker
  - load-balancers
sources:
  - id: wiki-ci
    title: Wikipedia, Continuous integration
    url: https://en.wikipedia.org/wiki/Continuous_integration
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-cd
    title: Wikipedia, Continuous delivery
    url: https://en.wikipedia.org/wiki/Continuous_delivery
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-cdep
    title: Wikipedia, Continuous deployment
    url: https://en.wikipedia.org/wiki/Continuous_deployment
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-bg
    title: Wikipedia, Blue–green deployment
    url: https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-ft
    title: Wikipedia, Feature toggle
    url: https://en.wikipedia.org/wiki/Feature_toggle
    license: CC BY-SA 4.0
    use: reworded
  - id: k8s-deploy
    title: Kubernetes Documentation, Deployments (rolling update)
    url: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
    license: CC BY 4.0
    use: reworded
  - id: fowler-canary
    title: Martin Fowler's bliki, Canary Release (Danilo Sato)
    url: https://martinfowler.com/bliki/CanaryRelease.html
    license: All rights reserved
    use: reworded
quiz:
  - prompt: What is continuous integration?
    options:
      - Merging small changes to the main branch often, with an automated build and test on each one
      - Writing code without tests
      - Running only manual QA
      - Deploying once a quarter
    correct: 0
    explanation: Frequent small merges plus automated checks catch integration problems early.
  - prompt: What is the difference between continuous delivery and continuous deployment?
    options:
      - Deployment is only for mobile apps
      - Delivery skips tests
      - There is none
      - Delivery keeps every change releasable with a manual go; deployment releases every passing change automatically
    correct: 3
    explanation: Both automate the pipeline; they differ in the final push to production.
  - prompt: How does blue-green deployment roll back?
    options:
      - It cannot roll back
      - By rebuilding the old version
      - By switching the router back to the old (still running) environment
      - By restoring a database backup
    correct: 2
    explanation: The old environment stays up until the new one is trusted.
  - prompt: What is a canary release?
    options:
      - Releasing to all users at once
      - Sending a small share of traffic to the new version first and widening it if metrics stay healthy
      - Testing only on weekends
      - Running two databases
    correct: 1
    explanation: A bad release only hurts a small slice of users, and you can roll back quickly.
  - prompt: What does a rolling update do?
    options:
      - Replaces instances a few at a time, keeping the service up
      - Stops everything, then starts the new version
      - Runs two full copies forever
      - Deploys only to staging
    correct: 0
    explanation: Kubernetes Deployments do this by default.
  - prompt: Why must database migrations be backward compatible during a rolling or canary deploy?
    options:
      - Databases cannot be changed
      - To save disk space
      - They do not need to be
      - Old and new versions of the code run at the same time against the same database
    correct: 3
    explanation: Expand first (add columns), switch the code, then contract (remove old columns) later.
  - prompt: What do feature flags let you do?
    options:
      - Speed up builds
      - Skip code review
      - Ship code turned off, then turn it on for some users without a deploy
      - Encrypt data
    correct: 2
    explanation: They separate deploying code from releasing a feature.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CiCdFlow from '#lib/diagrams/CiCdFlow.svelte';
	import CanaryFlow from '#lib/diagrams/CanaryFlow.svelte';
</script>

Shipping often and safely depends on two things: an automated pipeline, and a way to release that limits the damage of a bad change.

## What it is

**<Term id="ci-cd">CI/CD</Term>** is the practice of automating how code gets from a commit to production.

- **Continuous integration (CI):** developers merge small changes into the main branch often, and each merge is automatically built and tested. <Src id="wiki-ci" />
- **Continuous delivery:** every change that passes the pipeline is kept in a releasable state; a person decides when to release. <Src id="wiki-cd" />
- **Continuous deployment:** every passing change goes to production automatically. <Src id="wiki-cdep" />

A **deployment strategy** decides how the new version replaces the old one in production.

## How it works

**The pipeline.** A commit to the main branch triggers the pipeline. It runs the tests, builds one versioned artifact (often a container image), and deploys that same artifact to staging and then production. Any failed stage stops the pipeline. <Src id="wiki-ci" /> <Src id="wiki-cd" />

<CiCdFlow />

**Deployment strategies:**

- **Recreate:** stop the old version, start the new one. Simple, but causes downtime. <Src id="k8s-deploy" />
- **Rolling update:** replace instances a few at a time, so the service stays up. It is the default for Kubernetes Deployments. <Src id="k8s-deploy" />
- **<Term id="blue-green">Blue-green</Term>:** run two identical environments. Blue serves traffic; deploy to green, test it, then switch the router to green. Rolling back means switching back to blue. <Src id="wiki-bg" />
- **<Term id="canary-release">Canary</Term>:** send a small share of traffic to the new version, watch its error rate and latency, then widen the share step by step until it takes all traffic, or roll back. <Src id="fowler-canary" />

<CanaryFlow />

**Feature flags** let you deploy code switched off and turn it on later, for some or all users, without another deploy. <Src id="wiki-ft" />

**Database changes.** During a rolling or canary deploy, old and new code run at the same time against one database, so schema changes must work with both: add new columns first, switch the code, and remove old ones in a later release.

## Trade-offs

| Strategy | Downtime | Rollback | Extra cost | Risk exposure |
| --- | --- | --- | --- | --- |
| Recreate | Yes | Redeploy old | None | Everyone at once |
| Rolling | No | Roll forward or back, slowly | Little | Grows as it rolls |
| Blue-green | No | Instant switch | Double capacity during deploy | Everyone at switch time |
| Canary | No | Fast, for a few users | Little; needs good metrics | Small slice first |

- **Canaries need good monitoring** and automated checks, or a bad version just spreads slowly. <Src id="fowler-canary" />
- **Feature flags add code paths** that must be cleaned up later. <Src id="wiki-ft" />

## Interview tips

- Mention a CI/CD pipeline that builds one image and promotes it through environments.
- Pick canary or blue-green for risky changes and say how you roll back.
- Bring up backward-compatible schema changes when old and new code overlap.
