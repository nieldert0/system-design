---
slug: unique-id-generation
title: Unique ID generation
section: availability
readFirst:
  - federation-sharding-denormalization
  - indexes-and-sql-tuning
sources:
  - id: rfc9562
    title: RFC 9562, Universally Unique IDentifiers (UUIDs)
    url: https://www.rfc-editor.org/rfc/rfc9562
    license: IETF Trust
    use: reworded
  - id: twitter-snowflake
    title: Twitter Engineering, Announcing Snowflake
    url: https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake
    license: All rights reserved
    use: reworded
  - id: flickr-tickets
    title: Flickr, Ticket servers, distributed unique primary keys on the cheap
    url: https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/
    license: All rights reserved
    use: reworded
  - id: instagram-ids
    title: Instagram Engineering, Sharding and IDs at Instagram
    url: https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c
    license: All rights reserved
    use: reworded
  - id: wiki-birthday
    title: Wikipedia, Birthday problem
    url: https://en.wikipedia.org/wiki/Birthday_problem
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: Why does an auto-increment column stop working as a global ID once a table is sharded?
    options:
      - Auto-increment is too slow
      - Each shard counts on its own, so shard 1 and shard 2 both hand out id 1, 2, 3
      - It runs out of numbers at 1,000
      - Shards cannot store integers
    correct: 1
    explanation: Each database keeps its own counter. Without coordination, the same number is issued on every shard.
  - prompt: In a standard Snowflake ID, what are the 64 bits made of?
    options:
      - 64 random bits
      - 1 unused sign bit, 41 bits of milliseconds, 10 bits of machine ID, 12 bits of sequence
      - 32 bits of seconds and 32 random bits
      - A hash of the row
    correct: 1
    explanation: Timestamp in the high bits makes IDs sort by time; the machine bits make workers independent; the sequence counts within one millisecond.
  - prompt: How many IDs can one Snowflake worker issue per millisecond?
    options:
      - "1,024"
      - "4,096"
      - "65,536"
      - Unlimited
    correct: 1
    explanation: 12 bits of sequence give 2^12 = 4,096 values per millisecond, about 4 million per second per worker. If it runs out, it waits for the next millisecond.
  - prompt: Why can random UUIDv4 primary keys slow down inserts into a large B-tree index?
    options:
      - UUIDs are hard to compare
      - Each new key lands at a random place in the index, so inserts touch pages all over it, causing page splits and cache misses once the index is bigger than memory
      - UUIDs cannot be indexed
      - They are always duplicated
    correct: 1
    explanation: Time-ordered keys (UUIDv7, Snowflake) always go to the right edge of the index, where the hot pages are already in memory.
  - prompt: In the worked example, a worker's clock jumps back 5 ms after an NTP correction. What should it do?
    options:
      - Keep issuing IDs as usual
      - Refuse or wait until its clock passes the last timestamp it used, so it never repeats a timestamp and sequence pair
      - Reset the sequence to 0
      - Pick a new worker ID at random
    correct: 1
    explanation: Issuing IDs with an older timestamp could repeat IDs already handed out. Waiting 5 ms is cheap and keeps IDs unique.
  - prompt: In the worked example, 10 billion rows have 3 indexes that each store the primary key. About how much space does an 8-byte key save over a 16-byte UUID?
    options:
      - About 8 GB
      - About 240 GB
      - About 2.4 TB
      - Nothing
    correct: 1
    explanation: 8 extra bytes × 10 billion rows × 3 copies = 240 billion bytes, about 240 GB.
  - prompt: Why might you avoid exposing sequential IDs in public URLs?
    options:
      - They are too long
      - They leak business volume and make it easy to guess other users' resources
      - Browsers cannot display them
      - They break caching
    correct: 1
    explanation: Order 10,512 tomorrow and 10,012 today tells a competitor you take 500 orders a day, and a guessable ID invites enumeration attacks if access checks are weak.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import SnowflakeIdFlow from '#lib/diagrams/SnowflakeIdFlow.svelte';
</script>

Every row, message and event needs an ID that no other one has. On one database an auto-increment counter does the job; across many servers you need IDs that can be made in parallel without talking to each other, and that still work well as database keys.

## What it is

Here is the problem. Your posts table has an `id BIGINT AUTO_INCREMENT` column, and it works fine until the table is split across 16 [shards](/modules/federation-sharding-denormalization). Each shard has its own counter, so every shard hands out post 1, post 2, post 3, and "post 1" now means 16 different posts. You could ask one central counter for every ID, but then every write in the system depends on one machine, and at 50,000 writes/s, every write pays a network round trip to it.

