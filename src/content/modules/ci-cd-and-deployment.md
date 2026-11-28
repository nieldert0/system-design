---
slug: ci-cd-and-deployment
title: CI/CD and deployment strategies
section: devops
readFirst:
  - docker
  - kubernetes
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
  - prompt: In the worked example, a bad release fails 2% of requests at 5,000 requests/s and takes 10 minutes to detect. Roughly how many requests fail with an all-at-once release, compared with a 5% canary?
    options:
      - About 60,000 against 3,000
      - The same number, just later
      - About 3,000 against 60
      - About 600,000 against 30,000
    correct: 0
    explanation: All at once, 5,000 × 0.02 × 600 s = 60,000. With 5% of traffic on the canary, only 250 requests/s see the bug, so 250 × 0.02 × 600 = 3,000.
  - prompt: Why does a canary at 1% of traffic need careful statistics before you promote it?
    options:
      - Small traffic makes the canary faster
      - With few requests, a real error-rate difference can be hidden by noise, so you need enough requests or time before deciding
      - Canaries cannot be measured
      - 1% is always enough
    correct: 1
    explanation: Compare the canary against a baseline of the same size and give it enough samples; otherwise a bad version looks healthy by luck.
  - prompt: What does a rolling update do?
    options:
      - Replaces instances a few at a time, keeping the service up
      - Stops everything, then starts the new version
      - Runs two full copies forever
      - Deploys only to staging
    correct: 0
    explanation: Kubernetes Deployments do this by default.
  - prompt: You want to rename a column from email to email_address during a rolling deploy. What is the safe order?
    options:
      - Rename the column, then deploy the code
      - Deploy code that reads the new name, then rename
      - Add email_address, write both and backfill, switch reads to the new column, and drop email in a later release
      - Take the site down for the rename
    correct: 2
    explanation: This is expand and contract. Old and new code run together during the rollout, so each step must work with both.
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

Shipping often and safely depends on two things: an automated pipeline that turns a commit into a tested, versioned artifact, and a release strategy that limits how many users a bad change can hurt before you notice.

## What it is

Here is the problem. A team of 30 engineers merges their work once a month. Merge day takes a week of fixing conflicts, a person builds the release on their laptop, someone copies it to every server over SSH one evening, and when it breaks, everyone is affected at once and nobody knows which of 400 changes caused it. Releases become rare because they are scary, and they are scary because they are rare and large.

**<Term id="ci-cd">CI/CD</Term>** breaks that cycle by automating how code gets from a commit to production, so each release is small and routine.

- **Continuous integration (CI):** developers merge small changes into the main branch often, at least daily, and every merge is automatically built and tested. Conflicts and broken tests show up within minutes, while the change is still fresh in the author's head. <Src id="wiki-ci" />
- **Continuous delivery:** every change that passes the pipeline is kept in a releasable state, and releasing is one button press that a person decides when to press. <Src id="wiki-cd" />
- **Continuous deployment:** there is no button; every passing change goes to production automatically. <Src id="wiki-cdep" />

The second half is the **deployment strategy**: how the new version replaces the old one in production. Even with perfect tests, some bugs only show up under real traffic, so the strategy decides how much damage such a bug does, how quickly you see it, and how quickly you can undo it.

## How it works

### The pipeline

A commit to the main branch triggers the pipeline. It runs fast checks first (lint, unit tests), then builds **one versioned artifact**, usually a [container image](/modules/docker) tagged with the commit hash, and runs slower integration tests against it. That same artifact is then deployed to staging and, after it passes there, promoted to production. Any failed stage stops the pipeline. <Src id="wiki-ci" /> <Src id="wiki-cd" />

The "build once, promote the same bytes" rule matters. If each environment rebuilds from source, production may get a different dependency version than the one you tested, and "it passed staging" stops meaning anything.

<CiCdFlow />

### Deployment strategies

- **Recreate:** stop the old version, start the new one. Simple, but there is downtime between the two, and everyone gets the new version at once. <Src id="k8s-deploy" />
- **Rolling update:** replace instances a few at a time, so the service stays up throughout. Each new instance must pass its readiness [health check](/modules/kubernetes) before an old one is removed. It is the default for Kubernetes Deployments. Rolling back is another rolling update in the other direction, so it takes as long as the rollout did. <Src id="k8s-deploy" />
- **<Term id="blue-green">Blue-green</Term>:** run two identical environments. Blue serves all traffic; you deploy to green, test it with production config, then switch the [load balancer](/modules/load-balancers) or DNS to green. Rolling back means switching back to blue, which is still running, so it takes seconds. The cost is double capacity during the switch, and every user moves at the same moment. <Src id="wiki-bg" />
- **<Term id="canary-release">Canary</Term>:** send a small share of traffic, say 1% or 5%, to the new version, compare its error rate and latency with the old version's, then widen the share step by step (5%, 25%, 50%, 100%) until it takes all traffic, or roll back. A bad release hurts only the slice that saw it. <Src id="fowler-canary" />

