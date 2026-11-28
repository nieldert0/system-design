---
slug: geospatial-indexing
title: Geospatial indexing
section: databases
readFirst:
  - indexes-and-sql-tuning
sources:
  - id: wiki-geohash
    title: Wikipedia, Geohash
    url: https://en.wikipedia.org/wiki/Geohash
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-quadtree
    title: Wikipedia, Quadtree
    url: https://en.wikipedia.org/wiki/Quadtree
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-rtree
    title: Wikipedia, R-tree
    url: https://en.wikipedia.org/wiki/R-tree
    license: CC BY-SA 4.0
    use: reworded
  - id: s2
    title: S2 Geometry, S2 Cells
    url: http://s2geometry.io/devguide/s2cell_hierarchy
    license: Docs, cited
    use: reworded
  - id: h3
    title: H3, Tables of Cell Statistics Across Resolutions
    url: https://h3geo.org/docs/core-library/restable/
    license: Docs, cited
    use: reworded
  - id: postgis
    title: PostGIS manual, Spatial indexes
    url: https://postgis.net/docs/using_postgis_dbmanagement.html#build-indexes
    license: Docs, cited
    use: reworded
  - id: redis-geo
    title: Redis docs, GEOADD
    url: https://redis.io/docs/latest/commands/geoadd/
    license: Docs, cited
    use: reworded
quiz:
  - prompt: Why does a B-tree index on (lat, lng) do a poor job of finding points near a location?
    options:
      - B-trees cannot store decimal numbers
      - It can narrow by latitude, but within that latitude band the longitudes are not contiguous, so it scans a whole strip of the map
      - It sorts by longitude first
      - B-trees only support equality lookups
    correct: 1
    explanation: A composite B-tree is sorted by the first column, so only the first range condition uses the index efficiently.
  - prompt: What does a shared geohash prefix tell you?
    options:
      - The two points are within 1 metre
      - Both points lie inside the same cell, the one that prefix names
      - The two points are on different continents
      - Nothing; geohashes are random
    correct: 1
    explanation: Each extra character subdivides the cell, so a prefix names the enclosing cell.
  - prompt: Two cafés are 5 metres apart but their geohashes share no prefix at all. How is that possible?
    options:
      - The encoder has a bug
      - They sit either side of a major cell boundary, such as the equator or the prime meridian
      - Geohash only works on land
      - One of them uses precision 12
    correct: 1
    explanation: Prefix similarity implies closeness, but closeness does not imply a shared prefix. That is the edge problem, and why searches include neighbours.
  - prompt: In the worked example, the 2 km by 2 km box around the user is covered with precision-6 cells (about 1.22 km by 0.61 km). Why are up to 3 columns and 5 rows needed?
    options:
      - Because 2 / 1.22 is about 1.6 and 2 / 0.61 is about 3.3, and a box that does not line up with the grid can touch one extra cell in each direction
      - Because geohash always uses 15 cells
      - Because the user is at the equator
      - Because precision 6 has 15 bits
    correct: 0
    explanation: A span of 1.6 cells can touch 3 columns, and a span of 3.3 cells can touch 5 rows.
  - prompt: In the worked example, the 15 cells hold about 1,390 restaurants but only about 393 are within 1 km. What should the service do?
    options:
      - Return all 1,390; they are close enough
      - Compute the exact distance for each candidate and keep those within 1,000 m, then sort by distance
      - Switch to precision 12
      - Query only the user's own cell
    correct: 1
    explanation: The cells are a cheap coarse filter; a distance check on about 1,400 rows is the exact second step.
  - prompt: A driver-matching service needs every cell's neighbours to be the same distance away. Which cell system fits best?
    options:
      - Geohash
      - H3, whose hexagons have six neighbours all at the same centre-to-centre distance
      - A lat-only B-tree
      - A quadtree with a split threshold of 1
    correct: 1
    explanation: Squares have edge and corner neighbours at different distances; hexagons do not.
  - prompt: You store 50,000 restaurants with GEOADD. What Redis data structure holds them?
    options:
      - A hash
      - A sorted set whose score is a 52-bit geohash
      - A list
      - A stream
    correct: 1
    explanation: Redis GEO is a sorted set, so range scans over the geohash score find nearby members.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import GeohashFlow from '#lib/diagrams/GeohashFlow.svelte';
</script>

Geospatial indexing is how a database answers "what is near this point?" without reading every row. The trick in almost every design is to turn two dimensions into cells, and cells into something an ordinary index can range-scan.

## What it is