A good ID scheme for a distributed system usually needs:

- **Uniqueness** across every server, without a lock or a round trip per ID.
- **Availability**: generating an ID must not fail because some other machine is down.
- **A compact size**: 64 bits fits in a `BIGINT` and in every language's integer type; 128 bits doubles the size of every key and every index that stores it.
- **Rough time order**, so that IDs sort by creation time and new rows go to the end of a <Term id="b-tree">B-tree</Term> index instead of all over it.
- Sometimes **unguessability**, so that IDs in public URLs do not leak how many orders you take or let someone walk through `/invoice/1`, `/invoice/2`.

No single scheme wins on all five. The main options are random <Term id="uuid">UUIDs</Term>, time-ordered UUIDs and ULIDs, <Term id="snowflake-id">Snowflake IDs</Term>, and <Term id="ticket-server">ticket servers</Term>.

## How it works

### UUIDv4: random

A UUID is 128 bits, written as 32 hex digits such as `3f2b8c1e-9d4a-4e7b-a1c2-5f6e7d8c9b0a`. Version 4 sets 6 bits to mark the version and variant and fills the other **122 bits** at random. Any machine can make one instantly with no coordination at all. <Src id="rfc9562" />

Collisions are possible in principle, so it is worth knowing how unlikely they are. By the birthday bound <Src id="wiki-birthday" />, with n random IDs from a space of 2^122, the chance of any collision is about n² / 2^123. For a trillion (10^12) IDs, that is 10^24 / 10^37 ≈ **1 in 10 trillion**. In practice, a bug in the random number generator is far more likely than a true collision.

The cost is that UUIDv4s are random. Inserting them into a B-tree index puts each new key at a random leaf. Once the index is larger than memory, most inserts read a page from disk, and pages split half-full, so the index grows larger than it needs to be. They are also 16 bytes, twice a `BIGINT`, and that cost is paid again in every secondary index, because those store the primary key too. See [indexes and SQL tuning](/modules/indexes-and-sql-tuning).

### UUIDv7 and ULID: time first, then random

UUIDv7, standardised in RFC 9562 in 2024, keeps the 128-bit UUID format but puts a **48-bit Unix timestamp in milliseconds** first, followed by version bits and **74 random bits**. IDs made later sort later, so inserts go to the end of the index, while two machines making IDs in the same millisecond still almost never collide, because of the random part. <Src id="rfc9562" />

ULID is an older community format with the same layout idea: 48 bits of milliseconds and 80 random bits, written as 26 characters in Crockford base32, such as `01HQ3ZK8Y2N4V6...`. Both are drop-in improvements over UUIDv4 for database keys. Their downside is that the creation time is readable from the ID, which may leak information.

### Snowflake: 64 bits, made locally

Twitter built Snowflake in 2010 when it moved off MySQL and needed IDs that were 64 bits, roughly time ordered, and made by many machines without coordination. The 64 bits are split like this: <Src id="twitter-snowflake" />

| Bits | Field | Meaning |
|---|---|---|
| 1 | Sign | Always 0, so the ID is a positive signed integer |
| 41 | Timestamp | Milliseconds since a custom epoch, good for 2^41 ms ≈ **69.7 years** |
| 10 | Machine ID | Up to **1,024** workers (Twitter used 5 bits for data centre and 5 for worker) |
| 12 | Sequence | A counter within one millisecond, **4,096** values |

To make an ID, a worker reads its clock, and if the millisecond is the same as last time, it increments the sequence; if it is new, it resets the sequence to 0. The ID is `(timestamp << 22) | (machine << 12) | sequence`. One worker can issue 4,096 IDs per millisecond, about **4 million per second**. If it uses all 4,096 in one millisecond, it waits for the next one.

<SnowflakeIdFlow />

The only coordination is handing out machine IDs, once, when a worker starts. That can come from configuration, a Kubernetes StatefulSet's pod number, or a <Term id="lease">lease</Term> in ZooKeeper or etcd, so that two live workers never share a number. Two workers with the same machine ID will produce duplicates, so this step must be reliable.

### Clocks are the weak point

