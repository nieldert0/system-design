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
    explanation: Queries hit the index shards in parallel, and the results are merged and ranked.
  - prompt: Which way is the timeline workload skewed?
    options:
      - Far more reads than writes
      - Far more writes than reads
      - Equal reads and writes
      - Only writes
    correct: 0
    explanation: The estimate has about 100,000 timeline reads a second against about 6,000 tweets a second.
  - prompt: A celebrity with 30 million followers posts, and the fan-out workers sustain 1 million timeline inserts a second. With pure fan-out on write, how long until the last follower sees the tweet?
    options:
      - About 30 milliseconds
      - About 30 seconds
      - About 30 minutes
      - Instantly, because the cache is in memory
    correct: 1
    explanation: 30 million ÷ 1 million per second is 30 seconds, and every other user's fan-out queues behind it. That is why accounts above a follower threshold are merged in at read time instead.
  - prompt: In the hybrid design, a user follows 4 celebrities. What does reading their home timeline cost?
    options:
      - One cache read, exactly as before
      - A scan of every tweet in the database
      - One read of their precomputed timeline plus a read of each celebrity's recent tweets, merged by tweet ID
      - Fan-out of all 4 celebrities' tweets at read time into every follower
    correct: 2
    explanation: Five small cache reads merged in memory; time-sortable IDs make the merge a simple sort.
  - prompt: Why do Snowflake-style tweet IDs help the timeline?
    options:
      - They are shorter than usernames
      - Their high bits are a timestamp, so sorting by ID sorts by time with no extra field
      - They are random, so they spread evenly
      - They encrypt the tweet
    correct: 1
    explanation: Timelines, merges, and cursor pagination all sort by ID, which works because IDs grow with time.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TimelineFanoutFlow from '#lib/diagrams/TimelineFanoutFlow.svelte';
</script>

Users post short messages and read a home timeline built from everyone they follow, and anyone can search all tweets by keyword. This walk-through follows the four steps from [How to approach a design interview](/modules/approach-a-design-interview), and the whole walk-through is the worked example.

## What it is

The problem: a user who follows 300 accounts opens the app and expects the newest tweets from all of them in under a second. Doing that the obvious way, querying the tweets table for all 300 authors and sorting, is a 300-way merge on every app open, and the app is opened about 100,000 times a second. The timeline design is about moving that work somewhere cheaper.

The core trick is to precompute each user's home timeline when tweets are posted, so a read becomes one cache lookup. The interesting parts are what that costs for accounts with millions of followers, how to keep it in memory, and how search works when the data is far too big to scan. <Src id="primer-twitter" />

## Requirements

**Step 1, scope.** Ask which features matter and what scale to assume.

Functional requirements:

- A user posts a tweet (up to 280 characters, optionally with media).
- A user reads their **home timeline**: recent tweets from the accounts they follow, newest first.
- A user reads a **user timeline**: one account's own tweets.
- A user searches tweets by keyword.

Non-functional requirements:

- **Fast reads**: home timeline in under about 200 ms, because it is the first screen.
- **Fresh enough**: a new tweet appears in followers' timelines within a few seconds; a short delay is fine, so this can be eventually consistent.
- **Highly available**: reads keep working even when part of the write path is slow.
- **Read-heavy**: the design should spend write-time work to save read-time work.

Out of scope: ranking by relevance, ads, notifications, and direct messages. Mention that ranking would sit on top of the same candidate list.

## Capacity estimates

The primer's assumptions, with the arithmetic shown. <Src id="primer-twitter" /> See [Back-of-the-envelope numbers](/modules/back-of-the-envelope).

- **Users.** 100 million active users.
- **Tweets.** 500 million a day ÷ 86,400 s ≈ **6,000 tweets a second** on average.
- **Fan-out.** If each tweet is delivered to 10 timelines on average (most users have few active followers), that is 5 billion deliveries a day, about **60,000 timeline inserts a second**.
- **Timeline reads.** 250 billion read requests a month ÷ 2.6 million seconds ≈ **100,000 reads a second**.
- **Search.** 10 billion searches a month ≈ **4,000 searches a second**.
- **Tweet storage.** An id (8 bytes), author id (8 bytes), text (280 bytes), and media metadata; media itself goes to [object storage](/modules/object-storage). Including media, the primer's average is about 10 KB a tweet: 15 billion tweets a month × 10 KB ≈ **150 TB a month**, about **5.4 PB** over three years. The tweet store must be sharded.
- **Timeline cache.** Keep 800 tweet IDs per active user at 8 bytes each, plus sorted-set overhead, call it 10 KB a user. 100 million × 10 KB = **1 TB** of memory, spread across a cluster of cache nodes.