Here is the problem. You have 50,000 restaurants with `lat` and `lng` columns and a user asks for everything within 1 km. You add a <Term id="composite-index">composite index</Term> on `(lat, lng)`. A <Term id="b-tree">B-tree</Term> keeps rows sorted by `lat` first and by `lng` only among rows with exactly the same `lat`. So the condition `lat BETWEEN a AND b` uses the index, but `lng BETWEEN c AND d` cannot: the index hands back a thin horizontal strip running across the whole city, and the database checks the longitude of every row in it. Close in both dimensions is not close in one sorted order.

A **geospatial index** fixes this by grouping points that are close in *both* dimensions. There are two families. **Grid or cell systems** (<Term id="geohash">geohash</Term>, S2, H3) cut the Earth into cells with ids, so a point becomes a cell id you can store in a normal B-tree or key-value store. **Tree systems** (the <Term id="quadtree">quadtree</Term> and the <Term id="r-tree">R-tree</Term>) build a tree of nested regions and descend only into regions that overlap the query. Either way, the index gives a cheap set of *candidates*, and an exact distance calculation removes the false positives. If you have not met B-trees and range scans yet, read [indexes and SQL tuning](/modules/indexes-and-sql-tuning) first.

## How it works

### Geohash: bit interleaving and base32

A geohash encodes a point by repeatedly halving the world. Start with longitude in [−180, 180]: if the point is in the upper half write 1, otherwise 0, and keep the half it is in. Do the same with latitude in [−90, 90]. Alternate, longitude first, so the bits are *interleaved*: lng, lat, lng, lat. Then read the bit string five bits at a time as a character from the base32 alphabet `0123456789bcdefghjkmnpqrstuvwxyz` (no a, i, l or o). <Src id="wiki-geohash" />

Take a point in Singapore at 1.2834, 103.8607. Longitude 103.86 is above 0 (1), above 90 (1), below 135 (0), below 112.5 (0), above 101.25 (1). Latitude 1.28 is above 0 (1), below 45 (0), below 22.5 (0), below 11.25 (0), below 5.625 (0). Interleaved, the first ten bits are `11100 00010`, which is 28 and 2, the characters `w` and `2`. Carried on to 30 bits, the full six-character geohash is `w21z73`.

Interleaving is a <Term id="space-filling-curve">space-filling curve</Term> called the Z-order curve: it walks the grid in a zigzag of Z shapes, and the geohash is the position along it. That is what makes the trick work. Every extra character splits a cell into 32 smaller ones, so **a prefix is a cell**: every point whose geohash starts with `w21z7` is inside one rectangle. Store the geohash in a B-tree column and "all points in cell `w21z7`" is one range scan, `geohash >= 'w21z7' AND geohash < 'w21z8'`. <Src id="wiki-geohash" />

<GeohashFlow />

### The precision table

Each character adds 5 bits, split between longitude and latitude (longitude gets the extra bit when the count is odd). Cell sizes at the equator, where a degree is about 111 km: <Src id="wiki-geohash" />

| Length | Bits (lng + lat) | Cell size (approx.) |
| --- | --- | --- |
| 1 | 3 + 2 | 5,000 km × 5,000 km |
| 2 | 5 + 5 | 1,250 km × 625 km |
| 3 | 8 + 7 | 156 km × 156 km |
| 4 | 10 + 10 | 39 km × 19.5 km |
| 5 | 13 + 12 | 4.9 km × 4.9 km |
| 6 | 15 + 15 | 1.2 km × 0.61 km |
| 7 | 18 + 17 | 153 m × 153 m |
| 8 | 20 + 20 | 38 m × 19 m |
| 9 | 23 + 22 | 4.8 m × 4.8 m |

You can check row 6: 360° / 2^15 = 0.011° of longitude, times 111 km is 1.22 km; 180° / 2^15 = 0.0055° of latitude is 0.61 km. Away from the equator the cells get narrower, because a degree of longitude shrinks with the cosine of the latitude: at 60° north it is half as wide.

### The edge problem and neighbours

A shared prefix means two points are close, but two close points need not share a prefix. A café just north of the equator and one 5 metres south of it start with different first characters. More commonly, a user standing near the edge of their cell has their nearest restaurant in the next cell. <Src id="wiki-geohash" />

So a search never looks at one cell. It computes the cells that cover the search area, usually the user's cell and its 8 neighbours (or more, if the cells are small compared with the radius), runs one range scan per cell, and then filters the candidates by real distance. Neighbour geohashes are cheap to compute from the bits, and every geohash library has a `neighbours` function.

### Quadtrees: splitting where the data is dense

A fixed grid has a weakness: Manhattan cells hold thousands of restaurants and desert cells hold none. A **quadtree** adapts. Start with one square node covering the map. When a node holds more points than a **split threshold**, say 100, split it into four equal quadrants and push its points down. Dense downtowns end up as deep trees of tiny squares, and the ocean stays one big leaf. <Src id="wiki-quadtree" />

