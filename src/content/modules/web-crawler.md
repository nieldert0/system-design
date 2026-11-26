---
slug: web-crawler
title: Design a web crawler
section: case-studies
readFirst:
  - approach-a-design-interview
  - queues-and-back-pressure
  - dns
sources:
  - id: primer-crawler
    title: System Design Primer, Design a web crawler
    url: https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/web_crawler/README.md
    license: CC BY 4.0
    use: reworded
  - id: wiki-crawler
    title: Wikipedia, Web crawler
    url: https://en.wikipedia.org/wiki/Web_crawler
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-robots
    title: Wikipedia, robots.txt
    url: https://en.wikipedia.org/wiki/Robots.txt
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What is the URL frontier?
    options:
      - The list of URLs still to be crawled
      - The fastest server in the crawler
      - The search results page
      - The robots.txt file
    correct: 0
    explanation: Workers take URLs from the frontier and add newly found links back to it.
  - prompt: Why does a crawler keep a set of URLs it has already seen?
    options:
      - To rank pages
      - To avoid fetching the same page again and looping forever
      - To store page text
      - To resolve DNS
    correct: 1
    explanation: The web is full of cycles; without dedupe the crawl never ends.
  - prompt: What is robots.txt for?
    options:
      - Encrypting pages
      - Listing every page on a site
      - Telling crawlers which parts of a site they should not fetch
      - Storing cookies
    correct: 2
    explanation: Polite crawlers fetch and follow it before crawling a site.
  - prompt: Why limit requests per site?
    options:
      - To save disk space
      - It makes parsing faster
      - DNS requires it
      - Hammering one server can overload it, and sites will block the crawler
    correct: 3
    explanation: The frontier is usually split per host so each site is crawled at a polite rate.
  - prompt: How can a crawler spot the same page under different URLs?
    options:
      - It cannot
      - By checking the page title only
      - By hashing the content and comparing signatures
      - By comparing HTTP status codes
    correct: 2
    explanation: Exact or near-duplicate signatures catch mirrors and URL variants.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CrawlerFlow from '#lib/diagrams/CrawlerFlow.svelte';
</script>

A web crawler downloads pages, finds their links, and follows them, building the copy of the web that a search engine indexes. This walk-through follows the steps from [How to approach a design interview](/modules/approach-a-design-interview).

## What it is

A crawler starts from a list of seed URLs and repeatedly fetches pages and adds the links it finds to its to-do list. <Src id="wiki-crawler" />

**Step 1, requirements.** Crawl about a billion pages, refresh them regularly (more often for pages that change), skip duplicates, and hand page text to the indexer. Assume the crawl must finish about once a month: that is roughly 400 pages a second, with every page averaging around 500 KB. <Src id="primer-crawler" />

## How it works

**Step 2, high-level design.** A **<Term id="url-frontier">URL frontier</Term>** (a queue of URLs to crawl), a pool of crawler workers, a store of seen URLs, and a page store the indexer reads from. <Src id="primer-crawler" />

**Step 3, the crawl loop.** A worker takes the next URL from the frontier, fetches the page, and saves its contents. A parser extracts the links. Each link is checked against the set of URLs already seen; new ones go back into the frontier, ones already seen are dropped. <Src id="primer-crawler" />

<CrawlerFlow />

Two pages can be the same under different URLs, so the crawler also hashes page content and skips exact or near-duplicate signatures. <Src id="primer-crawler" />

**Politeness.** Before crawling a site, the crawler reads its **robots.txt**, which lists the paths crawlers should stay out of. <Src id="wiki-robots" /> It also limits how often it hits each host, typically by giving each host its own queue in the frontier. <Src id="wiki-crawler" />

**Step 4, scale.** Run many workers, and split the frontier by host so one site's queue stays on one worker. Cache [DNS](/modules/dns) lookups, since every fetch needs one. Use a [queue](/modules/queues-and-back-pressure) between fetching and parsing, and store pages in [object storage](/modules/object-storage). <Src id="primer-crawler" />

## Trade-offs

- **Freshness vs coverage**: recrawling popular pages often uses capacity that could fetch new ones; crawlers prioritise by how often a page changes and how important it is. <Src id="wiki-crawler" />
- **Politeness vs speed**: per-host limits slow the crawl but keep sites from blocking it. <Src id="wiki-crawler" />
- **Exact vs near-duplicate detection**: exact hashes are cheap; near-duplicate signatures catch more but cost more. <Src id="primer-crawler" />
- **Crawler traps** (infinite calendars, session IDs in URLs) can generate endless URLs; cap depth and URLs per site. <Src id="wiki-crawler" />

## Interview tips

- Draw the loop first: frontier → fetch → parse → dedupe → frontier.
- Say "robots.txt and per-host rate limits" before the interviewer asks.
- Explain how you partition the frontier and the seen-set across machines.
