---
slug: nosql-types
title: NoSQL types
section: databases
readFirst:
  - relational-and-acid
  - consistency-patterns
sources:
  - id: primer
    title: The System Design Primer, NoSQL
    url: https://github.com/donnemartin/system-design-primer#nosql
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What does BASE choose, compared with the CAP theorem?
    options:
      - Consistency over availability
      - Availability over consistency
      - Neither
      - Partition intolerance
    correct: 1
    explanation: Basically available, soft state, eventual consistency.
  - prompt: Which NoSQL type has the abstraction of a hash table?
    options:
      - Document store
      - Key-value store
      - Graph database
      - Wide column store
    correct: 1
    explanation: Key-value stores generally allow O(1) reads and writes.
  - prompt: Which type stores a whole object (e.g. JSON) and lets you query its fields?
    options:
      - Key-value store
      - Document store
      - Wide column store
      - Graph database
    correct: 1
    explanation: MongoDB and CouchDB are document stores.
  - prompt: Which type do Bigtable, HBase and Cassandra belong to?
    options:
      - Graph database
      - Document store
      - Wide column store
      - Key-value store
    correct: 2
    explanation: Wide column stores suit very large data sets with high availability.
  - prompt: Which type fits a social network's friends-of-friends queries best?
    options:
      - Key-value store
      - Graph database
      - Wide column store
      - Object storage
    correct: 1
    explanation: Graph databases are optimised for many-to-many relationships.
  - prompt: In most NoSQL stores, where are joins done?
    options:
      - In the database engine
      - In application code; data is usually denormalized
      - In the CDN
      - Joins are impossible to do at all
    correct: 1
    explanation: Data is denormalized, and joins are generally done in the application code.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import NoSqlShapes from '#lib/diagrams/NoSqlShapes.svelte';
</script>

"NoSQL" covers four quite different kinds of database. Each gives up some of SQL's flexibility to be very good at one access pattern.

## What it is

**<Term id="nosql">NoSQL</Term>** is a collection of data items represented in a **key-value store**, **document store**, **wide column store**, or a **graph database**. Data is denormalized, and joins are generally done in the application code. Most NoSQL stores lack true <Term id="acid">ACID</Term> transactions and favor <Term id="eventual-consistency">eventual consistency</Term>. <Src id="primer" />

**<Term id="base">BASE</Term>** is often used to describe the properties of NoSQL databases. In comparison with the CAP Theorem, BASE chooses availability over consistency. <Src id="primer" />

- **Basically available** - the system guarantees availability.
- **Soft state** - the state of the system may change over time, even without input.
- **Eventual consistency** - the system will become consistent over a period of time, given that the system doesn't receive input during that period.

## How it works

**Key-value store** (abstraction: hash table). A key-value store generally allows for O(1) reads and writes and is often backed by memory or SSD. Data stores can maintain keys in lexicographic order, allowing efficient retrieval of key ranges. Key-value stores provide high performance and are often used for simple data models or for rapidly-changing data, such as an in-memory <Term id="cache">cache</Term> layer. Since they offer only a limited set of operations, complexity is shifted to the application layer if additional operations are needed. <Src id="primer" />

**Document store** (abstraction: key-value store with documents stored as values). A document store is centered around documents (XML, JSON, binary, etc), where a document stores all information for a given object. Document stores provide APIs or a query language to query based on the internal structure of the document itself. Although documents can be organized or grouped together, documents may have fields that are completely different from each other. Document stores provide high flexibility and are often used for working with occasionally changing data. <Src id="primer" />

**Wide column store** (abstraction: nested map). A wide column store's basic unit of data is a column (name/value pair). A column can be grouped in column families (analogous to a SQL table). You can access each column independently with a row key, and columns with the same row key form a row. Each value contains a timestamp for versioning and for conflict resolution. Stores such as BigTable, HBase, and Cassandra maintain keys in lexicographic order, allowing efficient retrieval of selective key ranges. Wide column stores offer high availability and high <Term id="scalability">scalability</Term>. They are often used for very large data sets. <Src id="primer" />

**Graph database** (abstraction: graph). In a graph database, each node is a record and each arc is a relationship between two nodes. Graph databases are optimized to represent complex relationships with many foreign keys or many-to-many relationships. Graphs databases offer high performance for data models with complex relationships, such as a social network. <Src id="primer" />

<NoSqlShapes />

## Trade-offs

| Type | Great at | Weak at | Examples |
|---|---|---|---|
| Key-value | Fast lookups by key | Queries by anything else | Redis, DynamoDB |
| Document | Flexible, nested objects | Cross-document joins | MongoDB, CouchDB |
| Wide column | Huge write-heavy data, key ranges | Ad hoc queries | Cassandra, HBase |
| Graph | Relationship traversal | Bulk analytics, scaling out | Neo4j |

- Most give up multi-row transactions and joins in exchange for scale or speed.
- You design the schema around your queries, so new query patterns can mean new tables.

## Interview tips

- Name the type, not just "NoSQL": "a wide column store like Cassandra for the message history".
- Justify it with the access pattern: key, document, time range or relationship.
- Say how you handle what you gave up: joins in the app, eventual consistency in the UI.
