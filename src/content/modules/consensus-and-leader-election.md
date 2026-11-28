---
slug: consensus-and-leader-election
title: Consensus and leader election
section: availability
readFirst:
  - availability-patterns
  - replication
  - cap-theorem
sources:
  - id: raft-paper
    title: Ongaro and Ousterhout, In Search of an Understandable Consensus Algorithm (Raft)
    url: https://raft.github.io/raft.pdf
    license: CC BY 3.0
    use: reworded
  - id: raft-site
    title: The Raft consensus algorithm
    url: https://raft.github.io/
    license: CC BY 3.0
    use: reworded
  - id: wiki-consensus
    title: Wikipedia, Consensus (computer science)
    url: https://en.wikipedia.org/wiki/Consensus_(computer_science)
    license: CC BY-SA 4.0
    use: reworded
  - id: kleppmann-fencing
    title: Martin Kleppmann, How to do distributed locking
    url: https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
    license: All rights reserved
    use: reworded
  - id: etcd-faq
    title: etcd documentation, Frequently asked questions
    url: https://etcd.io/docs/v3.5/faq/
    license: Apache 2.0
    use: reworded
quiz:
  - prompt: How many node failures can a 5-node Raft cluster tolerate and still make progress?
    options:
      - "1"
      - "2"
      - "3"
      - "4"
    correct: 1
    explanation: A majority of 5 is 3. With 2 nodes down, the remaining 3 still form a majority.
  - prompt: Why do Raft clusters usually have an odd number of nodes?
    options:
      - Even numbers cannot elect a leader
      - A 4-node cluster tolerates only 1 failure, the same as 3 nodes, while costing more and needing a larger majority
      - Odd numbers are faster
      - Raft requires prime numbers
    correct: 1
    explanation: A majority of 4 is 3, so 4 nodes survive 1 failure, the same as 3. The fourth node adds cost and one more vote to collect on every write.
  - prompt: In Raft, when is a log entry committed?
    options:
      - When the leader writes it to its own disk
      - When every node has stored it
      - When a majority of nodes, the leader included, have stored it
      - When the client acknowledges it
    correct: 2
    explanation: Once a majority stores an entry, any future leader must have it, because any election majority overlaps the commit majority in at least one node.
  - prompt: Why are Raft election timeouts randomised (for example 150 to 300 ms)?
    options:
      - To save power
      - So that usually one follower times out first and wins before others start competing, avoiding repeated split votes
      - To confuse attackers
      - Because clocks drift
    correct: 1
    explanation: If all followers timed out together, they would all become candidates, split the vote, and retry forever. Randomness makes one candidate usually win quickly.
  - prompt: In the worked example, the 5-node cluster splits into 2 nodes (including the old leader) and 3 nodes. What happens to writes sent to the old leader?
    options:
      - They commit on both sides
      - They cannot commit, because the old leader can reach only 2 of 5 nodes, not a majority; the 3-node side elects a new leader
      - They commit and are merged later
      - The cluster shuts down entirely
    correct: 1
    explanation: Without a majority, the old leader cannot commit. The majority side elects a leader for a higher term, and the old leader steps down when it sees that term.
  - prompt: A service holds a lock from a coordination service, then pauses for 40 seconds in garbage collection, longer than the lock's lease. What prevents it corrupting data when it wakes?
    options:
      - Nothing can
      - A fencing token, an increasing number issued with each lock that the storage checks, rejecting writes with an older token
      - A longer timeout
      - Retrying the write
    correct: 1
    explanation: The paused client does not know its lease expired. The storage rejects its write because a newer holder already used a higher token.
  - prompt: Why do etcd and ZooKeeper clusters across 3 regions often run 5 nodes spread 2, 2, 1 rather than 3 nodes in one region?
    options:
      - It is cheaper
      - So that losing any single region still leaves a majority of 3
      - Because Raft needs 5 nodes
      - To speed up writes
    correct: 1
    explanation: Losing a region with 2 nodes leaves 3 of 5, still a majority. With all nodes in one region, that region is a single point of failure.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RaftElectionFlow from '#lib/diagrams/RaftElectionFlow.svelte';
</script>

Consensus is how a group of machines agrees on one answer even when some of them crash or the network splits. It is the machinery under leader election, distributed locks, and the strongly consistent stores such as etcd and ZooKeeper that everything else leans on.

## What it is

