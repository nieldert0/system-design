---
slug: how-the-internet-works
title: How the internet works
section: networking
upgraded: true
readFirst:
  - latency-vs-throughput
sources:
  - id: mdn
    title: MDN Web Docs, How does the Internet work?
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work
    license: CC BY-SA 2.5
    use: reworded
  - id: wiki-ip
    title: Wikipedia, Internet Protocol
    url: https://en.wikipedia.org/wiki/Internet_Protocol
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-osi
    title: Wikipedia, OSI model
    url: https://en.wikipedia.org/wiki/OSI_model
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-bgp
    title: Wikipedia, Border Gateway Protocol
    url: https://en.wikipedia.org/wiki/Border_Gateway_Protocol
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: What does an IP address identify?
    options:
      - A web page
      - A network interface on a machine, so packets can be routed to it
      - A user account
      - A DNS server only
    correct: 1
    explanation: IP addresses name machines (their network interfaces) so routers know where to send packets.
  - prompt: What does IP promise about delivery?
    options:
      - Every packet arrives, in order
      - Nothing; it is best effort, and packets can be lost, duplicated or reordered
      - Packets arrive within 100 ms
      - Packets are encrypted
    correct: 1
    explanation: IP is best effort. Reliability, if you need it, comes from a layer above, such as TCP.
  - prompt: In which layer does HTTP live?
    options:
      - Link
      - Internet (network)
      - Transport
      - Application
    correct: 3
    explanation: HTTP is an application-layer protocol that runs on top of a transport such as TCP.
  - prompt: What is encapsulation?
    options:
      - Hiding class fields
      - Each layer wraps the data from the layer above in its own header
      - Compressing packets
      - Splitting a database
    correct: 1
    explanation: An HTTP message is wrapped in a TCP segment, then an IP packet, then a link-layer frame.
  - prompt: In the worked example, a user in Singapore loads a page from a server in Virginia (about 230 ms round trip). The page needs DNS, TCP, TLS 1.3 and one HTTP request. Roughly how long before the first byte of HTML arrives, if DNS is already cached?
    options:
      - About 230 ms
      - About 690 ms (three round trips)
      - About 2 seconds
      - Under 50 ms, because bandwidth is high
    correct: 1
    explanation: TCP handshake, TLS 1.3 handshake and the HTTP request each cost one round trip, so about 3 × 230 ms. Bandwidth does not shorten a round trip.
  - prompt: The same page is served from a CDN edge in Singapore, 5 ms away. Why does that help more than upgrading the server's bandwidth?
    options:
      - CDNs compress pages better
      - Latency is set by distance and the number of round trips; moving the endpoint close shrinks every round trip from 230 ms to 5 ms
      - CDNs skip the TCP handshake
      - Bandwidth only affects uploads
    correct: 1
    explanation: A small page is latency-bound, not bandwidth-bound. Three round trips at 5 ms is 15 ms instead of about 690 ms.
  - prompt: Your laptop has the address 192.168.1.20, yet a website sees requests from 203.0.113.7. What explains this?
    options:
      - DNS rewrote the address
      - Your router does NAT, replacing the private source address with its one public address
      - TLS hides your address
      - The website is misconfigured
    correct: 1
    explanation: 192.168.x.x is a private range that is not routable on the internet, so the home router translates it to its public address.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import PageLoadFlow from '#lib/diagrams/PageLoadFlow.svelte';
</script>

The internet is a network of networks. Machines get addresses, data is cut into packets, and routers pass each packet along until it reaches the right address. Almost every latency number in a system design interview comes back to this module.

## What it is

Here is the problem the internet solves. A phone on Wi-Fi in Singapore wants a page from a server in a data centre in Virginia. The two machines share no cable, no owner and no common network. Between them sit a home router, an ISP, a few undersea cables and several companies' backbones, each run independently. Something has to let any machine reach any other without every network knowing about every machine.

The answer is a small set of agreements. Every machine gets an **<Term id="ip-address">IP address</Term>**. Data is cut into small pieces called **packets**, each labelled with a source and destination address. **Routers**, the computers that join networks together, read the destination on each packet and forward it one hop closer. No single router knows the whole path; each only knows which neighbour is a better next step. <Src id="mdn" />

The Internet Protocol (IP) that carries these packets is **best effort**: it does not promise that a packet arrives, arrives once, or arrives in order. That sounds like a flaw, but it is the reason the internet scales. Routers stay simple and stateless, and the hard job of reliability is pushed out to the two end machines, which is what [TCP](/modules/tcp-and-udp) does. <Src id="wiki-ip" />

## How it works

### Layers

Networking is built in **layers**. Each layer does one job and relies on the one below it. The four-layer internet model is the one you meet in practice: <Src id="wiki-osi" />

| Layer | Job | Examples |
|---|---|---|
| Application | What the program means | <Term id="http">HTTP</Term>, <Term id="dns">DNS</Term>, SMTP (email) |
| Transport | Process-to-process delivery, ports, reliability | <Term id="tcp">TCP</Term>, <Term id="udp">UDP</Term> |
| Internet | Addressing and routing between networks | IP |
| Link | Moving frames on one physical network | Ethernet, Wi-Fi |