Reads outnumber posts about 16 to 1, and 1 TB of timelines fits in RAM across a few dozen machines. Both point at precomputing timelines in memory.

## API

**Post a tweet**

```http
POST /api/v1/tweets
Authorization: Bearer <token>
{ "text": "Shipping the new timeline today", "media_ids": [] }

201 Created
{ "id": "1793012345678901248", "author_id": "42",
  "text": "Shipping the new timeline today", "created_at": "2026-11-28T09:00:00Z" }
```

**Read the home timeline**

```http
GET /api/v1/timelines/home?limit=50&cursor=1793012345678901248

200 OK
{ "tweets": [ { "id": "...", "author": { ... }, "text": "...", "created_at": "..." } ],
  "next_cursor": "1793011999000000000" }
```

The cursor is the oldest tweet ID on the page, so the next page asks for IDs below it. This is <Term id="cursor-pagination">cursor pagination</Term>, which stays correct while new tweets arrive at the top, unlike page numbers.

**Read a user timeline:** `GET /api/v1/users/42/tweets?limit=50&cursor=...`, same shape.

**Search**

```http
GET /api/v1/search?q=timeline&limit=20

200 OK
{ "tweets": [ ... ], "next_cursor": "..." }
```

## Data model

**Tweets** are stored once, in a sharded database. Cassandra, a sharded MySQL, or another wide-column store fits, because every read is by tweet ID or by author.

```sql
CREATE TABLE tweets (
  id         BIGINT PRIMARY KEY,   -- Snowflake ID, sortable by time
  author_id  BIGINT NOT NULL,
  text       VARCHAR(280) NOT NULL,
  media_ids  BIGINT[],
  created_at TIMESTAMP NOT NULL
);
CREATE INDEX tweets_by_author ON tweets (author_id, id DESC);
```

**Follows** is the social graph, queried in both directions: "who does Alice follow" for reads and "who follows Alice" for fan-out.

```sql
CREATE TABLE follows (
  follower_id  BIGINT,
  followee_id  BIGINT,
  created_at   TIMESTAMP,
  PRIMARY KEY (followee_id, follower_id)   -- plus a mirror table keyed by follower_id
);
```

**Home timelines** live in a Redis cluster, one sorted set per user holding tweet IDs only, each scored by its own ID so the set is always in time order:

```
timeline:home:{user_id}  → sorted set: member = tweet ID, score = tweet ID   (capped at 800)
```

The tweet IDs are **<Term id="snowflake-id">Snowflake IDs</Term>**: 64-bit numbers whose high bits are a millisecond timestamp, followed by a machine id and a sequence number. Sorting by ID therefore sorts by time, which makes merging and paging trivial. Storing IDs instead of whole tweets keeps each timeline small; the tweet itself is fetched once per read from a tweet cache. <Src id="primer-twitter" />

## High-level design

**Step 2, draw the boxes.** A write API stores tweets and hands them to a fan-out service through a queue. The fan-out service looks up followers and appends the tweet ID to each follower's cached timeline. A read API serves timelines from that cache and fills in tweet bodies from a tweet cache. A separate search service indexes tweets and answers queries. <Src id="primer-twitter" />

<TimelineFanoutFlow />

The post path:

1. The client calls `POST /api/v1/tweets`.
2. The write API assigns a Snowflake ID, stores the tweet in the tweets table and the tweet cache, and appends it to the author's user timeline.
3. It publishes a "tweet created" event to a [queue](/modules/queues-and-back-pressure) and returns 201. Posting takes tens of milliseconds regardless of follower count.
4. Fan-out workers consume the event, page through the author's followers, and `ZADD` the tweet ID into each follower's home timeline, then trim it to the newest 800 with `ZREMRANGEBYRANK`. Workers run in parallel, so tweets arrive out of order; ordering by score rather than arrival keeps the timeline sorted anyway.
5. The search indexer consumes the same event and adds the tweet to the search index.

The read path:

1. The client calls `GET /api/v1/timelines/home`.
2. The read API fetches the 50 highest IDs below the cursor from Redis in one call (`ZREVRANGEBYSCORE timeline:home:42 (cursor -inf LIMIT 0 50`). Selecting by ID, not by position, is what makes the cursor safe: a late-arriving tweet with a higher ID than the cursor was never skipped, it simply shows up at the top on the next refresh.
3. It fetches the 50 tweets from the tweet cache in one batch (`MGET`), and author profiles from a user cache.
4. It returns the hydrated tweets. Two or three cache round trips, well under 50 ms.

## How it works