Here is the problem. A database has a primary and two replicas, and the primary stops answering heartbeats. One replica should take over, but which one, and how does it know the primary is really dead and not just cut off? If each replica decides on its own, both may promote themselves, and you get <Term id="split-brain">split-brain</Term>: two primaries accepting different writes. If you ask a human, fail-over takes 20 minutes. You need the machines to agree on exactly one new primary, automatically, even while some messages are lost.

That is <Term id="consensus">consensus</Term>: a set of nodes agreeing on a value (who is the leader, or what the next entry in a log is) such that: <Src id="wiki-consensus" />

- **Agreement**: no two nodes decide different values.
- **Validity**: the value decided was actually proposed by someone.
- **Termination**: every node that has not crashed eventually decides.

<Term id="leader-election">Leader election</Term> is the most common use. Once a group can agree, it can agree on "node B is leader for term 2", and then that leader can order everything else. Agreeing on a whole sequence of values, one log entry at a time, is called a **replicated log**, and if every node applies the same log to the same starting state, they all end up with the same state. That is how etcd, ZooKeeper, Consul and the metadata layers of Kafka and CockroachDB stay consistent.

## How it works

### Majorities and quorum math

The core trick is the majority, or <Term id="quorum">quorum</Term>. With N nodes, a majority is floor(N/2) + 1. Any two majorities of the same group share at least one node, so two leaders cannot both be elected in the same term, and a decision made by one majority is seen by every later majority.

| Nodes (N) | Majority | Failures tolerated |
|---|---|---|
| 1 | 1 | 0 |
| 3 | 2 | 1 |
| 4 | 3 | 1 |
| 5 | 3 | 2 |
| 7 | 4 | 3 |

To survive f failures you need 2f + 1 nodes. An even count adds cost without adding tolerance: 4 nodes survive one failure, the same as 3, and need 3 votes instead of 2. Bigger clusters are not faster either: each write waits for a majority, so 7 nodes means waiting for the 4th fastest, and the leader sends every entry to 6 followers. Most production clusters use 3 or 5. <Src id="etcd-faq" />

There is a hard limit behind this. The FLP result (Fischer, Lynch and Paterson, 1985) proves that in a fully asynchronous network, where a message can be delayed by any amount, no algorithm can guarantee both agreement and termination if even one node may crash. Real algorithms sidestep it by using timeouts: they are always safe, and they make progress whenever the network is behaving well enough. <Src id="wiki-consensus" />

### Raft, step by step

<Term id="raft">Raft</Term> was designed to be easier to understand than Paxos, the older algorithm, and is now the most widely implemented. Each node is a **follower**, a **candidate**, or a **leader**. Time is divided into numbered **terms**, and each term has at most one leader. <Src id="raft-paper" />

**Election.** The leader sends a heartbeat to every follower at a regular interval, say every 50 ms. Each follower has an **election timeout**, picked at random from a range such as 150 to 300 ms, and resets it every time a heartbeat arrives. If the timeout fires, the follower assumes the leader is gone. It increments the term, becomes a candidate, votes for itself, and asks every other node for a vote. A node grants its vote if it has not already voted in this term and the candidate's log is at least as up to date as its own. A candidate with votes from a majority becomes leader and starts sending heartbeats at once. <Src id="raft-paper" />

The randomness matters. If every follower timed out at the same moment, they would all stand, split the vote, time out again and repeat. With random timeouts, one follower usually times out first and wins before the rest wake up.

<RaftElectionFlow />

**Log replication.** Clients send writes to the leader. The leader appends each write to its log with the current term number and sends it to the followers in an AppendEntries message (heartbeats are just empty AppendEntries). When a majority, the leader included, has written the entry to disk, it is **committed**: the leader applies it to its state, replies to the client, and tells the followers in the next message so they apply it too.

**Safety.** Two rules keep the log correct across leader changes. First, a node only votes for a candidate whose log is at least as complete as its own, so a node missing committed entries cannot win, since any commit majority and any election majority overlap. Second, each AppendEntries carries the index and term of the entry just before the new ones; a follower whose log does not match rejects it, and the leader walks back until they agree and overwrites the follower's conflicting tail. Uncommitted entries from an old leader can be thrown away this way; committed ones never are. <Src id="raft-paper" />

**Stepping down.** Every message carries the sender's term. A node that sees a higher term than its own immediately becomes a follower. That is how an old leader that was cut off learns, when it reconnects, that it has been replaced.

### Paxos and Zab

