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
    use: reworded
  - id: wiki-cdn
    title: Wikipedia, Content delivery network
    url: https://en.wikipedia.org/wiki/Content_delivery_network
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: How does a CDN improve performance?
    options:
      - It makes the database faster
      - Users get content from nearby edge servers, and your origin skips the requests the CDN answers
      - It compresses SQL queries
      - It adds more threads
    correct: 1
    explanation: Both lower latency and lower origin load.
  - prompt: In a pull CDN, when is content fetched from your origin?
    options:
      - Whenever you upload it
      - When a user first requests it from an edge that does not have it, or after it expires
      - Every second
      - Never
    correct: 1
    explanation: The first request at each edge is slower; later ones are served from cache until the TTL expires.
  - prompt: How do clients usually reach a nearby CDN server?
    options:
      - They guess
      - Through DNS that answers with a nearby edge, or through an anycast IP that the network routes to the nearest site
      - Through a WebSocket
      - Through a cookie
    correct: 1
    explanation: CDNs steer users with geographic DNS answers, anycast, or both.
  - prompt: You ship a new app.js but users still get the old one for hours. What is the cleanest fix for future releases?
    options:
      - Set the TTL to zero
      - Put a content hash in the file name (app.3f9a.js) so each release is a new URL, and cache it for a year
      - Purge the whole CDN on every deploy
      - Turn the CDN off
    correct: 1
    explanation: A new URL is a new cache key, so it can never be stale. Only the small HTML that references it needs a short TTL.
  - prompt: In the worked example, the hit ratio rises from 90% to 98%. What happens to origin traffic?
    options:
      - It falls by about 8%
      - It falls by 5x, from 100 TB to 20 TB a month
      - It stays the same
      - It doubles
    correct: 1
    explanation: The origin sees the miss ratio, which goes from 10% to 2%. Small hit-ratio gains are large origin savings.
  - prompt: A popular video segment expires at 300 edges at once. Why does an origin shield help?
    options:
      - It encrypts the segment
      - Edges miss to one shield cache instead of the origin, so the origin sees about one request instead of 300
      - It makes the TTL longer
      - It blocks the requests
    correct: 1
    explanation: A shield is a middle cache tier that collapses misses from many edges into one origin fetch.
  - prompt: Why is putting Set-Cookie on a cacheable response dangerous?
    options:
      - Cookies are too large
      - A shared cache could store the response and hand one user's cookie or page to other users, so most CDNs refuse to cache it or must be told not to
      - It disables TLS
      - It breaks DNS
    correct: 1
    explanation: Responses that depend on the user must be marked private or bypass the CDN.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import CdnPullFlow from '#lib/diagrams/CdnPullFlow.svelte';
</script>

A CDN keeps copies of your content in data centers all over the world, so users download from somewhere close instead of from your own servers.

## What it is

Start with the failure. Your servers are in Virginia and a user in Singapore loads your home page. The round trip across the Pacific is about 230 ms, a new HTTPS connection needs two or three round trips before the first byte arrives, and the page pulls 60 images and scripts. Loading takes several seconds before your code does any work. Meanwhile, at peak, your servers spend most of their bandwidth sending the same logo and JavaScript bundle to millions of people.

A **<Term id="cdn">content delivery network (CDN)</Term>** solves both problems. It is a network of caching proxy servers, called *edge servers*, in hundreds of locations (*points of presence*, or PoPs) worldwide. Users connect to a nearby edge, a few milliseconds away. If the edge has a copy of the file, it answers directly; if not, it fetches it from your <Term id="origin-server">origin server</Term>, keeps a copy, and answers. Users get lower <Term id="latency">latency</Term>, and your origin stops serving requests the CDN can answer. <Src id="primer" /> <Src id="wiki-cdn" />

CDNs started with static files: images, video, CSS, JavaScript, downloads. Modern CDNs (CloudFront, Cloudflare, Fastly, Akamai) also accelerate dynamic content that cannot be cached, by terminating TLS close to the user and forwarding requests to the origin over warm, long-lived connections on a well-run backbone. Many also run code at the edge and absorb DDoS attacks. <Src id="primer" />

A CDN is one cache in the chain; [Where to cache](/modules/where-to-cache) compares it with browser, application, and database caching.

## How it works

### Getting users to a nearby edge

The CDN has to send each user to a nearby, healthy PoP. Two techniques, often combined: <Src id="wiki-cdn" />

- **DNS steering.** You point `static.example.com` at the CDN with a CNAME record. The CDN's [DNS](/modules/dns) servers look at where the query came from (the user's resolver, or the client subnet if the resolver passes it) and answer with the IP of a nearby, lightly loaded edge. Short <Term id="ttl">TTLs</Term> on these answers let the CDN move users when a PoP fails.
- **<Term id="anycast">Anycast</Term>.** Every PoP announces the *same* IP addresses, and internet routing delivers each user's packets to the nearest one in network terms. Failover is automatic: if a PoP withdraws its route, traffic flows to the next one. Cloudflare uses anycast for everything.

