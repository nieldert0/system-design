---
slug: dns
title: DNS
section: networking
upgraded: true
readFirst:
  - how-the-internet-works
sources:
  - id: primer
    title: The System Design Primer, Domain name system
    url: https://github.com/donnemartin/system-design-primer#domain-name-system
    license: CC BY 4.0
    use: reworded
  - id: wiki-dns
    title: Wikipedia, Domain Name System
    url: https://en.wikipedia.org/wiki/Domain_Name_System
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-anycast
    title: Wikipedia, Anycast
    url: https://en.wikipedia.org/wiki/Anycast
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does DNS do?
    options:
      - Encrypts traffic
      - Translates a domain name such as www.example.com to an IP address
      - Balances CPU load
      - Stores cookies
    correct: 1
    explanation: DNS maps names to IP addresses (and to other data, such as mail servers).
  - prompt: Which record points a name to an IPv4 address?
    options:
      - MX
      - NS
      - A
      - CNAME
    correct: 2
    explanation: An A record maps a name to an IPv4 address; AAAA does the same for IPv6.
  - prompt: Which record points one name to another name?
    options:
      - A
      - CNAME
      - MX
      - TXT
    correct: 1
    explanation: CNAME is the canonical-name record, an alias to another name.
  - prompt: You change a DNS record but some users still reach the old server for an hour. Why?
    options:
      - DNS is broken
      - Resolvers, the OS and browsers cached the old answer until its TTL expired
      - TCP is retransmitting
      - The CDN is down
    correct: 1
    explanation: Cached answers live until their time to live runs out. Lower the TTL before planned changes.
  - prompt: Which DNS routing helps send users to the nearest region?
    options:
      - Weighted round robin
      - Latency-based or geolocation-based routing
      - MX records
      - NS records
    correct: 1
    explanation: Managed DNS can answer with different IPs based on measured latency or the user's location.
  - prompt: In the worked example, the record's TTL is 86,400 seconds and you lower it to 60 seconds right before the migration. Why does that not help?
    options:
      - TTLs below 300 are ignored
      - Resolvers that cached the record in the last day still hold the old answer with the old 24-hour TTL; you must lower it at least one old TTL ahead
      - The new TTL applies only to IPv6
      - Lowering a TTL needs a registrar change
    correct: 1
    explanation: A TTL applies to the copy each resolver already holds. Lower it a day early, wait, then switch.
  - prompt: A site gets 50,000 visitors a minute through a few large ISP resolvers, and its A record has a 60-second TTL. Roughly how many queries reach its authoritative servers?
    options:
      - 50,000 a minute, one per visitor
      - About one per resolver per minute, because each resolver answers everyone from cache until the TTL runs out
      - None
      - 50,000 a second
    correct: 1
    explanation: Caching at recursive resolvers means authoritative load scales with the number of resolvers times 1/TTL, not with visitors.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import DnsLookupFlow from '#lib/diagrams/DnsLookupFlow.svelte';
</script>

DNS is the internet's phone book. It turns names people can remember into <Term id="ip-address">IP addresses</Term> machines can route to. It is also the first, cheapest and slowest-to-change layer of traffic routing in any system.

## What it is

Here is the problem. Routers move packets by IP address, as [How the internet works](/modules/how-the-internet-works) describes, but people type `shop.example.com`. And addresses change: you add servers, move to a new cloud region, or fail over after an outage. If every browser had the IP address baked in, every change would break every user.

The **<Term id="dns">Domain Name System (DNS)</Term>** is a worldwide, distributed database that maps names to addresses and other data. No single server holds it. Instead the namespace is split into a tree, and each part is run by whoever owns it: the root servers know who runs `.com`, the `.com` servers know who runs `example.com`, and the `example.com` servers know the address of `shop.example.com`. Because answers are cached everywhere for a set time, most lookups never travel far. <Src id="primer" /> <Src id="wiki-dns" />

That caching is both DNS's strength and its main constraint in design. It is why DNS can answer billions of queries a day, and why a DNS change can take hours to reach everyone.

## How it works

### The players

- **Stub resolver**: the small client in your operating system that apps call. It asks one configured server and caches answers.
- **<Term id="recursive-resolver">Recursive resolver</Term>**: the server that does the actual work of walking the tree, run by your ISP, your company, or a public service such as `8.8.8.8` (Google) or `1.1.1.1` (Cloudflare). It caches answers for everyone who uses it.
- **Authoritative name servers**: the servers that hold the real records for a domain, run by the domain owner or a DNS provider. Their answers are the source of truth.
- **Root and top-level domain (TLD) servers**: the top of the tree. There are 13 root server names, each served by many machines worldwide using <Term id="anycast">anycast</Term>.

