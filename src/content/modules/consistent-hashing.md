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
      - To spread each server across many ring points so load is even and moves smoothly
      - To encrypt keys
      - To avoid hashing
    correct: 1
    explanation: Many points per server smooth out uneven arcs.
  - prompt: Where is consistent hashing commonly used?
    options:
      - TLS handshakes
      - Distributed caches and partitioned databases such as Cassandra and DynamoDB
      - DNS record types
      - CSS layout
    correct: 1
    explanation: It decides which node owns which keys.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import HashRingFlow from '#lib/diagrams/HashRingFlow.svelte';
</script>

Consistent hashing decides which server owns which key, in a way where adding or removing a server moves only a small share of the keys.

## What it is

**<Term id="consistent-hashing">Consistent hashing</Term>** maps both keys and servers onto the same circle of hash values (the ring). Each key belongs to the next server on the ring. When a server joins or leaves, only the keys next to it change owner, about 1/n of them for n servers. <Src id="wiki-ch" />

## How it works

The naive approach, `server = hash(key) mod N`, works until N changes. Then almost every key maps to a different server, which for a <Term id="cache">cache</Term> means a near-total miss storm and for a database means moving nearly all data. <Src id="wiki-ch" />

With a ring: <Src id="wiki-ch" />

1. Hash each server's id to a point on the ring.
2. Hash each key to a point on the ring.
3. Walk clockwise from the key to the first server; that server owns the key.
4. Adding a server takes over only the keys between it and its predecessor. Removing one hands its keys to the next server.

<HashRingFlow />

With few servers, the arcs can be very uneven. **Virtual nodes** fix this: each physical server is placed at many points on the ring, so load evens out, and a failed server's keys spread across many others instead of landing on one neighbour. Stronger servers can get more virtual nodes. <Src id="wiki-ch" />

Systems such as Amazon's Dynamo, Cassandra and many distributed caches use this to partition data. <Src id="wiki-ch" />

## Trade-offs

- **Minimal movement** on scaling, at the cost of a little more logic than modulo.
- **Uneven load without virtual nodes;** with them, more metadata to track.
- **Hot keys are not fixed by hashing.** One celebrity key still lands on one node; you need <Term id="replication">replication</Term> or key splitting for that.

## Interview tips

- Bring it up whenever you shard a cache or database and expect to add nodes.
- Explain why modulo fails, then draw the ring; mention virtual nodes unprompted.
- Pair it with replication: store each key on the next 2–3 nodes clockwise.
