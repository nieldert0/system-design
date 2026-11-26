---
slug: dns
title: DNS
section: networking
readFirst:
  - how-the-internet-works
sources:
  - id: primer
    title: The System Design Primer, Domain name system
    url: https://github.com/donnemartin/system-design-primer#domain-name-system
    license: CC BY 4.0
    use: copied
quiz:
  - prompt: What does DNS do?
    options:
      - Encrypts traffic
      - Translates a domain name such as www.example.com to an IP address
      - Balances CPU load
      - Stores cookies
    correct: 1
    explanation: DNS maps names to IP addresses.
  - prompt: Which record points a name to an IP address?
    options:
      - MX
      - NS
      - A
      - CNAME
    correct: 2
    explanation: An A record maps a name to an IP address.
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
    explanation: Managed DNS can answer with different IPs based on latency or the user's location.
  - prompt: What is a downside of DNS?
    options:
      - It cannot be cached
      - Lookups add a slight delay, and DNS providers can be targets of DDoS attacks
      - It only supports IPv6
      - It requires UDP broadcast
    correct: 1
    explanation: Lookups add delay (cut by caching), and a DNS outage can take sites offline.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

DNS is the internet's phone book. It turns names people can remember into <Term id="ip-address">IP addresses</Term> machines can route to.

## What it is

A **<Term id="dns">Domain Name System (DNS)</Term>** translates a domain name such as www.example.com to an IP address. <Src id="primer" />

## How it works

DNS is hierarchical, with a few authoritative servers at the top level. Your router or ISP provides information about which DNS server(s) to contact when doing a lookup. Lower level DNS servers <Term id="cache">cache</Term> mappings, which could become stale due to DNS propagation delays. DNS results can also be cached by your browser or OS for a certain period of time, determined by the <Term id="ttl">time to live (TTL)</Term>. <Src id="primer" />

Common records: <Src id="primer" />

- **NS record (name server)** - Specifies the DNS servers for your domain/subdomain.
- **MX record (mail exchange)** - Specifies the mail servers for accepting messages.
- **A record (address)** - Points a name to an IP address.
- **CNAME (canonical)** - Points a name to another name or `CNAME` (example.com to www.example.com) or to an `A` record.

Services such as CloudFlare and Route 53 provide managed DNS services. Some DNS services can route traffic through various methods: <Src id="primer" />

- Weighted round robin
  - Prevent traffic from going to servers under maintenance
  - Balance between varying cluster sizes
  - A/B testing
- Latency-based
- Geolocation-based

## Trade-offs

- Accessing a DNS server introduces a slight delay, although mitigated by caching described above. <Src id="primer" />
- DNS server management could be complex and is generally managed by governments, ISPs, and large companies. <Src id="primer" />
- DNS services have recently come under DDoS attack, preventing users from accessing websites such as Twitter without knowing Twitter's IP address(es). <Src id="primer" />
- Long TTLs mean fewer lookups but slow failover; short TTLs mean faster changes but more queries.

## Interview tips

- DNS is the first hop in "what happens when you type a URL". Mention caching at every level.
- DNS can do coarse load balancing and route users to the nearest region, but clients cache answers, so it is slow to react to failures. Put a <Term id="load-balancer">load balancer</Term> behind it.
- Before a migration, lower the TTL in advance so the switch takes effect quickly.