### A lookup, step by step

When a resolver has nothing cached, it walks down the tree: it asks a root server, which points it to the servers for `.com`, which point it to the domain's authoritative servers, which return the record. Each answer includes a <Term id="ttl">time to live (TTL)</Term> in seconds, and the resolver caches it for that long, so the next lookup stops there. The OS and browser keep their own short caches on top. <Src id="wiki-dns" />

<DnsLookupFlow />

DNS queries normally travel over UDP port 53 because a query and its answer each fit in one small packet, so there is no handshake to pay for. Large answers and transfers between servers use TCP. Newer options encrypt queries: DNS over HTTPS (DoH) and DNS over TLS (DoT).

### Records you should know

<Src id="primer" />

- **A** points a name to an IPv4 address; **AAAA** to an IPv6 address.
- **CNAME** (canonical name) points one name at another name, for example `www.example.com` to `example-shop.cdnprovider.net`. The resolver then looks up that name. A CNAME cannot sit at the bare domain (`example.com`), which is why providers offer "alias" or "ALIAS/ANAME" records there.
- **NS** (name server) says which servers are authoritative for a domain or subdomain.
- **MX** (mail exchange) names the servers that accept email for the domain.
- **TXT** holds arbitrary text, commonly used to prove domain ownership and for email anti-spoofing rules.

### DNS as a routing layer

Because the authoritative server chooses what to answer, managed DNS can do coarse traffic steering: <Src id="primer" />

- **Weighted round robin**: return different IPs in set proportions, for example 90% to the old cluster and 10% to the new one, to drain servers for maintenance, balance clusters of different sizes, or A/B test.
- **Latency-based**: answer with the region that has the lowest measured latency from the resolver's location.
- **Geolocation-based**: answer based on the country or continent the query comes from, for legal or language reasons.
- **Failover**: health-check each endpoint and stop returning unhealthy ones.

All of these act on resolvers, not individual users, and only change what new lookups see. Clients that cached the old answer keep using it until the TTL runs out, and some ignore short TTLs. That is why DNS is a coarse first layer and a [load balancer](/modules/load-balancers) does the fine-grained, fast-reacting work behind it.

## Worked example

You are moving `api.example.com` from an old data centre (`198.51.100.10`) to a new cloud region (`203.0.113.20`). The A record's TTL is currently **86,400 seconds (24 hours)**. The API gets **50,000 requests a minute** from clients spread over many networks.

**Step 1, the naive switch.** You change the A record at 09:00. A resolver that cached the old answer at 08:59 will keep returning `198.51.100.10` until 08:59 the next day. Clients behind that resolver hit the old data centre for up to **24 hours**. If you shut it down at 09:05, they see errors for a day. This is the "DNS propagation delay" people talk about: nothing propagates, the old answer simply lives out its TTL.

**Step 2, the right order.** On Monday, lower the TTL from 86,400 to **60 seconds**. Wait at least one *old* TTL, 24 hours, so every cached copy with the long TTL has expired. On Tuesday, change the A record. Now the worst-case stale window is 60 seconds plus some stragglers that ignore TTLs, so keep the old data centre serving (or proxying to the new one) for a day or two more. After the move is stable, raise the TTL again.

**Step 3, what the short TTL costs.** Does a 60-second TTL flood your name servers? No, because resolvers cache on behalf of all their users. Suppose clients come through about **2,000 distinct resolvers**. Each refetches at most once per TTL, so authoritative load is about 2,000 ÷ 60 ≈ **33 queries a second**, independent of the 50,000 requests a minute. With the 24-hour TTL it was 2,000 ÷ 86,400, about one query every 43 seconds. Short TTLs cost a little more DNS traffic (managed DNS often charges per million queries) and a few milliseconds more for users whose resolver missed, not real load.

**Step 4, cold lookup cost.** A user whose resolver has nothing cached pays root, `.com` and authoritative round trips. Root and TLD answers are cached for days (their NS records have long TTLs), so in practice only the last hop is missed: about **20 to 50 ms** to a nearby anycast name server, or 150 ms or more to a distant single-location one. That is a reason to use a DNS provider with servers worldwide.

## In the real world