### Pull and push

**Pull CDNs** fetch content from your origin the first time a user asks an edge for it. You leave files on your origin and point URLs at the CDN. The first request at each edge pays the trip to the origin; later ones are served from cache until the entry expires. Storage is used only for content people actually request, but popular files that expire get pulled again even if they have not changed. Pull suits most sites, especially large or busy ones, because what stays cached tracks what is popular. <Src id="primer" />

<CdnPullFlow />

**Push CDNs** have you upload content to the CDN ahead of time, usually as part of a deploy, and you decide when it expires or is replaced. Nothing is fetched on demand, so there is no first-request penalty and no surprise load on the origin, but you pay to store everything and you must manage uploads yourself. Push suits content that changes rarely or must be ready before launch, such as a big game patch or a software release. <Src id="primer" />

### What gets cached, and for how long

The CDN looks up each request by its **cache key**, by default the host plus path plus query string. Two requests that map to the same key get the same stored response, which is why anything that varies the response (a language header, a device type) must either be in the key or excluded from caching.

How long a response stays fresh is set by HTTP headers from the origin. <Term id="cache-control">`Cache-Control`</Term> carries the rules: `max-age=86400` lets browsers and CDNs reuse it for a day, `s-maxage` overrides that for shared caches like the CDN only, `private` forbids shared caches from storing it, and `no-store` forbids caching entirely. When an entry expires, the edge can *revalidate*: it asks the origin "has this changed since this `ETag`?" and gets a tiny `304 Not Modified` if not. `stale-while-revalidate` lets the edge keep serving the old copy for a while as it refreshes in the background.

### Getting changes out

When content changes before its TTL runs out, users see the old copy. Two fixes: <Src id="primer" />

- **Versioned URLs.** Put a content hash in the file name (`app.3f9a.js`) and cache it with `max-age=31536000, immutable`, a year. A new release has a new name, so it can never be stale. Only the small HTML page that references it gets a short TTL.
- **Purge (invalidation).** Tell the CDN to drop a path or a tag now. Fast CDNs purge globally in well under a second; others take minutes and may charge per path. Purge is the tool for content whose URL cannot change, such as a news article or a product image.

### Tiers and shields

With hundreds of edges, a single expired file can trigger hundreds of simultaneous origin fetches, a CDN-scale <Term id="thundering-herd">thundering herd</Term>. CDNs add a middle tier: an *origin shield* (or regional cache) that edges ask before the origin. The shield also applies <Term id="request-coalescing">request coalescing</Term>, so many concurrent misses for one object become one origin request.

## Worked example

A video-heavy site serves **1 PB a month** (1,000 TB) of images and video segments to users worldwide from an origin in one region. Monthly requests are about **10 billion**, roughly 3,800/s on average and 4× that at peak.

**Step 1, no CDN.** The origin sends all 1,000 TB. Spread evenly over a month, that is about 3 Gbit/s on average and 12 Gbit/s at peak, and cloud bandwidth out of a region costs in the range of $0.05 to $0.09 per GB, so roughly **$50,000-$90,000 a month** just for egress. Users in Asia and Europe see 150-250 ms round trips on every connection.

**Step 2, a CDN at a 90% byte hit ratio.** 900 TB is served from edges and **100 TB** comes from the origin. Origin egress drops 10x. CDN delivery is priced per GB too, often lower at volume, so the bill shifts rather than vanishes, but origin servers and bandwidth now only need to handle a tenth of the load. Users fetch from a PoP 10-30 ms away.

**Step 3, raising the hit ratio to 98%.** You find that the player adds a random `?session=` parameter to every segment URL, so the CDN treats each user's request as a different cache key. Dropping that parameter from the key, and adding an origin shield, raises the byte hit ratio to 98%. Origin traffic falls from 100 TB to **20 TB**, another 5x. As with any cache, the origin sees the *miss* ratio, so going from 10% to 2% misses is a 5x cut, even though the hit ratio only moved 8 points. See the same arithmetic in [Cache strategies and eviction](/modules/cache-strategies-and-eviction).

**Step 4, a popular segment expires.** A trending video's first segment is cached at 300 edges with a 60 s TTL and gets 50,000 requests/s globally. Without a shield, every edge misses at the same moment, and the origin sees up to **300 requests** for one file, plus more while each fetch is in flight. With a shield that coalesces misses, the origin sees **one**. With `stale-while-revalidate=30`, users do not even wait for that one; they get the old copy while it refreshes.

