---
slug: cdn
title: Content delivery networks
section: edge
readFirst:
  - dns
  - reverse-proxies-api-gateways
sources:
  - id: primer
    title: The System Design Primer, Content delivery network
    url: https://github.com/donnemartin/system-design-primer#content-delivery-network
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What is a CDN?
    options:
      - A database
      - A globally distributed network of proxy servers, serving content from locations closer to the user
      - A message queue
      - A DNS record type
    correct: 1
    explanation: CDNs cache content near users.
  - prompt: How does a CDN improve performance?
    options:
      - It makes the database faster
      - Users get content from nearby data centers, and your servers skip requests the CDN fulfills
      - It compresses SQL queries
      - It adds more threads
    correct: 1
    explanation: Both lower latency and lower origin load.
  - prompt: In a pull CDN, when is content fetched from your server?
    options:
      - Whenever you upload it
      - When the first user requests it
      - Every second
      - Never
    correct: 1
    explanation: The first request is slower; later ones are served from the CDN cache until the TTL expires.
  - prompt: Which suits a push CDN best?
    options:
      - A site with heavy, constantly changing traffic
      - A small site whose content rarely changes
      - Real-time chat
      - Database writes
    correct: 1
    explanation: Push content once instead of having it re-pulled at intervals.
  - prompt: You update a file but users still see the old one. Why?
    options:
      - The CDN served a cached copy whose TTL had not expired
      - DNS is down
      - TCP lost packets
      - The file was too large
    correct: 0
    explanation: Content might be stale if it is updated before the TTL expires it. Use versioned file names or purge.
  - prompt: How do clients know which CDN server to contact?
    options:
      - They guess
      - The site's DNS resolution tells them
      - Through a WebSocket
      - Through a cookie
    correct: 1
    explanation: CDNs use DNS to direct users to a nearby edge server.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

A CDN keeps copies of your content in data centers all over the world, so users download from somewhere close instead of from your origin.

## What it is

A **<Term id="cdn">content delivery network (CDN)</Term>** is a globally distributed network of proxy servers, serving content from locations closer to the user. Generally, static files such as HTML/CSS/JS, photos, and videos are served from CDN, although some CDNs such as Amazon's CloudFront support dynamic content. The site's DNS resolution will tell clients which server to contact. <Src id="primer" />

Serving content from CDNs can significantly improve performance in two ways: <Src id="primer" />

- Users receive content from data centers close to them
- Your servers do not have to serve requests that the CDN fulfills

## How it works

**Push CDNs.** Push CDNs receive new content whenever changes occur on your server. You take full responsibility for providing content, uploading directly to the CDN and rewriting URLs to point to the CDN. You can configure when content expires and when it is updated. Content is uploaded only when it is new or changed, minimizing traffic, but maximizing storage. <Src id="primer" />

Sites with a small amount of traffic or sites with content that isn't often updated work well with push CDNs. Content is placed on the CDNs once, instead of being re-pulled at regular intervals. <Src id="primer" />

**Pull CDNs.** Pull CDNs grab new content from your server when the first user requests the content. You leave the content on your server and rewrite URLs to point to the CDN. This results in a slower request until the content is cached on the CDN. <Src id="primer" />

A time-to-live (TTL) determines how long content is cached. Pull CDNs minimize storage space on the CDN, but can create redundant traffic if files expire and are pulled before they have actually changed. <Src id="primer" />

Sites with heavy traffic work well with pull CDNs, as traffic is spread out more evenly with only recently-requested content remaining on the CDN. <Src id="primer" />

## Trade-offs

- CDN costs could be significant depending on traffic, although this should be weighed with additional costs you would incur not using a CDN. <Src id="primer" />
- Content might be stale if it is updated before the TTL expires it. <Src id="primer" />
- CDNs require changing URLs for static content to point to the CDN. <Src id="primer" />

## Interview tips

- Put images, video and static assets on a CDN early; it is the cheapest latency win.
- Use versioned file names (`app.3f9a.js`) so you can cache forever and still ship updates instantly.
- For global users, mention that CDNs also absorb traffic spikes and some DDoS.