**Step 3, the core components.** The heart is **<Term id="fan-out-on-write">fan-out on write</Term>**: do the merge once, when a tweet is posted, by pushing its ID into every follower's precomputed list. The opposite is **<Term id="fan-out-on-read">fan-out on read</Term>**: store each tweet once and merge followed users' tweets at read time. Push makes reads cheap and posts expensive; pull does the reverse. Because reads dominate, push is the default, and the deep dives show why it cannot be the whole answer.

**Search** is its own system. Each new tweet is split into words (tokenized) and added to an **<Term id="inverted-index">inverted index</Term>**, a map from each word to the list of tweet IDs containing it. <Src id="wiki-inverted-index" /> A query looks up each word's list, intersects them, and ranks the result. <Src id="primer-twitter" />

**Step 4, scale.** Shard tweets by ID, keep timelines only for active users, split the fan-out work across many workers, and shard the search index. The bottlenecks section works through each.

## Deep dives

### 1. The celebrity problem and the hybrid timeline

Fan-out on write turns one tweet into one write per follower. For a user with 200 followers that is 200 cheap list pushes. For an account with 30 million followers, it is 30 million pushes. At 1 million inserts a second across the worker fleet, that one tweet takes **30 seconds** to reach the last follower, and every other user's tweets queue behind it. A few celebrities posting at once during a big event would back the queue up for minutes.

The fix is a **hybrid**:

- Accounts below a threshold (say 100,000 followers) fan out on write as before.
- Accounts above it do not fan out. Their tweets go only to their own user timeline.
- At read time, the read API takes the user's precomputed list, then fetches the recent tweets of each celebrity they follow (usually a handful) from those celebrities' user timelines, and merges by tweet ID.

**Worked example.** Alice follows 300 accounts, 4 of them above the threshold. Her read is: one `ZREVRANGEBYSCORE` for the newest 50 IDs of her home timeline, four more for the newest 50 IDs of each celebrity's user timeline (cached, because millions of people read them), then an in-memory merge of about 1,000 IDs by value. Because Snowflake IDs sort by time, the merge is a sort of integers; it takes microseconds. Five small cache reads replace 30 million writes per celebrity tweet. <Src id="primer-twitter" />

### 2. Keeping the timeline cache affordable

1 TB of RAM is fine; 10 TB because of inactive users is not. Three rules keep it bounded:

- **Cap each timeline** at 800 IDs. Almost nobody scrolls further; older pages fall back to a slower path that reads followed users' user timelines.
- **Skip inactive users.** Fan-out only writes to timelines of users who logged in within, say, the last 30 days. Most registered users are inactive, so this cuts fan-out work and memory sharply.
- **Rebuild on demand.** When an inactive user returns, their timeline is missing. The read API builds it once by fan-out on read (merge the recent tweets of everyone they follow), stores it, and from then on it is maintained by push again. The first read after a long absence is slower, which is acceptable.

Replicate each Redis shard so a node failure does not force millions of rebuilds at once; a mass rebuild would hammer the tweets database.

### 3. Search over hundreds of billions of tweets

The tweets table cannot answer `WHERE text LIKE '%timeline%'`; that scans everything. The search service keeps its own inverted index:

- **Indexing.** The indexer consumes "tweet created" events, tokenizes the text (lowercase, split on spaces and punctuation, keep hashtags and mentions as tokens), and appends the tweet ID to each token's posting list.
- **Sharding.** The index is split by time (recent tweets in an in-memory tier, older ones on disk) and, within each tier, by tweet ID across many shards. Recent tweets get most queries, so the recent tier is small and fast.
- **Querying.** The search API sends the query to every shard in the relevant tier in parallel (<Term id="scatter-gather">scatter-gather</Term>), each shard returns its top results, and the API merges and ranks them by recency and engagement. With 4,000 queries a second, add replicas of each shard to spread reads. <Src id="wiki-inverted-index" />

New tweets are searchable within seconds because the in-memory tier accepts writes directly, without a batch rebuild.

## Bottlenecks and scaling

- **Fan-out queue.** At 60,000 inserts a second average and far more during big events, the fan-out workers are the write bottleneck. Partition the queue by author, add workers, and give the hybrid threshold room so no single tweet dominates.
- **Tweet store.** 150 TB a month needs sharding. Shard by tweet ID (a hash of it) so writes spread evenly; the author index then lives per shard, or user timelines are kept in their own cache so "tweets by author" rarely hits the database.
- **Hot tweets.** A viral tweet is read millions of times a minute. The tweet cache absorbs this; replicate the hottest entries across nodes or keep a small in-process cache on read servers.
- **Social graph.** Fan-out pages through follower lists; store them sharded by followee so one shard returns a whole list, and cache follower lists of active posters.
- **Availability.** If fan-out falls behind, reads still work from the cache, just a little stale. That is the point of making fan-out asynchronous.

## In the real world