<CanaryFlow />

Automating the canary's decision, with a controller that reads metrics and promotes or aborts on its own, is called **<Term id="progressive-delivery">progressive delivery</Term>**.

### Feature flags

A **<Term id="feature-flag">feature flag</Term>** is a runtime switch in the code: `if flags.enabled("new-checkout", user)`. You deploy the code with the flag off, then turn it on for employees, then 1% of users, then everyone, without another deploy. If it misbehaves, you turn it off in seconds. Flags separate *deploying* code (moving bits to servers) from *releasing* a feature (letting users see it), which also lets unfinished work merge to main safely. <Src id="wiki-ft" />

### Database changes

During a rolling or canary deploy, old and new code run at the same time against one database. A schema change that the old code cannot handle breaks it mid-rollout, and a rollback to old code breaks again. So schema changes follow **<Term id="expand-contract">expand and contract</Term>**: first *expand* (add the new column or table in a way old code ignores), then deploy code that writes both, backfill old rows, switch reads to the new form, and only in a later release *contract* (drop what is no longer used). Each step is safe with the versions on either side of it.

## Worked example

A checkout service handles **5,000 requests/s** at a normal error rate of **0.1%**. Version 2.7 has a bug that fails **2% of requests** (for one card type). With the team's dashboards and alerts, it takes about **10 minutes** to notice a problem and decide to roll back.

**Option A, recreate or all-at-once.** Every request sees the bug. Over 10 minutes, 5,000 × 0.02 × 600 s = **60,000 failed checkouts**. Rollback means redeploying 2.6, another few minutes of failures, so call it 70,000 or more.

**Option B, rolling update** across 20 pods with `maxSurge: 25%`, about 1 minute per batch of 5. After 4 minutes all pods run 2.7. Failures ramp from 25% of traffic to 100%, so the 10 minutes cost roughly 50,000 failures, and the rollback is another 4-minute rolling update. Rolling avoids downtime; it does not limit blast radius much.

**Option C, blue-green.** The switch is instant, so failures run at the full 2% for the 10 minutes, about 60,000, but rollback is a single switch back to blue, taking seconds. Blue-green makes recovery fast, not exposure small.

**Option D, canary at 5%.** 250 requests/s go to 2.7. Over 10 minutes, 250 × 0.02 × 600 = **3,000 failures**, 20× fewer than Option A. Rollback is setting the canary weight to 0.

**Can you detect it at all?** On the canary, the error rate rises from 0.1% to 2.1%, out of 250 requests/s, so about 5 errors/s against an expected 0.25/s. Within a minute that is roughly 300 errors against an expected 15, an unmistakable signal, and an automated analysis could abort after 1 to 2 minutes, cutting failures to a few hundred. At a **1% canary** the same check sees 50 requests/s and about 1 extra error a second, still detectable in a few minutes. But a subtler bug, say +0.05% errors, would produce about 1.5 extra errors a minute at 1%, which is lost in normal noise. Small canaries are cheap in damage and slow to give an answer, which is why canary analysis compares against a same-sized baseline and waits for enough requests.

**The schema trap.** Version 2.7 also renamed `cards.number` to `cards.pan` in a migration that ran before the rollout. The 95% of traffic still on 2.6 starts failing immediately, so the canary protects nothing. Done with expand and contract (add `pan`, write both, backfill, switch reads, drop `number` in 2.9), every step works with the old and new code.

## In the real world

