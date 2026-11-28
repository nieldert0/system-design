---
slug: consistent-hashing
title: Consistent hashing
section: databases
readFirst:
  - federation-sharding-denormalization
sources:
  - id: wiki-ch
    title: Wikipedia, Consistent hashing
    url: https://en.wikipedia.org/wiki/Consistent_hashing
    license: CC BY-SA 4.0
    use: reworded
  - id: dynamo
    title: "Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)"
    url: https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
    license: Paper, cited
    use: reworded
quiz:
  - prompt: With plain hash(key) mod N, what happens when you add a server?
    options:
      - Only a few keys move
      - Almost every key maps to a different server
      - Nothing changes
      - Keys are deleted
    correct: 1
    explanation: Changing N changes nearly every result of the modulo.
  - prompt: With consistent hashing and n servers, roughly what share of keys moves when one server is added?
    options:
      - All of them
      - About 1/n
      - Half
      - None
    correct: 1
    explanation: Only keys in the new server's arc of the ring move.
  - prompt: How is a key assigned to a server on the ring?
    options:
      - The nearest server counter-clockwise
      - The first server found going clockwise from the key's hash
      - A random server
      - The server with the most memory
    correct: 1
    explanation: Walk clockwise to the next server position.
  - prompt: Why use virtual nodes?
    options:
      - To save memory
      - To place each server at many ring points so load is even and a failed server's keys spread over many others
      - To encrypt keys
      - To avoid hashing
    correct: 1
    explanation: Many points per server smooth out uneven arcs.
  - prompt: In the worked example, a cache cluster grows from 4 to 5 nodes and serves 10,000 reads/s. With mod-N hashing, about how many reads/s miss right after the change?
    options:
      - About 2,000
      - About 8,000
      - About 500
      - None
    correct: 1
    explanation: With mod N going from 4 to 5, about 4 out of 5 keys change server, so about 80% of reads miss.
  - prompt: The same cluster uses a ring with virtual nodes. About what share of keys moves when the fifth node joins?
    options:
      - 80%
      - 20%
      - 50%
      - 1%
    correct: 1
    explanation: The new node takes about 1/5 of the ring, taken evenly from the four old nodes.
  - prompt: One key gets 50,000 reads/s and a single node handles 20,000. Does adding more virtual nodes fix it?
    options:
      - Yes, virtual nodes split each key across servers
      - No; one key always maps to one position, so you need to replicate or split the hot key
      - Yes, if you use at least 256 virtual nodes
      - No, you must switch to mod-N hashing
    correct: 1
    explanation: Hashing spreads many keys; it cannot spread one key.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import HashRingFlow from '#lib/diagrams/HashRingFlow.svelte';
</script>

Consistent hashing decides which server owns which key in a way that moves only a small share of keys when servers are added or removed. It is how distributed caches and partitioned databases grow without reshuffling everything.

## What it is

Here is the problem. You spread cache keys over 4 servers with `server = hash(key) mod 4`. Traffic grows and you add a fifth server, so the formula becomes `hash(key) mod 5`. For almost every key the remainder changes, so about 80% of keys now map to a different server. For a <Term id="cache">cache</Term>, that means 80% of reads miss at once and fall through to the database, which was the thing the cache was protecting. For a database split into shards, it means copying 80% of the data between machines. <Src id="wiki-ch" />

**<Term id="consistent-hashing">Consistent hashing</Term>** fixes this by hashing both keys and servers onto the same circle of hash values, the *ring*. A key belongs to the first server you reach walking clockwise from the key's position. When a server joins, it takes over only the keys between itself and the server before it; when a server leaves, only its keys move, to the next server along. With n servers, about 1/n of the keys move instead of nearly all of them. <Src id="wiki-ch" />

It is the routing layer under [sharding](/modules/federation-sharding-denormalization): sharding says "split the data by key", and consistent hashing says which machine holds each key, in a way that survives the cluster changing size.

## How it works

### The ring

Pick a hash function with a large, uniform output, for example the first 64 bits of MD5 or a MurmurHash, and think of its outputs as positions on a circle from 0 to 2^64 − 1 that wraps around. <Src id="wiki-ch" />

1. Hash each server's id (say `"cache-a"`) to a position on the ring.
2. Hash each key (say `"user:1234"`) to a position on the ring.
3. Walk clockwise from the key until you meet a server. That server owns the key.
4. A new server takes over only the keys between it and its counter-clockwise neighbour. A removed server hands its keys to its clockwise neighbour.

<HashRingFlow />

