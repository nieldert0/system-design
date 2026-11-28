---
slug: search-and-inverted-indexes
title: Search and inverted indexes
section: databases
readFirst:
  - indexes-and-sql-tuning
sources:
  - id: wiki-ii
    title: Wikipedia, Inverted index
    url: https://en.wikipedia.org/wiki/Inverted_index
    license: CC BY-SA 4.0
    use: reworded
  - id: irbook
    title: Manning, Raghavan and Schütze, Introduction to Information Retrieval (Cambridge University Press, 2008)
    url: https://nlp.stanford.edu/IR-book/
    license: Book, cited
    use: reworded
  - id: wiki-bm25
    title: Wikipedia, Okapi BM25
    url: https://en.wikipedia.org/wiki/Okapi_BM25
    license: CC BY-SA 4.0
    use: reworded
  - id: es-docs
    title: Elasticsearch Reference (Elastic documentation)
    url: https://www.elastic.co/docs/reference/elasticsearch
    license: Docs, cited
    use: reworded
quiz:
  - prompt: Why does LIKE '%rust%' on a 50-million-row table get slow, while a search engine answers the same query in milliseconds?
    options:
      - The search engine keeps everything in a B-tree sorted by text
      - A leading wildcard cannot use a B-tree index, so the database scans every row; an inverted index looks up the word's posting list directly
      - The search engine caches every possible query
      - LIKE is slow only on PostgreSQL
    correct: 1
    explanation: The inverted index flips the problem from "scan documents for a word" to "look up the word, get its documents".
  - prompt: The same analyzer must run at index time and at query time. What goes wrong if the query side skips stemming?
    options:
      - Nothing, stemming is only for storage
      - The query term "running" is looked up as-is but the index only holds "run", so matching documents are missed
      - Every query matches every document
      - Scores become negative
    correct: 1
    explanation: Terms only match if both sides produce exactly the same token.
  - prompt: To answer the AND query "rust tutorial", which posting list should the engine walk first?
    options:
      - The longer one, rust
      - The shorter one, tutorial, then check each of its documents against rust
      - It does not matter, both are read in full
      - Neither; it scans the documents
    correct: 1
    explanation: Intersection cost is driven by the shorter list; skip pointers let it jump through the longer one.
  - prompt: In the worked example, document B mentions rust 6 times and document A only 3, yet A scores higher on rust (3.61 vs 3.37). Why?
    options:
      - BM25 ignores term frequency
      - B is three times the average length, so BM25 normalises its frequency down, and tf also saturates
      - A was indexed first
      - rust has a higher IDF in A
    correct: 1
    explanation: With b = 0.75 and dl/avgdl = 3, B's length factor K is 3.0 against A's 1.2, which outweighs the extra mentions.
  - prompt: In the worked example, why does "tutorial" contribute more to the score than "rust" for a document that has each once?
    options:
      - It is a longer word
      - It appears in only 10 of 1,000 documents, so its IDF (about 4.56) is about twice that of rust (about 2.30)
      - It comes second in the query
      - Stop words are boosted
    correct: 1
    explanation: Rare terms carry more information, which is the whole point of inverse document frequency.
  - prompt: A user saves a document and searches for it 200 ms later in Elasticsearch with default settings. Why might it be missing?
    options:
      - The write was lost
      - New documents become searchable only after the next refresh, which opens a new segment, by default about once a second
      - Replicas must be deleted first
      - Search only covers documents older than a day
    correct: 1
    explanation: Search is near-real-time; the document is durable in the translog but not yet in a searchable segment.
  - prompt: Why can't you change the number of primary shards of an existing Elasticsearch index in place?
    options:
      - Shards are stored on tape
      - A document's shard is chosen by hashing its routing value modulo the primary shard count, so changing the count would move nearly every document
      - Elasticsearch has a hard limit of five shards
      - Replicas would be lost
    correct: 1
    explanation: It is the mod-N problem from consistent hashing; you reindex, or use split/shrink to change by a factor.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import InvertedIndexFlow from '#lib/diagrams/InvertedIndexFlow.svelte';
</script>