The seven-layer OSI model splits the same work more finely, and interviewers mostly use its numbers as shorthand. "Layer 4" is transport and "Layer 7" is application, so an "L4 <Term id="load-balancer">load balancer</Term>" routes on IP addresses and ports without reading the request, while an "L7" one reads HTTP and can route by URL path or header. <Src id="wiki-osi" />

A **port** is a 16-bit number that picks out one program on a machine. The IP address gets the packet to the right machine; the port gets it to the right process, for example 443 for an HTTPS server or 5432 for PostgreSQL. A connection is identified by the four values source IP, source port, destination IP and destination port.

### Encapsulation

When you send a request, each layer wraps the data from the layer above in its own header. This is **encapsulation**. The HTTP message goes inside a TCP segment (adding ports and sequence numbers), that goes inside an IP packet (adding addresses), and that goes inside an Ethernet or Wi-Fi frame (adding the hardware address of the next device on the local network). Routers along the way only unwrap as far as the IP header, read the destination, and rewrap for the next link. The receiver unwraps all the way up.

A typical Ethernet link carries at most 1,500 bytes per packet, called the **MTU** (maximum transmission unit). After about 40 bytes of IP and TCP headers, that leaves roughly 1,460 bytes of your data per packet, so a 100 KB response is about 70 packets.

### Routing between networks

Inside one organisation, routers learn routes from each other automatically. Between organisations, the internet is split into **autonomous systems**, networks run by one operator such as an ISP, a cloud provider or a large company, each with a number. They announce which address ranges they can reach to their neighbours using <Term id="bgp">BGP</Term> (Border Gateway Protocol), and every router builds its forwarding table from those announcements. A packet's path is decided hop by hop and can change mid-conversation if a link fails. <Src id="wiki-bgp" />

### Addresses: IPv4, IPv6 and NAT

IPv4 addresses are 32 bits (written like `203.0.113.7`), which gives about 4.3 billion addresses, fewer than the devices that want them. Two fixes run side by side. IPv6 uses 128-bit addresses, enough for every device to have its own. Meanwhile most home and office networks use private ranges such as `10.0.0.0/8` and `192.168.0.0/16` internally and put a <Term id="nat">NAT</Term> (network address translation) router at the edge, which rewrites outgoing packets to use its single public address and remembers which internal machine each reply belongs to. The `/8` notation, called CIDR, says how many leading bits are the network part: `/8` fixes the first 8 bits and leaves 24 bits, about 16 million addresses, for hosts.

### A typical page load

1. The browser asks DNS for the IP address of the name. See [DNS](/modules/dns).
2. It opens a TCP connection to that address and, for HTTPS, a <Term id="tls">TLS</Term> session. See [HTTP, HTTPS and TLS](/modules/http-https-tls).
3. It sends an HTTP request; routers forward the packets hop by hop.
4. The server replies, and the packets travel back, not necessarily along the same path.

<PageLoadFlow />

### Distance is a hard floor

Light in fiber covers about 200 km per millisecond, two thirds of its speed in a vacuum. Singapore to Virginia is about 15,500 km in a straight line and more along real cables, so a single <Term id="rtt">round trip</Term> is at least 150 ms and in practice about 230 ms. No amount of <Term id="bandwidth">bandwidth</Term> changes that, because bandwidth is how much fits in the pipe, not how fast one bit gets through it. See [Latency vs throughput](/modules/latency-vs-throughput).

## Worked example

A user in **Singapore** opens `https://shop.example.com`, served from a single region in **Virginia**. The round trip time (RTT) between them is **230 ms**. The HTML is 30 KB.

**Step 1, DNS.** The phone's resolver has no cached answer, so it asks the root, then `.com`, then the domain's own name server. The resolver is the ISP's, in Singapore, and the name servers are spread worldwide, so this costs perhaps **40 ms**. On a repeat visit it is cached and costs nothing.

**Step 2, TCP handshake.** SYN goes to Virginia, SYN-ACK comes back: **230 ms**.

**Step 3, TLS 1.3 handshake.** One more round trip to agree keys and check the certificate: **230 ms**.

**Step 4, HTTP request.** The GET goes out and the first bytes of HTML come back: **230 ms**, plus say 20 ms of server time.

Time to first byte is about 40 + 230 + 230 + 250 = **750 ms**. The 30 KB itself is about 21 packets, and TCP starts by sending only about 10 packets before waiting for an acknowledgement, so the rest of the HTML needs another round trip: about **980 ms** before the browser has the whole document. Then it discovers CSS, JavaScript and images, and on a fresh connection to a new host, the whole sequence starts again.

Bandwidth barely appeared. A 100 Mbit/s link moves 30 KB in about 2.4 ms. This page load is **latency-bound**: the cost is the number of round trips multiplied by the RTT.

**Fix it two ways.**