In code, the ring is a sorted array of server positions. Looking up a key is a binary search for the first position greater than or equal to the key's hash, wrapping to the start if there is none, so it costs O(log of the number of positions), a few hundred nanoseconds.

### Virtual nodes

With only a few servers placed at random, the arcs between them are uneven. With 4 servers, it is normal for one to own 35% of the ring and another 15%, so one server does more than twice the work of another. Worse, when a server fails, *all* of its keys land on one neighbour, which may then be overloaded too.

**<Term id="virtual-node">Virtual nodes</Term>** (vnodes) fix both. Each physical server is hashed to many positions, for example `"cache-a#0"` to `"cache-a#255"`. Each server now owns many small arcs scattered round the ring, so its total share averages out close to 1/n. When it fails, each of its small arcs passes to a different neighbour, so the load spreads over every other server instead of one. A bigger server can be given more virtual nodes so it takes a proportionally bigger share. <Src id="wiki-ch" /> <Src id="dynamo" />

How even does it get? With v virtual nodes per server, the load imbalance falls roughly like 1/√v. In practice, 100 to 200 virtual nodes per server keep every server within about 10% of the average, at the cost of a lookup table of a few thousand entries, which is trivial.

### Replication on the ring

To store each key on R servers for durability, keep walking clockwise past the first owner and also store the key on the next R − 1 *distinct physical* servers. Amazon's Dynamo calls this list the **preference list**. Skipping virtual nodes that belong to a server already on the list guarantees the R copies are on R different machines, and rack-aware placement can go further and put them in different racks or zones. <Src id="dynamo" />

### Alternatives

- **Rendezvous (highest random weight) hashing**: for each key, score every server with `hash(key, server)` and pick the highest. It moves the same minimal 1/n of keys and needs no ring, but a lookup costs O(n), which is fine for tens of servers.
- **Jump consistent hash** (Google, 2014): a few lines of arithmetic that maps a key to one of n numbered buckets with minimal movement and perfect balance, using no memory. It only supports adding or removing the *last* bucket, so it suits numbered shards more than servers that fail at random.
- **Fixed slots**: split the key space into a fixed number of slots, say 16,384, and assign slots to servers in a table. Moving a slot is an explicit operation. Redis Cluster does this.

## Worked example

A cache cluster has **4 nodes** and serves **10,000 reads/s** with a 95% <Term id="hit-ratio">hit ratio</Term>, so the database sees **500 reads/s**. It can take about 2,500 before latency suffers. We add a fifth node.

**Step 1, mod-N.** A key stays on the same node only if `hash mod 4 = hash mod 5`, which holds for about 1 in 5 keys. So about **80% of keys move**. Right after the change, about 80% of reads miss: 10,000 × 0.8 = **8,000 reads/s** go to the database, more than three times its limit. Even if it survives, the cache takes minutes to refill.

**Step 2, a ring with 4 physical positions.** The new node lands somewhere on the ring and takes part of one neighbour's arc. Say it takes 15% of the ring. Now 15% of keys move, all from a single node, and the database sees about 10,000 × 0.15 = 1,500 extra misses for a while, which it can handle. But the load is uneven: the neighbour it split from now owns perhaps 10% while another node still owns 35%.

**Step 3, a ring with 200 virtual nodes per server.** The new node's 200 positions are spread around the ring and take small slices from all four old nodes. It ends up with close to **20%** (1/5) of the ring, taken about 5% from each old node. The extra database load is about 10,000 × 0.20 = **2,000 misses/s** at first, falling as the new node warms, which is under the 2,500 limit. Every node now holds 20% ± a few percent.

**Step 4, a node fails.** With vnodes, the failed node's 20% is spread across the four survivors, about 5% each, so each goes from 20% to 25% of traffic. Without vnodes, its whole arc would land on one neighbour, taking that node from 20% to 40%, double its normal load, at the worst possible time.

**Step 5, a hot key.** A celebrity's profile key gets **50,000 reads/s** and one node handles about 20,000. Virtual nodes do not help, because a single key hashes to a single position. Copy it under several keys (`user:42#0` to `user:42#4`) that hash to different nodes and have readers pick one at random, or cache it in each web server's memory. Five copies means about 10,000 reads/s each.

## In the real world