Paxos (Leslie Lamport, 1989) solves the same problem with proposers, acceptors and two phases of majority votes, and Multi-Paxos with a stable leader behaves much like Raft. Google's Chubby and Spanner use Paxos. ZooKeeper uses Zab, a similar leader-based atomic broadcast protocol. For an interview, explaining Raft well is enough; knowing that these are siblings is a bonus.

### Leader election without writing Raft yourself

Application teams rarely implement consensus. They borrow it from a coordination service. The usual pattern is a <Term id="lease">lease</Term>: a key in etcd, ZooKeeper or Consul that one instance holds for a fixed time, such as 15 seconds, and must renew before it expires. Whoever holds the key is leader. If the leader dies, it stops renewing, the key expires, and another instance grabs it. The coordination service's own consensus guarantees only one instance holds the key at a time.

### Fencing tokens

A lease does not stop an old leader that does not know it lost the lease. A process can pause for longer than its lease, during a long garbage-collection pause, a VM migration, or a swap storm, and then wake up believing it is still leader. The defence is a <Term id="fencing">fencing</Term> token: every time the lock is granted, the coordination service returns a number that only ever increases. The leader includes it in every write, and the storage remembers the highest token it has seen and rejects anything older. <Src id="kleppmann-fencing" />

## Worked example

A 5-node Raft cluster, nodes A to E, stores configuration for a fleet. Heartbeats go every **50 ms**, election timeouts are random in **150 to 300 ms**, and a disk write takes about **2 ms**. A is leader in **term 1**.

**Step 1, a normal write.** A client writes `feature_x = on`. A appends it as entry 41 (term 1) and sends it to B, C, D and E. Within a millisecond on the local network, B and C write it to disk (2 ms) and reply. A now has 3 of 5 copies, itself included, a majority. Entry 41 is committed after about 3 ms; A applies it and answers the client. D and E reply a moment later, which no longer matters for this entry.

**Step 2, the leader crashes.** A's machine loses power. Heartbeats stop. The followers picked their timeouts at random: B 170 ms, C 260 ms, D 220 ms, E 290 ms. At 170 ms after the last heartbeat, B times out first, increments to **term 2**, votes for itself and asks the others.

**Step 3, the vote.** C, D and E have not voted in term 2, and B's log has entry 41, as up to date as theirs. They grant. B has 4 of 5 votes, more than the 3 needed, and becomes leader roughly 175 ms after A died. B sends heartbeats immediately, resetting everyone's timers before D's 220 ms fires. Total unavailability for writes: about **175 ms** plus the time clients take to find the new leader.

**Step 4, a network partition.** Later, with B still leader, the network splits: B and C on one side, D, E and the recovered A on the other. A client on B's side writes `feature_y = on`. B sends it to everyone but only C answers: 2 of 5, not a majority, so it is **not committed** and B cannot answer the client with success. On the other side, D's timer fires; it moves to **term 3** and gets votes from A and E: 3 of 5. D is the new leader and accepts writes, which commit with D, A and E.

**Step 5, the partition heals.** B receives a message carrying term 3, higher than its own term 2, and steps down. D's AppendEntries shows that B's uncommitted `feature_y` entry does not match D's log, so B and C discard it and copy D's log. No committed write was lost, and at no point did two leaders commit conflicting values. The cost: clients on the minority side saw errors for the whole partition. That is the C-over-A choice of the [CAP theorem](/modules/cap-theorem) in action.

**Step 6, the lease pitfall.** A batch job uses an etcd lease of 10 s to make sure only one copy runs. Its holder enters a 15-second garbage-collection pause. After 10 s the lease expires and a second instance takes it, receiving fencing token **34** (the first had **33**). When the first wakes up and writes to the storage with token 33, the storage, which has already seen 34, rejects it. Without the token, both would have written.

## In the real world

- **etcd.** A Raft-based key-value store and the brain of [Kubernetes](/modules/kubernetes): every object in a cluster lives there. Defaults are a 100 ms heartbeat (`--heartbeat-interval`) and a 1,000 ms election timeout (`--election-timeout`); the docs recommend 3 or 5 members and warn that a 7-member cluster rarely makes sense. <Src id="etcd-faq" />
- **ZooKeeper.** Uses Zab. Applications build leader election and locks on its ephemeral sequential nodes: each candidate creates a node that disappears when its session ends, and the one with the lowest sequence number is leader. Kafka relied on it for controller election until KRaft, Kafka's own Raft, replaced it in Kafka 4.0.
- **Kubernetes Lease objects.** Controllers such as kube-scheduler run several replicas and elect one with a Lease in the API server (backed by etcd), with defaults of a 15 s lease duration, 10 s renew deadline and 2 s retry period.
- **CockroachDB and TiKV.** Split data into ranges of a few hundred megabytes, and each range is its own Raft group of usually 3 replicas. One cluster runs thousands of small Raft groups, which spreads leadership and load across the nodes.