Search engines answer "which documents contain these words, best first?" across millions of documents in milliseconds. The data structure that makes this possible is the inverted index, and the rest of a search system is built around keeping it fresh, split across machines, and ranked well.

## What it is

Here is the problem. A shop has 50 million product descriptions in a relational table, and a user types `wireless headphones`. The obvious query, `WHERE description LIKE '%wireless%' AND description LIKE '%headphones%'`, cannot use a [B-tree index](/modules/indexes-and-sql-tuning) because the pattern starts with a wildcard, so the database reads all 50 million rows on every search. It also misses "Wireless Headphone" (capital letter, singular), and it has no idea which of 40,000 matches the user wants first.

An **<Term id="inverted-index">inverted index</Term>** turns the data around. Instead of storing "document → words", it stores "word → documents that contain it", like the index at the back of a book. A query looks up each word, gets a short sorted list of document ids, combines the lists, and ranks the survivors. The work depends on how many documents match, not how many exist. <Src id="wiki-ii" />

Three pieces make it a search engine rather than a lookup table: **analysis**, which turns raw text into comparable terms; **query evaluation**, which combines lists for AND, OR and phrases; and **scoring**, which orders results by relevance using formulas like TF-IDF and BM25.

## How it works

### Analysis: from text to terms

Before anything is indexed, an **analyzer** turns each field's text into a stream of tokens. A typical English pipeline is: <Src id="irbook" />

1. **Tokenise.** Split on whitespace and punctuation: `"The Runner's shoes, running fast!"` becomes `The`, `Runner's`, `shoes`, `running`, `fast`.
2. **Normalise.** Lowercase, strip possessives and accents: `the`, `runner`, `shoes`, `running`, `fast`.
3. **Remove <Term id="stop-word">stop words</Term>.** Drop very common words like `the`, `a`, `of` that appear in nearly every document and carry little meaning.
4. **Stem.** <Term id="stemming">Stemming</Term> cuts words to a common root with rules, so `shoes` → `shoe` and `running` → `run`. The Porter stemmer is the classic algorithm. Lemmatisation does the same with a dictionary, so it can map `ran` to `run` too, at more cost.

The same analyzer runs on the query, so `Running Shoe` becomes `run`, `shoe` and matches. If the two sides differ, terms silently stop matching. Analysis is also where synonyms (`tv` → `television`), n-grams for autocomplete, and language-specific rules live.

### Posting lists

For each distinct term, the index keeps a <Term id="posting-list">posting list</Term>: the sorted ids of documents containing it, plus, per document, the term frequency and the positions where it occurs. The set of all terms is the **dictionary**, stored as a sorted structure (Lucene uses a compact finite-state automaton) so a term is found in a few microseconds. <Src id="wiki-ii" />

```
run     → doc 1 [pos 3], doc 4 [pos 0, 7], doc 9 [pos 2]
shoe    → doc 1 [pos 2], doc 9 [pos 3]
```

Lists are sorted by document id so they can be compressed: store the gaps between ids (1, 3, 5 instead of 1, 4, 9), which are small numbers that fit in a byte or a few bits. Compressed posting lists often take a fraction of the raw text's size, and positions are the bulk of it.

<InvertedIndexFlow />

### Query evaluation

- **AND** is an intersection of sorted lists. Walk both lists with two pointers, advancing whichever has the smaller id; equal ids are matches. Start from the shortest list, and use **skip pointers** (stored jumps every so many entries) to leap through the long one, so `the-rare-word AND common-word` costs about the length of the rare list. <Src id="irbook" />
- **OR** is a merge (union). Engines avoid scoring every document in a huge union with tricks like WAND and block-max WAND, which skip documents that cannot reach the current top-k score.
- **Phrase** queries like `"run shoe"` first intersect, then check positions: a match needs `shoe` at position p + 1 where `run` is at p. Doc 9 above matches (2 and 3); doc 1 does not (3 and 2). A **slop** allows a few positions of gap.
- **Prefix and fuzzy** queries walk the sorted dictionary to expand `head*` or `headphnoes~1` into a set of real terms first, then OR their lists.