- **Cut the RTT.** Put a <Term id="cdn">CDN</Term> edge in Singapore 5 ms away. The edge terminates TCP and TLS locally, so steps 2 to 4 cost about 3 × 5 = 15 ms, and the edge keeps a warm, already-open connection back to Virginia for anything it must fetch. First byte drops from 750 ms to well under 100 ms for cached content.
- **Cut the round trips.** Reuse connections (HTTP keep-alive), use TLS 1.3 rather than TLS 1.2 (one round trip instead of two), and HTTP/3, which merges the transport and TLS handshakes into one.

This is the mental model to bring to any interview latency question: count round trips, multiply by distance, and only then think about bandwidth.

## In the real world

- **Cloud regions and availability zones.** AWS, Google Cloud and Azure group data centres into regions (`us-east-1` in Virginia, `ap-southeast-1` in Singapore). Round trips inside a region, across its availability zones, are typically 1 to 2 ms; across an ocean they are 100 to 250 ms. That is why chatty services stay in one region and only replicated data crosses oceans.
- **Cloudflare and anycast.** Cloudflare announces the same IP addresses from hundreds of cities using BGP. Each user's packets go to whichever location is closest in routing terms, so one address serves the whole world. The knob a practitioner mentions is the number of points of presence and the resulting median RTT to users.
- **Home routers and carrier-grade NAT.** Nearly every home network runs NAT on private `192.168.x.x` addresses. Mobile carriers often add a second layer (carrier-grade NAT), so thousands of phones share one public IP. This is why servers cannot simply connect *to* a phone, and why real-time apps keep a connection open from the client side.
- **The 2021 Facebook outage.** A configuration change withdrew the BGP routes to Facebook's DNS servers, so the rest of the internet no longer knew how to reach them. The servers were running; nobody could find a path to them. It is the standard example of routing as a single point of failure.

## Trade-offs

- **Layers make the network flexible.** You can swap Wi-Fi for Ethernet without touching HTTP. The cost is header overhead (about 40 bytes per packet for IP and TCP) and some lost information between layers: an app cannot easily tell whether slowness is loss or congestion.
- **Best-effort IP keeps the core simple.** Reliability is pushed to the edges (TCP), which is why the core scales, and why apps must handle loss, retries and duplicates.
- **<Term id="latency">Latency</Term> is bounded by physics.** Putting servers and <Term id="cache">caches</Term> near users is often the only way to cut it, but every extra region adds data to replicate and keep consistent.
- **NAT saves addresses but breaks reachability.** Machines behind NAT can call out but cannot be called, which complicates peer-to-peer and push.

## Interview tips

- Know the four layers and where HTTP, TCP, UDP and IP sit; "L4 vs L7" comes up with load balancers.
- Walk through "what happens when you type a URL": DNS, TCP, TLS, HTTP, response, render, and name the round trip each one costs.
- When latency matters, count round trips and mention distance. Each cross-ocean round trip is roughly 100 to 250 ms; a round trip inside a data centre is under a millisecond.

**Common mistakes:**

- Treating bandwidth as the cure for slowness. A small request across an ocean is limited by RTT, and a faster link does nothing for it.
- Assuming packets arrive in order or at all because "the network is reliable". IP promises neither, so anything above it must cope with loss and duplicates.
- Forgetting the handshakes. Quoting "one round trip" for a fresh HTTPS request ignores the TCP and TLS round trips before it.

## Common follow-up questions

### What happens when you type a URL and press Enter?

The browser parses the URL, checks its caches, and resolves the hostname with DNS (browser cache, OS cache, then a recursive resolver walking root, top-level domain and authoritative servers). It opens a TCP connection to the IP on port 443, does a TLS handshake that checks the server's certificate, and sends an HTTP GET. Load balancers and servers produce a response, the browser parses the HTML, finds sub-resources and fetches them, reusing connections where it can, then renders. Name the round trip at each step to show you know where time goes.

### What is the difference between L4 and L7 load balancing?

An L4 balancer sees only IP addresses and ports, so it forwards whole TCP connections and is very fast but cannot route by URL. An L7 balancer terminates the connection, reads the HTTP request, and can route `/api` and `/images` to different pools, add headers or retry. L7 costs more CPU and must hold TLS certificates.

### How does a packet find its way across the internet?

Each router has a forwarding table that maps address ranges to a next hop, and it picks the most specific match for each packet's destination. Between networks, those tables come from BGP announcements, where each autonomous system tells its neighbours which ranges it can reach. No router knows the full path.

### Why do companies run multiple regions if one is enough for capacity?

Two reasons: latency for distant users, because the RTT to one region is fixed by distance, and availability, because a whole region can fail. The price is cross-region replication and harder consistency.

## Go deeper

- [High Performance Browser Networking](https://hpbn.co/): Ilya Grigorik's free book, the best single explanation of latency, TCP, TLS and HTTP performance with numbers.
- [What happens when...](https://github.com/alex/what-happens-when): a community-written, very detailed answer to "what happens when you type google.com and press Enter".
- [RFC 791, Internet Protocol](https://www.rfc-editor.org/rfc/rfc791): the original IPv4 specification, short and readable, including the header layout.
- [Understanding how Facebook disappeared from the Internet](https://blog.cloudflare.com/october-2021-facebook-outage/): Cloudflare's account of the 2021 BGP outage, a concrete look at routing failure.