- **Twitter** described exactly this design: home timelines in Redis clusters capped at about 800 entries, fan-out on write for most accounts, and celebrity tweets merged in at read time. Tweet IDs come from **Snowflake**, a 64-bit ID of timestamp, worker id, and sequence. Search ran on **Earlybird**, an inverted index built on Lucene with a small in-memory tier for real-time tweets.
- **Mastodon** fans out on write through Sidekiq background jobs into Redis home feeds per user, trims each feed to a few hundred entries, skips users who have been inactive for weeks, and regenerates a feed when an inactive user returns.
- **Facebook's News Feed** leans towards fan-out on read: it gathers candidate stories from friends and pages at request time and ranks them, because ranking needs to see many more candidates than a fixed chronological list.
- **Elasticsearch** is the usual off-the-shelf choice for the search part, with `number_of_shards` fixed at index creation and `refresh_interval` (default 1 second) controlling how quickly new documents become searchable.

## Trade-offs

| | Fan-out on write (push) | Fan-out on read (pull) |
| --- | --- | --- |
| Post cost | One write per follower | One write |
| Read cost | One cache read | Merge every followed user's tweets |
| Celebrity users | Millions of writes per tweet | Fine |
| Freshness | Seconds behind, depends on queue | Always current |

- **The usual answer is a hybrid**: push for most users, and merge tweets from very popular accounts in at read time. <Src id="primer-twitter" />
- **Cached timelines cost memory**, so inactive users are skipped and their timelines rebuilt on demand. <Src id="primer-twitter" />
- **Eventual consistency** is accepted: a follower may see a tweet a few seconds after others do, in exchange for fast posts and cheap reads.

## Interview tips

- Show with numbers that reads dwarf writes, then argue for precomputed timelines.
- Store IDs in timelines and hydrate from a tweet cache; say why.
- Bring up the celebrity problem yourself, do the 30-million arithmetic, and offer the hybrid.
- Keep search a separate service with its own inverted index; never query the tweet database with `LIKE`.
- Make fan-out asynchronous so posting stays fast and reads survive a backed-up queue.

**Common mistakes:**

- Pure fan-out on write with no celebrity handling, which works on the whiteboard until one account with 30 million followers posts.
- Copying full tweet bodies into every timeline, which multiplies storage and makes edits and deletes touch millions of lists.
- Keeping a timeline for every registered user rather than only active ones, inflating memory several times over.
- Paginating with page numbers, so new tweets arriving at the top shift every page and readers see duplicates.

## Common follow-up questions

### How do you handle a deleted tweet?

Mark the tweet deleted in the tweets table and remove it from the tweet cache. Do not chase it through millions of timelines: the read path drops any ID whose tweet is missing or deleted when it hydrates. Optionally, a background job removes the ID from lists over time.

### How would you add ranking instead of pure reverse-chronological order?

Treat the precomputed timeline as a candidate list. At read time, take the top few hundred candidates, score each with a model using features such as author affinity, engagement, and age, and return the best 50. The fan-out design stays the same; ranking adds a scoring step and usually a feature cache.

### What happens when a user follows someone new?

The new account's tweets are not in the follower's list yet. Fetch that account's recent tweets and merge them into the follower's timeline once, then fan-out keeps it current. Unfollowing is the reverse: filter the account's IDs out at read time until the list naturally rolls over.

### How do you keep fan-out from falling behind during a spike, like a World Cup goal?

The queue absorbs the burst, so posting still succeeds. Autoscale fan-out workers on <Term id="consumer-lag">consumer lag</Term>, lower the celebrity threshold temporarily so fewer tweets fan out, and prioritise fan-out to recently active users first. Readers see tweets a few seconds late rather than errors.

### How do you generate unique, time-sorted tweet IDs across many servers?

Use a Snowflake-style scheme: 41 bits of milliseconds since a custom epoch, 10 bits of worker id, and 12 bits of sequence per millisecond. Each server generates IDs locally with no coordination beyond assigning worker ids, and IDs sort by creation time.

## Go deeper

- [System Design Primer, Design the Twitter timeline and search](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md): the full primer solution with its estimates and diagrams.
- [InfoQ, Timelines at Scale (Raffi Krikorian)](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/): Twitter's own talk on Redis timelines, fan-out, and the celebrity merge.
- [Earlybird: Real-Time Search at Twitter](http://notes.stephenholiday.com/Earlybird.pdf): the paper behind Twitter's inverted index and how it makes tweets searchable within seconds.
- [X Engineering, The Infrastructure Behind Twitter: Scale](https://blog.x.com/engineering/en_us/topics/infrastructure/2017/the-infrastructure-behind-twitter-scale): how the storage, caching, and hardware behind the timeline grew over a decade.