- **Apache Cassandra.** Each node owns token ranges on a ring of 64-bit Murmur3 tokens (`partitioner: Murmur3Partitioner`). `num_tokens` sets virtual nodes per node; it was 256 for years and defaults to **16** since Cassandra 4.0, combined with `allocate_tokens_for_local_replication_factor`, which places tokens deliberately for even spread instead of at random. Replicas are the next distinct nodes clockwise, with `NetworkTopologyStrategy` choosing nodes in different racks.
- **Amazon Dynamo and DynamoDB.** The 2007 Dynamo paper introduced virtual nodes and preference lists to the industry. DynamoDB, the managed service, hashes the partition key to place items on partitions and splits partitions automatically as they grow, so you never see the ring, but a hot partition key still throttles. <Src id="dynamo" />
- **Redis Cluster.** Does *not* use a ring. Keys map to one of **16,384 hash slots** with `CRC16(key) mod 16384`, and each primary owns a set of slots. Resharding moves slots between nodes. Hash tags (`{user42}:cart`) force related keys into the same slot so multi-key commands work.
- **Client-side memcached and load balancers.** The ketama algorithm in memcached clients puts each server on the ring at about 160 points. Envoy's `RING_HASH` and `MAGLEV` load balancing policies use consistent hashing to send the same user to the same backend; Maglev, from Google, trades a little movement for a perfectly even lookup table. See [load balancers](/modules/load-balancers).

## Trade-offs

- **Minimal movement** when scaling, at the cost of a little more logic than modulo.
- **Uneven load without virtual nodes;** with them, a few thousand table entries and somewhat more metadata to gossip around the cluster.
- **More vnodes, more ranges to manage.** Cassandra lowered its default from 256 to 16 because repair and streaming work per token range, and many small ranges made those slow.
- **Hot keys are not fixed by hashing.** One celebrity key still lands on one node; you need <Term id="replication">replication</Term> or key splitting for that.
- **Range queries are lost.** Hashing scatters adjacent keys, so "all orders from March" touches every node. Range-partitioned systems keep order but risk hotspots on the newest range.

## Interview tips

- Bring it up whenever you shard a cache or database and expect to add or lose nodes.
- Explain why mod-N fails with a number (4 to 5 nodes moves about 80% of keys), then draw the ring.
- Mention virtual nodes unprompted, and say what they fix: even load and spreading a failed node's keys.
- Pair it with replication: store each key on the next 2 or 3 distinct nodes clockwise.

**Common mistakes:**

- Saying consistent hashing fixes hot keys. It balances many keys; a single hot key still needs replication or splitting.
- Drawing a ring with one point per server and claiming load is even. Without virtual nodes it is not.
- Forgetting that the copies on the ring must be on distinct physical servers, so two vnodes of the same machine do not count as two replicas.
- Using consistent hashing where range scans are the main query pattern.

## Common follow-up questions

### How many virtual nodes should each server have?

Enough for even load, few enough to keep metadata and per-range work small. For a stateless cache, 100 to 200 per server is a common choice and keeps imbalance around 10%. For databases that repair and stream per range, fewer, smarter tokens are better, which is why Cassandra moved to 16 with deliberate token allocation.

### What happens to data when a node joins?

The new node takes ownership of its ranges, and the data for those ranges must be copied to it before it serves reads. A database streams the ranges from the current owners and only then switches ownership. A cache usually just starts empty for those keys and lets misses refill it, so you add nodes at quiet times or warm them first.

### How do clients know where the ring's servers are?

Either every client holds the ring and gets updates from a config service or a gossip protocol (Cassandra drivers are token-aware and route straight to a replica), or clients talk to any node or a proxy, which forwards to the owner. Redis Cluster replies with a `MOVED` redirect when a client asks the wrong node, and the client updates its slot map.

### How is consistent hashing different from range partitioning?

Range partitioning gives each node a contiguous range of keys, such as A to F. Range scans are cheap, but new keys that sort together, like timestamps, all land on one node and make it hot. Hash partitioning, which is what consistent hashing does, spreads keys evenly but loses order. Bigtable and HBase use ranges; Cassandra and DynamoDB use hashes.

## Go deeper

- [Dynamo: Amazon's Highly Available Key-value Store (SOSP 2007)](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf): the paper that popularised virtual nodes, preference lists and replication on the ring.
- [A Fast, Minimal Memory, Consistent Hash Algorithm (Lamping and Veach, 2014)](https://arxiv.org/abs/1406.2294): jump consistent hash, with balance and movement measurements.
- [Cassandra: Dynamo architecture](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html): how Cassandra uses tokens, vnodes and replication strategies, and why it changed `num_tokens`.
- [Redis Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/): hash slots, MOVED redirects and resharding, an alternative to the ring.