### Scoring: TF-IDF and BM25

Matching gives a set; users want an order. Two intuitions drive almost every relevance formula: <Src id="irbook" />

- **Term frequency (tf):** a document that mentions a query word more often is probably more about it.
- **Inverse document frequency (idf):** a word that appears in few documents is more informative. With N documents and the term in df of them, the classic idf is `ln(N / df)`.

<Term id="tf-idf">TF-IDF</Term> scores a document as the sum over query terms of tf × idf. Its weaknesses are that 20 mentions score twice as high as 10, and long documents win simply by containing more words.

<Term id="bm25">BM25</Term> (Okapi BM25) fixes both and is the default in Lucene, Elasticsearch and OpenSearch. For each query term: <Src id="wiki-bm25" />

```
idf   = ln(1 + (N − df + 0.5) / (df + 0.5))
K     = k1 × (1 − b + b × dl / avgdl)
score = idf × tf × (k1 + 1) / (tf + K)
```

Here dl is the document's length in terms and avgdl the average. **k1** (default 1.2) controls saturation: as tf grows the score approaches idf × (k1 + 1) instead of growing forever. **b** (default 0.75) controls length normalisation: b = 0 ignores length, b = 1 fully normalises. Lucene drops the constant (k1 + 1) factor from the numerator since it does not change the ordering. <Src id="es-docs" />

### Segments and merging

Rewriting a giant sorted index for each new document would be hopeless, so Lucene-based engines write the index as many immutable **<Term id="index-segment">segments</Term>**, each a small complete inverted index. New documents are buffered in memory and flushed as a new segment; a search runs over every segment and merges the results. This is the same idea as an <Term id="lsm-tree">LSM tree</Term>. <Src id="es-docs" />

Immutability has consequences. A delete only marks the document in a per-segment bitmap; an update is a delete plus a new insert. A background **merge** process combines small segments into bigger ones and drops deleted documents for real, which keeps the segment count (and per-query overhead) low at the cost of disk I/O. Force-merging a read-only index down to one segment makes it fastest to search.

### Shards, replicas and near-real-time

Elasticsearch and OpenSearch split an index into **primary shards**, each a full Lucene index on some node, and keep **replica** copies of each. A document's shard is `hash(_routing) mod number_of_primary_shards`, where routing defaults to the document id. That is [mod-N hashing](/modules/consistent-hashing), which is why the primary count is fixed at index creation (the split and shrink APIs can change it by a whole factor, otherwise you reindex). Replica count can change any time. <Src id="es-docs" />

A search is [scatter-gather](/modules/federation-sharding-denormalization): the coordinating node sends the query to one copy of every shard, each returns its top k ids and scores, and the coordinator merges them and fetches the winning documents. Replicas add both failover and read <Term id="throughput">throughput</Term>, since any copy can serve a query.

Writes go to the primary, are appended to a **translog** (a <Term id="write-ahead-log">write-ahead log</Term>) for durability, and are forwarded to replicas. They become searchable only at the next **refresh**, which turns the in-memory buffer into a new searchable segment. The default `index.refresh_interval` is 1 second, which is why this is called <Term id="near-real-time-search">near-real-time</Term> search: a document is safe as soon as the write returns, but visible about a second later. <Src id="es-docs" />

## Worked example

A tutorial site has **N = 1,000** documents with an average length of **100 terms**. A user searches `rust tutorial`. After analysis both words survive unchanged. The term `rust` appears in **df = 100** documents and `tutorial` in **df = 10**. We score three documents with BM25 (k1 = 1.2, b = 0.75), keeping the (k1 + 1) = 2.2 factor so the numbers read naturally.

| Doc | Length (dl) | tf(rust) | tf(tutorial) |
| --- | --- | --- | --- |
| A | 100 | 3 | 1 |
| B | 300 | 6 | 1 |
| C | 50 | 0 | 2 |

**Step 1, candidates.** The query is an OR, so the engine unions the two lists: up to 110 candidates, though usually fewer since some documents contain both. Walking the 10-entry `tutorial` list first is cheap.