- **GitHub Actions, GitLab CI and Jenkins.** Pipelines are defined in the repository (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`), run on every push or pull request, and use protected branches with required status checks so nothing merges to main without a green build. Caching dependencies between runs (`actions/cache`) is the usual first fix for slow pipelines.
- **Kubernetes Deployments.** Rolling update by default with `maxSurge: 25%` and `maxUnavailable: 25%`; `minReadySeconds` makes each new pod stay ready for a while before the rollout counts it; `progressDeadlineSeconds` (default 600) marks a stuck rollout as failed; `kubectl rollout undo` rolls back to the previous ReplicaSet. <Src id="k8s-deploy" />
- **Argo Rollouts and Flagger.** Kubernetes controllers for progressive delivery. A Rollout lists canary steps such as `setWeight: 5`, `pause: 10m`, `setWeight: 25`, with an analysis that queries Prometheus (for example "error rate under 1%") and aborts automatically if it fails.
- **Google's canarying.** The SRE workbook describes evaluating canaries against a control group of the same size, on the same metrics, rather than against the whole fleet, so differences in load or time of day do not hide or fake a regression.
- **LaunchDarkly and Unleash.** Feature-flag services with per-user targeting and percentage rollouts; flags are evaluated locally in the SDK from a cached rule set, so flag checks add microseconds, not a network call.

## Trade-offs

| Strategy | Downtime | Rollback | Extra cost | Risk exposure |
| --- | --- | --- | --- | --- |
| Recreate | Yes | Redeploy old | None | Everyone at once |
| Rolling | No | Roll back, as slowly as it rolled out | Little (surge pods) | Grows as it rolls |
| Blue-green | No | Instant switch | Double capacity during deploy | Everyone at switch time |
| Canary | No | Fast, for a few users | Little; needs good metrics | Small slice first |

- **Canaries need good monitoring** and automated checks, or a bad version just spreads slowly. See [Observability](/modules/observability). <Src id="fowler-canary" />
- **Feature flags add code paths** that must be cleaned up later; a codebase with hundreds of stale flags has more combinations than anyone tests. <Src id="wiki-ft" />
- **Speed against safety.** More pipeline stages and longer canary pauses catch more bugs but slow every fix, including the urgent one. Most teams keep the pipeline under about 15 minutes and allow a faster, still automated, path for hotfixes.

## Interview tips

- Mention a CI/CD pipeline that builds one image per commit and promotes the same image through environments.
- Pick canary for risky changes, blue-green when instant rollback matters most, and say what metric decides promotion.
- Bring up backward-compatible schema changes (expand and contract) when old and new code overlap.
- Mention feature flags as the way to separate deploy from release.

**Common mistakes:**

- Rebuilding the artifact per environment, so production runs bytes nobody tested.
- Running a canary with no automated check against a baseline. A person glancing at a dashboard misses a 1% regression.
- Shipping a destructive migration (rename, drop, type change) in the same release as the code that needs it, which breaks the old version still running and makes rollback impossible.
- Calling blue-green a way to reduce risk. It makes rollback fast, but every user is still switched at once.

## Common follow-up questions

### How do you roll back a release that already ran a database migration?

You design so you never have to undo the migration. With expand and contract, the migration that shipped only added things, so the old code still works against the new schema and rollback is just deploying the old code. Destructive steps ship later, after the new code has been stable for a while. If you truly must reverse a change, you roll forward with a new migration instead of restoring a backup, which would lose every write since.

### Canary or blue-green?

Canary when you want to limit how many users see a bad change and you have good per-version metrics; it is the default for large user-facing services. Blue-green when you need an instant, whole-fleet switch and rollback, such as for changes that cannot run mixed (a protocol change between two components), or when traffic is too low for a canary to give a statistically useful signal.

### How do you deploy a change that spans two services?

Make each service tolerate both versions of the other. Ship the provider first with the new API added beside the old one, then ship the consumer that uses it, then remove the old API later. The same expand-and-contract idea applies to APIs and message formats as to schemas. Coordinated "deploy both at once" releases are fragile because a rollout or rollback of one is never truly simultaneous with the other.

### How do you keep a pipeline fast as the codebase grows?

Run fast checks first and fail early, cache dependencies and build layers, run tests in parallel shards, and only run the tests affected by a change in a monorepo. Track pipeline time as a metric; once it passes 20 to 30 minutes, people batch changes to avoid waiting, and small, frequent integration stops happening.

### What should trigger an automatic rollback?

Metrics users feel, compared with the current version: error rate, latency percentiles, and business signals such as checkout success. Set thresholds relative to the baseline (for example canary error rate more than 0.5 points above baseline for 2 minutes) rather than absolute ones, so normal daily variation does not cause false aborts.

## Go deeper

- [Google SRE workbook, Canarying releases](https://sre.google/workbook/canarying-releases/): how Google sizes canaries, picks metrics, and compares against a control group.
- [Feature Toggles (Pete Hodgson, martinfowler.com)](https://martinfowler.com/articles/feature-toggles.html): the kinds of flags, how long each should live, and how to keep them from piling up.
- [Parallel Change (martinfowler.com)](https://martinfowler.com/bliki/ParallelChange.html): the expand, migrate and contract pattern for changing interfaces and schemas safely.
- [Argo Rollouts](https://argo-rollouts.readthedocs.io/en/stable/): a working progressive-delivery controller, with canary steps and metric-based analysis.