- **Amazon Route 53.** Offers simple, weighted, latency-based, geolocation, geoproximity, failover and multivalue routing policies, attached to health checks. Its "alias" records point the bare domain at AWS resources such as load balancers and do not count as billable queries. A common default TTL for regular records is 300 seconds; alias records use the target's TTL.
- **Cloudflare DNS and 1.1.1.1.** Cloudflare's authoritative DNS answers from hundreds of cities via anycast, and its "proxied" records return Cloudflare's own IPs so the traffic flows through its CDN; their TTL is fixed at 300 seconds ("Auto"). 1.1.1.1 is its public recursive resolver.
- **Kubernetes CoreDNS.** Inside a cluster, CoreDNS resolves service names such as `orders.default.svc.cluster.local` to service IPs, which is the basis of [service discovery](/modules/service-discovery) there. Its default `ndots:5` setting means short names are tried with several search suffixes first, a common source of extra lookups and latency.
- **The 2016 Dyn attack.** A large DDoS attack from the Mirai botnet against Dyn, a managed DNS provider, made sites including Twitter, GitHub and Netflix unreachable for many users in the US, though their servers were fine. Many companies now use two DNS providers.

## Trade-offs

- **Long TTL against fast change.** Long TTLs mean fewer lookups and resilience if your name servers briefly fail; short TTLs mean faster migrations and failover but more queries. 300 seconds is a common middle ground; drop to 60 only around planned changes or for failover records.
- **Coarse routing against precision.** DNS routing is free and global, but it sees the resolver's location rather than the user's, reacts only as fast as caches expire, and cannot see per-request load. Use it to choose a region, and a load balancer to choose a server.
- **Lookup latency.** Accessing a DNS server introduces a slight delay, mostly hidden by caching. <Src id="primer" />
- **A dependency outside your system.** A DNS outage or DDoS attack takes you offline as surely as a server outage, so DNS deserves redundancy too. <Src id="primer" />

## Interview tips

- DNS is the first hop in "what happens when you type a URL". Mention caching at every level: browser, OS, recursive resolver.
- DNS can do coarse load balancing and route users to the nearest region, but clients cache answers, so it is slow to react to failures. Put a <Term id="load-balancer">load balancer</Term> behind it.
- Before a migration, lower the TTL in advance, by at least one old TTL, so the switch takes effect quickly.

**Common mistakes:**

- Lowering the TTL at the same moment as changing the record. Caches still hold the old answer with the old, long TTL.
- Relying on DNS for instant failover. Some clients and resolvers ignore low TTLs, and a long-running app may cache the IP until it restarts (older Java versions cached forever by default).
- Treating DNS round robin as load balancing. It spreads users unevenly, because one big resolver's answer is shared by thousands of clients, and it never notices a dead server unless health checks remove it.

## Common follow-up questions

### How does DNS-based failover work, and how fast is it?

The DNS provider health-checks each endpoint every few seconds and stops returning an unhealthy one. Failover takes the health-check detection time plus the record's TTL, plus whatever extra caching clients do. With a 60-second TTL that is roughly one to two minutes for most users. For faster failover, use anycast or a global load balancer whose IP stays the same.

### What is the difference between a recursive resolver and an authoritative server?

An authoritative server holds the real records for a domain and only answers for that domain. A recursive resolver holds nothing of its own; it walks the tree on a client's behalf and caches what it finds. Your laptop talks to a recursive resolver, and only the resolver talks to authoritative servers.

### Why can a CDN return a different IP to users in different countries?

The CDN runs the authoritative servers for its hostnames and looks at where the query came from, usually the resolver's IP or a client subnet hint (EDNS Client Subnet), then answers with the nearest edge. Others use anycast and return the same IP everywhere, letting BGP routing deliver each user to the closest location.

### What happens if all of a domain's name servers go down?

New lookups fail once cached answers expire, so the site becomes unreachable even though servers are healthy. Use a provider with anycast and many locations, consider a second provider, and avoid very short TTLs on records that do not need them so caches ride out short outages.

## Go deeper

- [Amazon Route 53 routing policies](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html): each managed DNS routing policy, when to use it, and how it interacts with health checks.
- [RFC 1034, Domain names, concepts and facilities](https://www.rfc-editor.org/rfc/rfc1034): the original design of the namespace, resolvers and caching.
- [Mess with DNS](https://messwithdns.net/): Julia Evans's playground where you create real records and watch lookups and caching happen live.
- [Cloudflare, What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/): a clear walkthrough of resolvers, record types and the lookup path.