A radius search descends from the root into every quadrant that overlaps the circle, collects points from the leaves, and filters by distance. The threshold is the knob: a low one makes a deep tree with many small leaves to visit, a high one makes each leaf a long list to scan. Quadtrees usually live in application memory (a "nearby" service rebuilt from the database at startup), because they are awkward to store in a normal database.

### S2 and H3: better cells

Geohash rectangles distort badly near the poles and the Z-order curve has big jumps. Two cell systems fix this.

- **S2** (Google) projects the Earth onto the six faces of a cube and subdivides each face as a quadtree, 30 levels deep, numbering cells along a **Hilbert curve**, which has no big jumps, so nearby cells nearly always get nearby ids. Each cell id is a 64-bit integer; level-30 cells are about a centimetre across. A region such as a circle is covered by a handful of cells at mixed levels, each a contiguous id range. <Src id="s2" />
- **H3** (Uber) tiles the Earth with hexagons at 16 resolutions, 0 to 15. A hexagon's six neighbours all share an edge and are all the same distance from its centre, which squares cannot offer (a square's corner neighbours are about 1.4 times farther than its edge neighbours). That makes "expand the search by one ring" and smoothing demand over neighbours simple. At resolution 9 a cell averages about 0.1 km². A few pentagons (12 per resolution) are needed to close the sphere. <Src id="h3" />

### R-trees and PostGIS GiST

An **R-tree** is a balanced tree, like a B-tree, but each entry holds a **bounding box**: leaves hold the boxes of individual shapes, and each inner node holds the box enclosing its children. A query descends only into nodes whose box overlaps the search box. Unlike cells, R-trees index lines and polygons (roads, delivery zones) as naturally as points. <Src id="wiki-rtree" />

PostGIS, the spatial extension for PostgreSQL, builds R-tree-style indexes through PostgreSQL's **GiST** (generalised search tree) framework: `CREATE INDEX ON restaurants USING GIST (geom)`. Functions such as `ST_DWithin` use the index on bounding boxes first and then run the exact geometry test, the same two-step candidate-then-filter pattern. <Src id="postgis" />

## Worked example

A food app in Singapore, close to the equator so the precision table applies almost as written, has **50,000 restaurants** spread over a **20 km × 20 km** city area. That is 400 km², so **125 restaurants per km²**. A user asks for restaurants **within 1 km**.

**Step 1, the answer size.** A 1 km circle covers π × 1² = 3.14 km², so the answer is about 3.14 × 125 = **393 restaurants**.

**Step 2, the naive B-tree.** With an index on `(lat, lng)`, only the latitude range is used. The latitude band is 2 km tall and runs the full 20 km width of the city: 40 km² × 125 = **5,000 rows** read and checked, to return 393. That is 13 times the answer, and in a city twice as wide it doubles.

**Step 3, choose a precision.** The search box around the circle is 2 km × 2 km. Precision 5 cells are 4.9 km on a side, so even one cell is 24 km² (about 3,000 restaurants), too coarse. Precision 7 cells are 153 m, so covering the box would take about 14 × 14 = 196 range scans, too many. Precision 6 cells, 1.22 km × 0.61 km, fit best.

**Step 4, cover the box.** The box is 2 / 1.22 = 1.6 cells wide and 2 / 0.61 = 3.3 cells tall. A box that does not line up with the grid touches one extra cell each way, so at worst **3 columns × 5 rows = 15 cells**. Each cell is 1.22 × 0.61 = 0.74 km², so the 15 cells cover about 11.1 km² and hold about 11.1 × 125 = **1,390 candidates**, fetched with 15 index range scans.

**Step 5, filter exactly.** For each candidate compute the great-circle distance (the haversine formula, a few trigonometric operations) and keep those under 1,000 m. About **393 survive**, so the coarse step was 28% precise, and the work was 1,390 cheap distance checks instead of 5,000. Sort the survivors by distance and return the first page.

**Step 6, a dense block.** One food court has 2,000 restaurants in a single precision-6 cell. Fixed cells cannot adapt, so a user there reads that whole cell. A quadtree with a split threshold of 100 would split that area until no leaf held more than 100, which for 2,000 evenly spread points takes three more levels (4³ = 64 leaves of about 31 each, roughly 150 m × 75 m), and a quick "nearest 20" query would read only a few leaves.

## In the real world