**Step 2, idf.**
- rust: (1000 − 100 + 0.5) / (100 + 0.5) = 900.5 / 100.5 = 8.960; ln(1 + 8.960) = ln(9.960) = **2.299**.
- tutorial: (1000 − 10 + 0.5) / (10 + 0.5) = 990.5 / 10.5 = 94.33; ln(95.33) = **4.557**.

The rare word is worth about twice as much. (Plain TF-IDF's ln(N/df) gives 2.303 and 4.605, nearly the same here.)

**Step 3, length factor K = 1.2 × (0.25 + 0.75 × dl / 100).**
- A: dl/avgdl = 1, K = 1.2 × 1.0 = **1.2**.
- B: dl/avgdl = 3, K = 1.2 × (0.25 + 2.25) = **3.0**.
- C: dl/avgdl = 0.5, K = 1.2 × (0.25 + 0.375) = **0.75**.

**Step 4, per-term scores, idf × tf × 2.2 / (tf + K).**
- A, rust: 3 × 2.2 / (3 + 1.2) = 6.6 / 4.2 = 1.571, × 2.299 = **3.61**. A, tutorial: 1 × 2.2 / 2.2 = 1.0, × 4.557 = **4.56**. Total **8.17**.
- B, rust: 6 × 2.2 / (6 + 3.0) = 13.2 / 9 = 1.467, × 2.299 = **3.37**. B, tutorial: 2.2 / (1 + 3.0) = 0.55, × 4.557 = **2.51**. Total **5.88**.
- C, rust: 0. C, tutorial: 2 × 2.2 / (2 + 0.75) = 4.4 / 2.75 = 1.6, × 4.557 = **7.29**. Total **7.29**.

**Step 5, ranking: A (8.17), C (7.29), B (5.88).** B mentions rust twice as often as A, but it is three times as long, so its frequencies count for less, and saturation means the sixth mention adds little over the third. C never says "rust" yet beats B, because the rare word `tutorial` is dense in a short document. Under plain TF-IDF (tf × idf), B would score 6 × 2.303 + 4.605 = 18.42 against A's 3 × 2.303 + 4.605 = 11.51 and C's 9.21, and the long, padded document would win. That is exactly what BM25's saturation and length normalisation were designed to stop.

**Step 6, at scale.** Now the index holds 50 million documents in 5 primary shards with 1 replica each, on 5 nodes. Each shard computes these scores with its own local statistics, returns its top 10, and the coordinator merges 50 candidates into the final 10. Local df values differ slightly between shards; with millions of documents per shard it barely matters, and the `dfs_query_then_fetch` search type gathers global statistics first when it does.

## In the real world

- **Apache Lucene.** The library under Elasticsearch, OpenSearch and Solr. It implements segments, compressed posting lists, FST term dictionaries, skip lists and block-max WAND, and uses `BM25Similarity` as the default scorer. <Src id="es-docs" />
- **Elasticsearch and OpenSearch.** Distributed Lucene with a REST API. Knobs a practitioner mentions: `number_of_shards` (fixed at creation, default 1 since Elasticsearch 7.0), `number_of_replicas` (default 1), `index.refresh_interval` (default `1s`; set it to `-1` or `30s` during bulk loads), per-field `analyzer` in the mapping, and the `similarity` setting to tune BM25's k1 and b. Shards of roughly 10 to 50 GB are the usual sizing guidance. <Src id="es-docs" />
- **PostgreSQL full-text search.** `to_tsvector` and `to_tsquery` run an analyzer with dictionaries, and a GIN index (Generalized Inverted Index) stores posting lists. Ranking with `ts_rank` is simpler than BM25, but for a few million rows it avoids running a separate cluster and keeping it in sync.
- **Twitter/X Earlybird.** Twitter's real-time tweet search kept in-memory inverted index segments optimised for appends so a tweet was searchable within seconds; see the [Twitter timeline case study](/modules/twitter-timeline).

## Trade-offs

- **Fast reads, costly writes.** Every write runs analysis and touches many posting lists; segments and merges turn that into sequential I/O, but indexing is still far more CPU-heavy than a row insert.
- **Freshness versus throughput.** A shorter refresh interval makes documents visible sooner but creates many tiny segments and more merge work. Bulk loads go much faster with refresh turned off.
- **Index size.** Positions enable phrase queries but can double the index. Fields you never phrase-search can index only document ids and frequencies.
- **Recall versus precision.** Aggressive stemming and synonyms find more documents but also wrong ones (`universe` and `university` stem to the same root under Porter).
- **A second system.** A search cluster is usually a derived copy of the primary database, so it is <Term id="eventual-consistency">eventually consistent</Term> with it, and you must build the pipeline (change data capture, an outbox, or dual writes) that keeps it in sync.
- **Shard count is a one-way door.** Too few shards cap a growing index; too many waste memory and make every query scatter wider.

## Interview tips

- When a design needs keyword search, say "inverted index" and sketch `term → [doc ids with positions]`, then name Elasticsearch or OpenSearch as the implementation.
- Mention analysis briefly (lowercase, stop words, stemming) and that the same analyzer runs on the query.
- Explain ranking with BM25 in one sentence: rare terms count more, repeated terms saturate, long documents are normalised.
- Treat the search index as a derived store fed from the source of truth through a queue or change data capture, and say it is near-real-time.
- Size it: documents × average size, number of shards, replicas for read throughput and failover.

**Common mistakes:**

- Using the search engine as the primary database. It can lose acknowledged writes in some failure modes, mappings are hard to change, and it is built to be rebuilt from a source of truth.
- Forgetting that primary shard count is fixed, then needing a full reindex when the index outgrows it.
- Expecting read-after-write: a test that indexes a document and immediately searches for it fails intermittently until it forces a refresh.
- Using different analyzers at index and query time, so stemmed terms never match.
- Paginating deep with `from: 100000`, which forces every shard to return 100,010 hits; use `search_after` instead.

## Common follow-up questions

### How do you keep the search index in sync with the database?

Write to the database first, then publish a change event through a [message queue](/modules/queues-and-back-pressure) or change data capture (for example Debezium reading the database log) to an indexer that updates the search cluster. Use the database row's version as the document version so out-of-order updates are ignored. Keep the ability to rebuild the whole index from the database, by reindexing into a new index and switching an alias to it.

### How does autocomplete work?

Index prefixes ahead of time with an edge n-gram analyzer (`hea`, `head`, `headp`…) so a prefix is an exact term lookup, or use a completion suggester, which keeps an in-memory FST of terms with weights. Rank by popularity rather than BM25, and answer within about 50 ms, since it runs on every keystroke.

### How do you search tens of billions of documents?

Shard by document (each shard holds full posting lists for its own documents) and scatter-gather, which keeps writes local and spreads load evenly. Partitioning by term instead puts each term's whole list on one node, which makes a multi-term query touch fewer nodes but turns popular terms into hot spots. Most systems shard by document, add replicas for query throughput, and tier old data onto cheaper nodes.

### How does vector or semantic search relate to this?

Inverted indexes match exact terms, so they miss "laptop" for "notebook computer". Vector search embeds text as vectors and finds nearest neighbours with an approximate index such as HNSW. Modern engines, including Elasticsearch and OpenSearch, run both and combine the rankings (hybrid search, often with reciprocal rank fusion), because BM25 is still hard to beat on exact names and codes.

## Go deeper

- [Introduction to Information Retrieval (Manning, Raghavan, Schütze)](https://nlp.stanford.edu/IR-book/): free textbook; chapters 1 to 6 cover posting lists, intersection with skip pointers, compression and tf-idf scoring in depth.
- [Elasticsearch: near real-time search](https://www.elastic.co/docs/manage-data/data-store/near-real-time-search): how refresh, segments and the translog fit together, from the official docs.
- [Okapi BM25 (Wikipedia)](https://en.wikipedia.org/wiki/Okapi_BM25): the formula, its parameters and variants such as BM25F for multi-field documents.
- [Lucene's handling of deleted documents (Elastic blog)](https://www.elastic.co/blog/lucenes-handling-of-deleted-documents): why segments are immutable and how merging reclaims space.