## Trade-offs

| | Consensus (Raft, Paxos) | Async primary-replica |
|---|---|---|
| Lost writes on fail-over | None that were committed | The last few unreplicated writes |
| Write latency | One majority round trip plus a disk write | Local disk write only |
| Behaviour in a partition | Minority side stops accepting writes | Can keep writing, risks split-brain |
| Cost | 3 or 5 nodes minimum | 2 nodes can work |

- **Latency against safety.** Every committed write waits for a majority to fsync. Inside one data centre that is a millisecond or two; across regions 50 to 100 ms apart, every write pays a cross-region round trip.
- **Election speed against false elections.** Shorter election timeouts recover faster, but a network blip or a long pause triggers needless elections, each a short write outage. Set the timeout well above the round-trip time; etcd's tuning guide suggests a heartbeat close to the RTT between members and an election timeout of about 10 times the heartbeat.
- **Throughput ceiling.** All writes for one group go through one leader. To scale, split the data into many groups (as CockroachDB does), rather than adding nodes to one group.

## Interview tips

- Whenever your design has "a primary" or "a single coordinator", say how it is chosen and replaced: a lease in etcd or ZooKeeper, or the database's built-in consensus.
- Do the quorum math out loud: 2f + 1 nodes to survive f failures, and why you pick 3 or 5.
- Name split-brain and how the design avoids it: majority votes plus fencing tokens or terms.
- You do not have to write Raft. Use a coordination service and spend your time on the parts that are specific to the problem.

**Common mistakes:**

- Running 2 or 4 nodes and expecting more fault tolerance than 1 or 3.
- Treating a lease or lock as proof of leadership without fencing, so a paused process corrupts data.
- Putting all consensus nodes in one availability zone, so a zone outage takes away the majority.
- Using a consensus store for high-volume data. etcd's default size limit is 2 GB and it is built for small, critical metadata, not user data.

## Common follow-up questions

### What happens if the leader is alive but slow?

Followers only start an election if heartbeats stop, so a slow but alive leader keeps its role and drags latency down. Systems add health checks that make a struggling leader step down, and some, like etcd, have a leader transfer command so an operator can move leadership off a bad machine.

### Can you read from followers?

A follower may be behind, so reading from it can return stale data. For a linearizable read, the leader must confirm it is still leader (by hearing from a majority, called a ReadIndex check in Raft) before answering. Many systems offer both: fast, possibly stale follower reads and slower, linearizable leader reads. See [consistency patterns](/modules/consistency-patterns).

### How do you add or remove nodes?

Carefully, one at a time, because changing the membership changes what a majority means. Raft handles it with special configuration entries in the log, committed like any other write. Replacing a node is "add the new one, let it catch up, remove the old one", never the reverse, so the cluster is never one failure from losing its majority.

### What is the difference between consensus and a quorum in Dynamo-style stores?

Dynamo-style stores (Cassandra, Riak) use read and write quorums (R + W > N) per request, with no leader and no agreed order, so concurrent writes can conflict and must be resolved later. Consensus agrees on a single order of operations through a leader, so there are no conflicts to resolve, at the cost of the leader being a bottleneck and the minority side stopping in a partition.

### Is Byzantine fault tolerance needed?

Raft and Paxos assume nodes crash or are slow, never lie. Tolerating nodes that send wrong or malicious messages needs Byzantine fault-tolerant algorithms such as PBFT, which need 3f + 1 nodes for f faults and many more messages. Inside one company's data centre that cost is rarely worth it; blockchains are the main users.

## Go deeper

- [Raft visualization and paper](https://raft.github.io/): an interactive simulation where you can crash nodes and watch elections, plus the original paper, which is readable in an afternoon.
- [The Secret Lives of Data: Raft](https://thesecretlivesofdata.com/raft/): a step-by-step animated walkthrough of elections and log replication.
- [Martin Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html): why a lease alone is not safe and how fencing tokens fix it.
- [etcd FAQ](https://etcd.io/docs/v3.5/faq/): practical answers on cluster size, tuning heartbeats and election timeouts, and what happens when the majority is lost.