- **Redis GEO.** `GEOADD key lng lat member` stores each member in a sorted set with a 52-bit geohash as its score, and `GEOSEARCH key FROMLONLAT lng lat BYRADIUS 1 km ASC COUNT 20` scans the covering cells and filters by distance. Note the argument order is longitude first, and latitudes are limited to about ±85.05° because of the Web Mercator projection it shares. Because it is just a sorted set, you can also use `ZREM` and the usual sorted-set commands. <Src id="redis-geo" /> See [where to cache](/modules/where-to-cache) for running it next to a primary database.
- **PostGIS.** A GiST index on a `geometry` or `geography` column, queried with `ST_DWithin(geom, point, 1000)` on a geography column (distance in metres), or ordered with the `<->` distance operator for "nearest N". <Src id="postgis" />
- **Uber H3 and Google S2.** Uber built H3 for pricing and dispatch on hexagon grids; S2 underlies Google Maps and is used by MongoDB's `2dsphere` index and by Foursquare and others for region covering. <Src id="s2" /> <Src id="h3" />
- **Elasticsearch and MongoDB.** Elasticsearch `geo_point` fields are indexed with BKD trees (a disk-friendly k-d tree) and offer `geo_distance` queries and geohash grid aggregations. MongoDB offers `2dsphere` indexes and the `$near` and `$geoWithin` operators.

## Trade-offs

- **Geohash is simple and portable.** It is a string in any B-tree or key-value store, so you can shard by prefix (see [sharding](/modules/federation-sharding-denormalization)). But cells are rectangles that distort with latitude, and you must handle neighbours yourself.
- **Fixed cells ignore density.** One precision can be too coarse downtown and too fine in the suburbs. Quadtrees and multi-level S2 coverings adapt, at the cost of more complex code.
- **Quadtrees are fast but live in memory.** They suit a read-heavy "nearby" service that rebuilds from the database; frequent moves (drivers updating every 4 seconds) mean constant tree updates and locking.
- **R-trees handle shapes, not just points,** and come built into PostGIS, but overlapping boxes can make a search descend several branches, and heavy update loads cost more than updating a cell id.
- **Moving objects favour cells.** A driver changing cell is one key update; for millions of moving points, a cell id in Redis or an in-memory map beats rebalancing a tree.

## Interview tips

- Start by saying why a plain `(lat, lng)` index fails, then propose turning location into a cell id.
- Show the two-step pattern: cells give candidates, an exact distance check gives the answer.
- Pick a precision from the radius with numbers, and mention neighbours before the interviewer asks about edges.
- For "nearby drivers" or other moving data, prefer cells (geohash, H3) in an in-memory store; for static places with polygons, PostGIS is the safe answer.

**Common mistakes:**

- Querying only the user's own geohash cell. Nearby points across the edge are missed; always include neighbours.
- Treating the cells as the answer. The covering cells include corners outside the circle, so filter by real distance.
- Swapping latitude and longitude. Redis, GeoJSON and PostGIS `ST_MakePoint` all take longitude first.
- Using Euclidean distance on degrees. A degree of longitude shrinks with latitude, so use haversine or a geography type.

## Common follow-up questions

### How do you find the nearest 10 restaurants when you do not know the radius?

Start with a small search (the user's cell and neighbours at a fine precision), and if it returns fewer than 10, widen by dropping a geohash character or adding another ring of H3 cells and repeat. Quadtrees and R-trees support this directly with a best-first search that visits nodes in order of distance; PostGIS exposes it as `ORDER BY geom <-> point LIMIT 10`.

### How would you track a million moving drivers?

Each driver reports a location every few seconds, so writes dominate. Keep each driver's current cell (an H3 cell or geohash) in memory, for example in Redis with `GEOADD`, sharded by region, and update only when the location changes. Matching queries the rider's cell and its neighbours. History goes to a separate append-only store, not the hot index.

### Why not shard purely by geohash prefix?

Load follows people, not area: a prefix covering central London gets vastly more traffic than one covering the North Sea. Sharding by prefix creates hot shards. Use a finer prefix with many cells per shard and map cells to shards with [consistent hashing](/modules/consistent-hashing), or split the busiest prefixes further.

### Geohash, S2 or H3: which would you pick?

Geohash when you want something simple that any store can index as a string. S2 when you need accurate coverings of arbitrary regions, cell ids as integers, and no polar distortion. H3 when the analysis is about neighbours and rings, such as surge pricing or demand heat maps, because hexagon neighbours are all equidistant.

## Go deeper

- [S2 Geometry, S2 Cells](http://s2geometry.io/devguide/s2cell_hierarchy): the cube projection, Hilbert curve and cell levels, with sizes per level.
- [H3: Uber's Hexagonal Hierarchical Spatial Index](https://www.uber.com/blog/h3/): why Uber chose hexagons and how it uses them for pricing and dispatch.
- [PostGIS manual, Spatial indexes](https://postgis.net/docs/using_postgis_dbmanagement.html#build-indexes): GiST, BRIN and SP-GiST indexes, and how the bounding-box-then-exact pattern works.
- [Redis docs, GEOSEARCH](https://redis.io/docs/latest/commands/geosearch/): radius and box searches, sorting and counts on a geo sorted set.