Snowflake trusts the local clock. Machines are kept in sync by NTP, but there is always some <Term id="clock-skew">clock skew</Term>, and a correction can move a clock **backwards**. If a worker issued IDs at millisecond 1,000, its clock jumps back to 995, and it issues IDs again, it can repeat an ID it already handed out. The standard defence is to remember the last timestamp used and, if the clock reads earlier, wait until it catches up (or refuse with an error if the jump is large). Skew between machines also means IDs are only **roughly** ordered: an ID from worker 7 can be a few milliseconds "later" than one from worker 12 that was made after it. Never use Snowflake IDs to decide strict ordering between machines.

### Ticket servers: one counter, made robust

Flickr's approach keeps a central counter but makes it cheap and available. A dedicated MySQL server holds one table with an auto-increment column, and each request does `REPLACE INTO Tickets64 (stub) VALUES ('a'); SELECT LAST_INSERT_ID();`, which bumps the counter and returns the new value. To remove the single point of failure, Flickr ran **two** ticket servers, one configured to hand out odd numbers and the other even numbers (`auto-increment-increment = 2`, with offsets 1 and 2), and clients round-robin between them. <Src id="flickr-tickets" />

The IDs are 64-bit and increasing, but not strictly in time order across the two servers. Each ID costs a round trip. A common improvement is to fetch IDs in **blocks**: an app server asks for a range of 1,000 at once and hands them out from memory, so the ticket server sees one request per 1,000 IDs.

### Database-native schemes

You can also build the scheme into the database. Instagram generated 64-bit IDs inside PostgreSQL with a stored function: **41 bits** of milliseconds since a custom epoch, **13 bits** of logical shard ID, and **10 bits** of a per-shard sequence. Since the shard is part of the ID, any service can tell which shard holds a row from its ID alone. <Src id="instagram-ids" />

## Worked example

A social app stores **10 billion posts** across **16 shards** and takes **50,000 new posts/s** at peak, from **20 app servers**. Each post row is indexed by its primary key and by **2 secondary indexes**, each of which also stores the primary key.

**Step 1, auto-increment.** Each shard counts on its own, so IDs collide across shards. Option rejected.

**Step 2, one central counter.** One database issuing 50,000 IDs/s is possible, but every post now needs a round trip to it (about 0.5 ms in one data centre) and fails when it is down. Using blocks of 1,000 cuts the load to 50 requests/s, which is fine, but it is still one more system that must be highly available. Keep it as a fallback idea.

**Step 3, UUIDv4.** No coordination, so it works. Size: 16 bytes against 8 for a 64-bit ID, so 8 extra bytes × 10 billion rows × 3 copies (the primary key plus 2 secondary indexes) = **240 GB** of extra index. Inserts land at random places in indexes much bigger than memory; each insert is likely to read a random page from disk. On a shard handling 50,000 / 16 ≈ 3,100 inserts/s, that is thousands of random reads per second on indexes alone.

**Step 4, Snowflake.** Give each of the 20 app servers a machine ID from 0 to 19 at start-up. Each server makes 50,000 / 20 = **2,500 IDs/s**, which is **2.5 per millisecond**, far below the 4,096 limit. No network call per ID. The keys are 8 bytes and time ordered, so each shard's inserts go to the right-hand edge of its indexes, which stays in memory. There is room for 1,024 machine IDs, so the app can grow 50 times before running out. Pick the epoch as the launch date, say 1 January 2026, and the IDs last until about 2095.

**Step 5, routing by ID.** To find a post's shard without a lookup table, the shard can be chosen as `id % 16`. Because the low 12 bits are a sequence that often starts at 0 each millisecond, this skews toward some shards at low traffic. Better: hash the ID, or, as Instagram did, put the shard number inside the ID itself.

**Step 6, the clock goes back.** At 03:00, NTP corrects server 7's clock by **5 ms** backwards. Server 7's generator sees the time is now earlier than its last-used timestamp and waits 5 ms before issuing the next ID. About 12 posts (2.5 per ms × 5 ms) wait 5 ms longer than usual. No duplicate is created. Had the jump been 10 seconds, the generator would return errors and the load balancer would route posts to the other 19 servers while an alert fires.

**Step 7, the public URL.** Posts are shared as `/p/1789234567890123456`. Anyone can decode the timestamp, which is harmless here. For invoices, where the creation time and the volume are sensitive, the team uses a random UUIDv4 as a separate public token and keeps the Snowflake ID internal.

## In the real world

