---
slug: twitter-timeline
title: Design the Twitter timeline and search
section: case-studies
readFirst:
  - approach-a-design-interview
  - where-to-cache
  - queues-and-back-pressure
sources:
  - id: primer-twitter
    title: System Design Primer, Design the Twitter timeline and search
    url: https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md
    license: CC BY 4.0
    use: reworded
  - id: wiki-inverted-index
    title: Wikipedia, Inverted index
    url: https://en.wikipedia.org/wiki/Inverted_index
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does fan-out on write do when a user posts?
    options:
      - Nothing until a follower reads
      - Pushes the tweet ID into every follower's precomputed timeline
      - Deletes old tweets
      - Sends the tweet only to the search index
    correct: 1
    explanation: The work is done at write time so reads are a single cache lookup.
  - prompt: Why is fan-out on write a problem for users with millions of followers?
    options:
      - One tweet turns into millions of timeline writes, which is slow and costly
      - Their tweets are too long
      - Caches cannot store their tweets
      - Search stops working
    correct: 0
    explanation: The common fix is a hybrid that merges celebrity tweets in at read time.
  - prompt: Why store tweet IDs, not full tweets, in each timeline?
    options:
      - IDs are encrypted
      - Full tweets are not allowed in a cache
      - It keeps each timeline small; the tweet itself is stored once and looked up by ID
      - IDs sort alphabetically
    correct: 2
    explanation: Copying the whole tweet to every follower would multiply storage.
  - prompt: How does search find tweets that contain a word?
    options:
      - Scanning every tweet in the database
      - Asking each follower
      - Reading the home timeline cache
      - An inverted index that maps each word to the tweets containing it
    correct: 3
    explanation: Queries hit the index, shards in parallel, and the results are merged and ranked.
  - prompt: Which way is the timeline workload skewed?
    options:
      - Far more reads than writes
      - Far more writes than reads
      - Equal reads and writes
      - Only writes
    correct: 0
    explanation: The primer estimates billions of timeline reads against hundreds of millions of tweets a month.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TimelineFanoutFlow from '#lib/diagrams/TimelineFanoutFlow.svelte';
</script>

Users post short messages and read a home timeline built from everyone they follow. The hard part is making that timeline fast for hundreds of millions of readers. This walk-through follows the steps from [How to approach a design interview](/modules/approach-a-design-interview).

## What it is

**Step 1, requirements.** A user posts a tweet; their followers see it in their home timeline; anyone can view a user's own tweets; and users can search tweets by keyword. <Src id="primer-twitter" /> The primer assumes 100 million active users, 500 million tweets a day and 250 billion timeline reads a month: reads outnumber writes by a wide margin, and fresh tweets should appear within seconds. <Src id="primer-twitter" />

## How it works

**Step 2, high-level design.** A write API stores tweets, a fan-out service builds timelines, a memory cache holds each user's home timeline, and a search service with its own index answers keyword queries. <Src id="primer-twitter" />

**Step 3, posting and reading.** A tweet is stored once. Then **<Term id="fan-out-on-write">fan-out on write</Term>** looks up the author's followers and pushes the tweet ID into each follower's timeline list in the cache. Reading the home timeline is now a single lookup of that list, followed by a batch fetch of the tweets by ID. <Src id="primer-twitter" /> The fan-out runs asynchronously from a [queue](/modules/queues-and-back-pressure), so posting stays fast.

<TimelineFanoutFlow />

**Search.** The search service tokenizes each new tweet and adds it to an **inverted index**, a map from each word to the tweets that contain it. A query is sent to every index shard, and the results are merged and ranked. <Src id="wiki-inverted-index" /> <Src id="primer-twitter" />

**Step 4, scale.** Store tweets in a sharded database ([sharding](/modules/federation-sharding-denormalization)) with read replicas, and keep only recent timelines (a few hundred IDs per active user) in the cache. <Src id="primer-twitter" />

## Trade-offs

| | Fan-out on write (push) | Fan-out on read (pull) |
| --- | --- | --- |
| Post cost | One write per follower | One write |
| Read cost | One cache read | Merge every followed user's tweets |
| Celebrity users | Millions of writes per tweet | Fine |

- **The usual answer is a hybrid**: push for most users, and merge tweets from very popular accounts in at read time. <Src id="primer-twitter" />
- **Cached timelines cost memory**, so inactive users are skipped and their timelines rebuilt on demand. <Src id="primer-twitter" />

## Interview tips

- Show that reads dwarf writes, then argue for precomputed timelines.
- Bring up the celebrity problem yourself and offer the hybrid.
- Keep search a separate service with its own index; don't query the tweet database with LIKE.
