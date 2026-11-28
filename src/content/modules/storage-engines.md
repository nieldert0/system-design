---
slug: storage-engines
title: 'Storage engines: B-trees and LSM-trees'
section: databases
readFirst:
  - indexes-and-sql-tuning
sources:
  - id: ddia
    title: Designing Data-Intensive Applications, Chapter 3 (Martin Kleppmann, O'Reilly)
    url: https://dataintensive.net/
    license: Book, cited
    use: reworded
  - id: lsm-paper
    title: The Log-Structured Merge-Tree (O'Neil et al., 1996)
    url: https://www.cs.umb.edu/~poneil/lsmtree.pdf
    license: Paper, cited
    use: reworded
  - id: rocksdb-compaction
    title: RocksDB wiki, Leveled Compaction
    url: https://github.com/facebook/rocksdb/wiki/Leveled-Compaction
    license: GPLv2 / Apache 2.0 (docs), cited
    use: reworded
  - id: rocksdb-tuning
    title: RocksDB wiki, RocksDB Tuning Guide
    url: https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide
    license: GPLv2 / Apache 2.0 (docs), cited
    use: reworded
  - id: innodb-page
    title: MySQL 8.0 Reference Manual, innodb_page_size
    url: https://dev.mysql.com/doc/refman/8.0/en/innodb-parameters.html#sysvar_innodb_page_size
    license: Official docs, cited
    use: reworded
  - id: cassandra-compaction
    title: Apache Cassandra documentation, Compaction
    url: https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html
    license: Apache 2.0
    use: reworded
  - id: wiki-bloom
    title: Wikipedia, Bloom filter
    url: https://en.wikipedia.org/wiki/Bloom_filter
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: In an LSM-tree, where does a write go before it is acknowledged?
    options:
      - Straight into the right page of a B-tree on disk
      - The write-ahead log and the in-memory memtable
      - The lowest level of SSTables
      - Only the Bloom filter
    correct: 1
    explanation: The WAL makes it durable, the memtable makes it readable; SSTables come later, on flush.
  - prompt: Why are SSTables immutable?
    options:
      - So they can be written sequentially once and merged later, instead of being updated in place
      - Because disks cannot overwrite data
      - To make Bloom filters unnecessary
      - So they can be encrypted
    correct: 0
    explanation: Never updating in place turns random writes into sequential ones; compaction reclaims space later.
  - prompt: Which compaction strategy usually has the lowest space amplification?
    options:
      - Size-tiered
      - Leveled
      - No compaction
      - They are always identical
    correct: 1
    explanation: Leveled keeps about 90% of the data in the last level with at most one version per key there, so space overhead is around 10%.
  - prompt: In the worked example, a point lookup for a key that does not exist checks 8 SSTables, each with a 1% false-positive Bloom filter. About how many disk reads does it cost on average?
    options:
      - 8
      - About 0.08
      - 1
      - 0.8
    correct: 1
    explanation: Each filter wrongly says "maybe" 1% of the time, so 8 × 0.01 = 0.08 expected reads.
  - prompt: In the worked example, 100 million keys get Bloom filters at 10 bits per key. How much memory do the filters need?
    options:
      - About 12.5 MB
      - About 125 MB
      - About 1.25 GB
      - About 10 GB
    correct: 1
    explanation: 100,000,000 × 10 bits = 1,000,000,000 bits = 125,000,000 bytes, about 125 MB.
  - prompt: The service writes 50 MB/s of user data and the LSM-tree has a write amplification of 20. What does the SSD actually absorb?
    options:
      - 50 MB/s
      - About 1 GB/s
      - 2.5 MB/s
      - 200 MB/s
    correct: 1
    explanation: 50 MB/s × 20 = 1,000 MB/s, which is why write amplification decides SSD wear and compaction throughput.
  - prompt: Why can a B-tree have high write amplification for small random updates?
    options:
      - Every update rewrites a whole page (16 KB in InnoDB) even if only 1 KB changed
      - B-trees never use a WAL
      - B-trees compact constantly
      - B-trees store every version of a row
    correct: 0
    explanation: The unit of write is the page, so a 1 KB change can cost a 16 KB page write plus the log.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import StorageEngineFlow from '#lib/diagrams/StorageEngineFlow.svelte';
</script>

A storage engine is the part of a database that actually lays bytes on disk and finds them again. Almost every engine you will meet is one of two designs: the B-tree, which updates data in place, and the LSM-tree, which only ever appends and tidies up later. Which one sits under your database decides how fast it writes, how fast it reads, and how much disk it needs.

## What it is

Here is the problem. A sensor platform ingests 50,000 small writes per second with random keys. If each write must find its row's place on disk and overwrite it, the disk spends its time seeking to random locations and rewriting whole pages for a few hundred bytes of change. Meanwhile a product catalogue next door does mostly reads and wants each lookup to cost at most one disk read. One engine design cannot be best at both, so databases pick a side.

- A **<Term id="b-tree">B-tree</Term>** keeps keys sorted in fixed-size pages on disk (8 KB in PostgreSQL, 16 KB by default in InnoDB) and updates the page that holds the key. Reads are predictable: three or four page hops from the root to the leaf. Writes are random and rewrite whole pages. <Src id="innodb-page" /> <Src id="ddia" />
- An **<Term id="lsm-tree">LSM-tree</Term>** (log-structured merge-tree) buffers writes in memory, writes them out as sorted, immutable files, and merges those files in the background. Writes are sequential and cheap. Reads may have to look in several files, so it leans on caching and <Term id="bloom-filter">Bloom filters</Term>. <Src id="lsm-paper" />

Both use a <Term id="write-ahead-log">write-ahead log</Term> for durability, and both are ways to implement an [index](/modules/indexes-and-sql-tuning). The difference is what they do with a write after logging it.

## How it works

### B-tree: update in place

A B-tree is a tree of pages. Each internal page holds a few hundred keys and pointers to child pages, so a tree of depth 4 with about 500 pointers per page can address 500⁴ ≈ 62 billion entries. To write, the engine walks to the leaf page, changes it in the <Term id="buffer-pool">buffer pool</Term> (the in-memory page cache), and logs the change to the WAL. The dirty page is written back to its place on disk later, at a checkpoint. If a page overflows, it splits into two, and the split may ripple up. <Src id="ddia" />

The cost is that the disk's unit of work is the page. Changing one 100-byte row dirties a 16 KB page, and if that page is written back before anything else on it changes, you wrote 160 times more bytes than you changed. InnoDB also writes each page twice, first to a *doublewrite buffer*, so a crash mid-write cannot leave a half-written page. Pages also end up partly empty after splits, typically 50 to 70% full, which wastes space.

### LSM-tree: append, then merge

An LSM-tree never updates a file. The write path, shown below, has four stages. <Src id="lsm-paper" /> <Src id="ddia" />

1. **Log.** Append the write to the WAL. This is a sequential append, so it is fast even on spinning disks.
2. **<Term id="memtable">Memtable</Term>.** Insert it into a sorted in-memory structure, usually a skip list. The write is now acknowledged.
3. **Flush.** When the memtable reaches its size limit, freeze it, start a new one, and write the frozen one to disk as a **<Term id="sstable">sorted string table (SSTable)</Term>**: an immutable file of key-value pairs sorted by key, with a small index of block offsets and a Bloom filter. Once flushed, the WAL segment for it can be deleted.
4. **<Term id="compaction">Compaction</Term>.** In the background, merge several SSTables into new, larger ones. Because inputs are sorted, this is a merge sort that reads and writes sequentially. Where the same key appears in several files, only the newest version is kept; deletes are written as **<Term id="tombstone">tombstones</Term>** (markers that say "this key is deleted"), and compaction drops the key and eventually the tombstone.

<StorageEngineFlow />

A read checks the newest data first: the active memtable, any frozen memtables, then SSTables from newest to oldest. The first version found wins. To avoid opening every file, each SSTable has a Bloom filter in memory, a compact bit array that answers "definitely not in this file" or "maybe in this file". With 10 bits per key the false-positive rate is about 1%, so a lookup touches disk only for files that really hold the key, plus a rare false alarm. Bloom filters do not help range scans, which must merge every overlapping file. <Src id="wiki-bloom" />

### Compaction strategies

How files are merged sets almost every trade-off in an LSM-tree. <Src id="rocksdb-compaction" /> <Src id="cassandra-compaction" />

- **Size-tiered.** Group SSTables of similar size and, when there are enough of them (4 by default in Cassandra), merge them into one bigger file. Each byte is rewritten only once per tier, so write amplification is low. But a key may live in many files of different sizes, so reads touch more files, and merging the largest tier needs free disk equal to the tier's size, so space amplification can reach 2×.
- **Leveled.** Split the data into levels L1, L2, L3, each about 10 times larger than the last. Within a level, files cover non-overlapping key ranges, so a key is in at most one file per level. When a level outgrows its target, one file is merged into the overlapping files of the next level. Reads touch at most one file per level and about 90% of data sits in the last level, so space overhead is about 10%. The price is that moving a file down a level rewrites about 10 times its size in the next level, so write amplification is high.

Newer engines mix the two, for example RocksDB's universal compaction and Cassandra's Unified Compaction Strategy, which let you tune between them.

### The three amplifications

The cleanest way to compare engines is three ratios: <Src id="rocksdb-tuning" />

- **<Term id="write-amplification">Write amplification</Term>**: bytes written to disk ÷ bytes the application wrote. It drives disk bandwidth and SSD wear.
- **Read amplification**: disk reads per logical read. It drives lookup latency.
- **Space amplification**: bytes on disk ÷ bytes of live data. It drives how much disk you buy.

You cannot minimise all three at once. Updating in place keeps reads and space tight but writes are random and page-sized; appending makes writes cheap but leaves stale versions to clean up, which costs either reads (not merged yet) or writes (merged eagerly).

## Worked example

A metrics service stores **100 GB** of live data as **100 million keys** of about **1 KB** each, and takes **50,000 writes/s**, so **50 MB/s** of new data. It runs on RocksDB with leveled compaction and the defaults below. <Src id="rocksdb-tuning" />

**Step 1, the write path.** Each write is appended to the WAL: 50 MB/s of sequential writes. The memtable is 64 MB (`write_buffer_size`), so it fills every 64 ÷ 50 ≈ **1.3 seconds** and is flushed as a 64 MB SSTable in L0.

**Step 2, the level sizes.** L1's target is 256 MB (`max_bytes_for_level_base`) and each level is 10 times the last (`max_bytes_for_level_multiplier`): L1 256 MB, L2 2.56 GB, L3 25.6 GB, L4 256 GB. 100 GB fits by L4, so the data lives in L0 plus four levels.

**Step 3, write amplification.** Each byte is written once to the WAL, once on flush, and once when L0 merges into L1. Each move from L1 to L2, L2 to L3, and L3 to L4 can rewrite up to about 10 bytes of the next level per byte moved. Worst case: 1 + 1 + 1 + 3 × 10 = **33**. In practice it is usually 10 to 30, because files do not overlap the whole next level. Take **20**: the SSD absorbs 50 MB/s × 20 = **1 GB/s** of writes. At that rate it writes about 86 TB a day, so an SSD rated for, say, 10 PB of writes lasts under four months. This is why write-heavy LSM deployments watch write amplification first.

**Step 4, the B-tree alternative.** In InnoDB, each 1 KB update dirties a 16 KB page. If updates are random across 100 GB, few land on the same page before it is flushed, so each costs roughly 16 KB of page write, doubled by the doublewrite buffer, plus about 1 KB of log: about 33 KB per 1 KB, a write amplification near **33**, and *random* writes. A large buffer pool that absorbs several updates per page brings that down, which is why B-trees do well when the hot set fits in memory.

**Step 5, a read for a missing key.** The lookup checks the memtable (memory), then 4 L0 files (they overlap, so all are checked; 4 is the default `level0_file_num_compaction_trigger`), then one file in each of L1 to L4: **8 SSTables**. Without Bloom filters, that is 8 disk reads. With 10 bits per key and a ~1% false-positive rate, the expected cost is 8 × 0.01 = **0.08 disk reads**. A key that exists in L4 costs about 1 + 7 × 0.01 = **1.07 reads**.

**Step 6, the cost of the filters.** 100 million keys × 10 bits = 1 billion bits = **125 MB** of RAM. Halving the bits to 5 per key saves about 62 MB but raises the false-positive rate to about 10%, so a missing-key lookup costs 0.8 reads instead of 0.08.

**Step 7, the B-tree read.** With about 500 keys per page, 100 million keys need a tree of depth 3 (500³ = 125 million). The root and second level total about 1 + 500 pages = 8 MB at 16 KB each, so they stay cached, and a lookup costs about **1 disk read**, hit or miss. Similar to the LSM's 1.07, but with no Bloom filter to hold in memory.

**Step 8, space.** With leveled compaction, L4 holds about 90% of the data and the upper levels hold the rest, some of it stale versions, so disk use is about 100 GB ÷ 0.9 ≈ **111 GB**. With size-tiered compaction, merging the largest tier needs free space equal to its size, so plan for up to **200 GB**. The B-tree, with pages about 70% full, uses about 100 ÷ 0.7 ≈ **143 GB**.

## In the real world

- **MySQL InnoDB and PostgreSQL** are B-tree engines. InnoDB stores each table as a B-tree clustered on the primary key, with 16 KB pages by default (`innodb_page_size`), a redo log, and the doublewrite buffer (`innodb_doublewrite`). PostgreSQL keeps rows in an unordered heap of 8 KB pages and builds B-tree indexes beside it; with <Term id="mvcc">MVCC</Term>, an update writes a new row version and `VACUUM` reclaims old ones, which is its own form of deferred clean-up. <Src id="innodb-page" />
- **RocksDB** is Meta's LSM library, embedded in MyRocks, CockroachDB's predecessor storage, Kafka Streams state stores and many others. Defaults worth knowing: `write_buffer_size` 64 MB, `level0_file_num_compaction_trigger` 4, `max_bytes_for_level_base` 256 MB, multiplier 10. Bloom filters are configured per table with a bits-per-key setting; 10 is the common choice. Meta moved MySQL from InnoDB to MyRocks for some workloads mainly to cut space and write amplification. <Src id="rocksdb-compaction" /> <Src id="rocksdb-tuning" />
- **Apache Cassandra** is LSM-based throughout: commit log, memtables, SSTables. Size-tiered compaction (`SizeTieredCompactionStrategy`) was the long-standing default and suits write-heavy tables; `LeveledCompactionStrategy` suits read-heavy ones; `TimeWindowCompactionStrategy` suits time series with TTLs, because whole files expire together. Tombstones linger for `gc_grace_seconds` (10 days by default) so replicas that missed a delete can learn it during repair. <Src id="cassandra-compaction" />
- **LevelDB**, from Google, is the small library that introduced leveled compaction in its current form, and RocksDB began as a fork of it. Its design notes are short and are the clearest description of the levels.

## Trade-offs

- **B-tree: reads and space predictable, writes random.** One or two disk reads per lookup and no background merging, but random page writes and page-sized write amplification. Best for read-heavy OLTP and workloads whose working set fits in the buffer pool.
- **LSM: writes cheap and sequential, reads and clean-up deferred.** It ingests far more writes per second and compresses well, since files are written once in big sorted blocks. The price is compaction: background CPU and disk bandwidth that compete with foreground traffic, and latency spikes if compaction falls behind and L0 files pile up (RocksDB then slows or stalls writes on purpose).
- **Size-tiered vs leveled.** Size-tiered for write-heavy data you rarely read back by key; leveled for read-heavy data and when disk space is tight.
- **Deletes are not free in an LSM.** A delete is a write (a tombstone), and reads must skip tombstones until compaction removes them. Queues built on Cassandra are a famous way to make every read scan thousands of tombstones.
- **Bloom filters cost memory.** About 1.2 bytes per key at 10 bits; billions of small keys can mean gigabytes of RAM.

## Interview tips

- When you pick a database, name its engine and say why: "Cassandra, because it is LSM-based and this is 50,000 writes/s of append-mostly data."
- Quote the three amplifications and which one your workload cares about.
- Draw the LSM write path (WAL, memtable, flush, SSTable, compaction) and say where Bloom filters sit on the read path.
- Mention compaction as an operational cost: it needs disk headroom and I/O budget.

**Common mistakes:**

- Saying LSM-trees are "faster" without qualification. They are faster to write; point reads are similar with Bloom filters and range scans can be slower.
- Forgetting the WAL. The memtable is in memory; without the log a crash loses everything not yet flushed.
- Assuming a delete frees space immediately in an LSM. It writes a tombstone; space comes back only after compaction.
- Running size-tiered compaction on a disk that is 70% full. The next big merge needs as much free space as its inputs and will fail.

## Common follow-up questions

### Why are LSM-trees better on SSDs and for write-heavy workloads?

They turn random writes into large sequential ones, which both spinning disks and SSDs handle far better, and they compress well because files are written once in sorted blocks. On SSDs, lower write amplification than a B-tree under random updates also means less wear, though leveled compaction can give that back if not tuned.

### How does an LSM-tree handle an update to an existing key?

It does not find the old value. It writes the new version with a higher sequence number into the memtable. Reads return the newest version they find, and compaction discards older ones when it merges files. A delete works the same way with a tombstone.

### What happens if compaction cannot keep up?

L0 files and stale versions accumulate, so reads check more files and disk use grows. RocksDB responds by slowing writes once L0 passes a threshold and stopping them at a higher one, which shows up as write latency spikes. The fixes are more compaction threads, faster disks, larger memtables, or a lower ingest rate.

### How do Bloom filters work, and why not use them in a B-tree?

A Bloom filter hashes each key with several hash functions and sets those bits in a bit array; a lookup checks the same bits, and if any is zero the key is definitely absent. They suit LSM-trees because a key could be in many files and the filter skips most of them. A B-tree has one place each key can be, found in one walk, so there is nothing to skip.

### When would you choose a B-tree engine anyway?

When reads dominate, when you need fast range scans and stable latency without background merges, or when transactions with row locks matter, as in most relational OLTP. PostgreSQL and InnoDB are B-tree engines for these reasons. See [SQL vs NoSQL](/modules/sql-vs-nosql).

## Go deeper

- [Designing Data-Intensive Applications, Chapter 3](https://dataintensive.net/): the clearest book-length comparison of B-trees, SSTables and LSM-trees.
- [The Log-Structured Merge-Tree (O'Neil et al., 1996)](https://www.cs.umb.edu/~poneil/lsmtree.pdf): the original paper, with the cost model behind deferring and batching writes.
- [RocksDB wiki, Leveled Compaction](https://github.com/facebook/rocksdb/wiki/Leveled-Compaction): how levels, targets and compaction picking work, with diagrams.
- [Apache Cassandra documentation, Compaction](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/index.html): size-tiered, leveled, time-window and unified strategies, and when to use each.