**Step 5, a bad release.** You deploy `player.js` with a bug under the same URL with `max-age=86400`. Edges and browsers keep the broken file for up to a day. A CDN purge clears edges in seconds, but browsers that already cached it keep it until it expires, and you cannot purge a browser. With versioned names, you just point the HTML at `player.7c21.js` and the HTML's 60 s TTL gets the fix out within a minute.

## In the real world

- **Amazon CloudFront.** A pull CDN with more than 600 PoPs plus regional edge caches as a middle tier, and Origin Shield as an optional extra layer. Cache behaviour is set per path with cache policies; the default TTL is 24 hours when the origin sends no `Cache-Control`. Invalidations are charged per path after the first 1,000 a month, which is one more reason to version file names.
- **Cloudflare.** Every PoP announces the same anycast IPs. By default it caches only by file extension (images, CSS, JS, and so on), not HTML, unless a cache rule says otherwise. Tiered Cache adds upper-tier PoPs, and Workers run JavaScript at the edge.
- **Fastly.** Built on Varnish, configured in VCL or through its API. Purges propagate globally in about 150 ms, and *surrogate keys* let you tag responses (for example `product-42`) and purge every URL with that tag at once, which suits news and e-commerce sites with content that changes.
- **Netflix Open Connect.** Netflix's own CDN: storage appliances installed inside internet providers' networks and filled overnight with the titles predicted to be popular in that region, a push model. It serves almost all Netflix video without crossing the wider internet.

## Trade-offs

| | Pull CDN | Push CDN |
| --- | --- | --- |
| Content arrives | On first request per edge | Uploaded ahead of time |
| First request | Slow (goes to origin) | Fast |
| Storage | Only what is requested | Everything you upload |
| Best for | Large, busy, changing sites | Rarely changing or launch-critical content |

- **Cost.** CDNs charge per GB and per request, which can be significant, but must be weighed against origin bandwidth and servers you no longer need. <Src id="primer" />
- **Staleness.** Content updated before its TTL runs out stays stale until it expires or is purged. Long TTLs mean a better hit ratio and slower updates. <Src id="primer" />
- **URL and config changes.** Static content has to be served from CDN URLs, and cache keys and headers need care, or the CDN either caches nothing useful or caches something private. <Src id="primer" />
- **Another dependency.** A CDN outage or misconfiguration can take down every site using it; large sites sometimes run two CDNs behind DNS.

## Interview tips

- Put images, video, and static assets on a CDN early; it is the cheapest latency and bandwidth win.
- Use versioned file names so you can cache for a year and still ship updates instantly, and give HTML a short TTL.
- Quote a hit ratio and translate it into origin traffic, as in the worked example.
- For global users, mention that CDNs also terminate TLS near users, absorb traffic spikes, and soak up many DDoS attacks.

**Common mistakes:**

- Leaving unique query parameters or cookies in the cache key, so the hit ratio collapses and the origin takes every request.
- Caching personalised responses (anything with `Set-Cookie` or depending on the logged-in user) in the CDN, so one user's page is served to others.
- Relying on purge to ship fixes for files under a fixed URL; browsers keep their copy until it expires.
- Forgetting an origin shield, so a popular object's expiry sends hundreds of edge misses to the origin at once.

## Common follow-up questions

### Can a CDN help with dynamic, uncacheable APIs?

Yes, but not by caching. The edge terminates TCP and TLS close to the user, which cuts the two or three long round trips of a new connection to short ones, then forwards the request to the origin over a connection that is already open and on a well-run path. That often saves 100 ms or more for distant users. Some responses can also be cached for a second or two ("microcaching"), which flattens spikes on popular endpoints.

### How do you serve private content, such as paid videos, through a CDN?

Use signed URLs or signed cookies. Your application issues a URL with an expiry time and a signature made with a key the CDN knows. The edge checks the signature and expiry before serving, so the file can still be cached and shared across users at the edge while only people with a valid link can fetch it.

### How do you invalidate content when the URL cannot change?

Purge it by path, or tag responses with a key (Fastly surrogate keys, Cloudflare cache tags) and purge the tag when the underlying data changes. Pair this with a modest TTL as a safety net in case a purge is missed, and `stale-while-revalidate` so users never wait on the refresh.

### What happens if the CDN goes down?

If DNS points straight at the CDN, users cannot reach the site. Large sites keep DNS records with short TTLs so they can switch to a second CDN or to the origin, and make sure the origin could survive at least part of the traffic. A CDN can also be told to serve stale content when the origin is down (`stale-if-error`), which protects you from the opposite failure.

## Go deeper

- [MDN, HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching): what every `Cache-Control` directive does in browsers and shared caches.
- [Cloudflare, What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/): a plain introduction to PoPs, anycast, and edge caching from a CDN operator.
- [Amazon CloudFront, Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html): how a shield tier cuts origin load and when to enable it.
- [Netflix Open Connect](https://openconnect.netflix.com/en/): how Netflix runs its own CDN inside internet providers' networks.