- **Twitter / X and Discord.** Twitter's Snowflake uses the epoch 1288834974657 (4 November 2010). Discord uses the same 64-bit layout with an epoch of the first millisecond of 2015, and its API returns the IDs as strings, because JavaScript numbers lose precision above 2^53.
- **MongoDB ObjectId.** 12 bytes: a 4-byte timestamp in seconds, a 5-byte random value per process, and a 3-byte counter. Made by the client driver, roughly time ordered, and no coordination.
- **PostgreSQL.** Since version 13, `gen_random_uuid()` makes UUIDv4 natively, and PostgreSQL 18 adds `uuidv7()`. Its `BIGSERIAL` columns use a sequence, which can hand out blocks with `CACHE n` for speed.
- **Flickr and Instagram.** Flickr's two odd and even ticket servers and Instagram's in-database 41 + 13 + 10 bit scheme are the two classic write-ups of doing this without a separate ID service.

## Trade-offs

| Scheme | Size | Coordination | Time ordered | Main risk |
|---|---|---|---|---|
| Auto-increment | 8 bytes | One database | Yes | Breaks once sharded |
| UUIDv4 | 16 bytes | None | No | Index bloat and random I/O |
| UUIDv7 / ULID | 16 bytes | None | Yes, to the millisecond | Leaks creation time |
| Snowflake | 8 bytes | Machine IDs at start-up | Roughly | Clock going backwards, duplicate machine IDs |
| Ticket server | 8 bytes | Every ID or every block | Roughly | Extra service to keep available |

- **Readability against privacy.** Time-ordered IDs reveal when something was made and, when sequential, how many things exist. Keep them internal and expose a random token if that matters.
- **8 bytes against no coordination.** Fitting uniqueness into 64 bits needs the machine-ID step; 128 bits buys you freedom from it at twice the storage.

## Interview tips

- When a design has a database that will be sharded, say early how IDs are generated, and why auto-increment will not survive.
- Draw the Snowflake bit layout and do its arithmetic: 41 bits of milliseconds is about 69 years, 12 bits is 4,096 per millisecond per worker, 10 bits is 1,024 workers.
- Mention what happens when the clock goes backwards and how machine IDs are assigned.
- If the ID appears in a public URL (a URL shortener, for example), discuss guessability; see [the URL shortener case study](/modules/url-shortener).

**Common mistakes:**

- Using random UUIDv4 primary keys on a huge, write-heavy table, then wondering why inserts slow down once the index outgrows memory.
- Assigning Snowflake machine IDs by hand in a fleet that autoscales, so two instances end up with the same number.
- Sending 64-bit IDs to JavaScript as numbers, where anything above 2^53 is silently rounded.
- Treating Snowflake order as exact, and using it to decide which of two writes from different servers came first.

## Common follow-up questions

### How would you assign machine IDs in an autoscaling fleet?

Use a coordination service: each instance takes a lease on the lowest free number in etcd or ZooKeeper and renews it while running; if it dies, the number frees up after the lease expires. Alternatively, a StatefulSet gives stable ordinals, or a central database hands out numbers at start-up. Always make sure a number cannot be reused while the old holder might still be running.

### What happens after the 69 years run out?

The 41-bit timestamp overflows into the sign bit and IDs become negative or wrap around. Choosing a recent custom epoch, rather than 1970, gives the full 69 years from launch. Systems that expect to outlive that can borrow bits from the sequence or machine fields, or move to 128-bit IDs.

### Can you get strictly increasing IDs across all machines?

Only through a single point of order: one counter, or a consensus-backed sequence, which costs a round trip and caps throughput. Most systems do not need it; "roughly in time order" is enough for sorting feeds and for B-tree locality. Where strict order matters, such as a bank ledger, it is usually per account, which one shard can provide.

### UUIDv7 or Snowflake?

UUIDv7 if you want zero coordination and can afford 16 bytes, or if IDs come from many independent places such as mobile clients. Snowflake if you want 8-byte keys and control the servers that make IDs. Both keep inserts at the end of the index.

## Go deeper

- [RFC 9562: Universally Unique IDentifiers](https://www.rfc-editor.org/rfc/rfc9562): the 2024 standard that defines UUIDv4 and the new time-ordered UUIDv6, v7 and v8, with bit diagrams.
- [Twitter: Announcing Snowflake](https://blog.x.com/engineering/en_us/a/2010/announcing-snowflake): the original requirements and why Twitter rejected UUIDs and ticket servers.
- [Flickr: Ticket servers, distributed unique primary keys on the cheap](https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/): the odd and even MySQL trick, with the exact SQL.
- [Instagram: Sharding and IDs at Instagram](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c): generating time-ordered 64-bit IDs inside PostgreSQL, with the shard ID embedded.
