---
slug: how-the-internet-works
title: How the internet works
section: networking
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
  - prompt: What does a router do?
    options:
      - Stores web pages
      - Forwards packets one hop closer to their destination address
      - Translates names to addresses
      - Encrypts traffic
    correct: 1
    explanation: Routers look at the destination IP address and forward each packet to the next network on the way.
  - prompt: Why does the speed of light matter for system design?
    options:
      - It does not
      - It sets a floor on latency between distant places, so round trips across oceans cost tens of milliseconds
      - It limits disk speed
      - It limits CPU speed
    correct: 1
    explanation: No amount of bandwidth removes distance. That is why CDNs and regional servers exist.
  - prompt: What is encapsulation?
    options:
      - Hiding class fields
      - Each layer wraps the data from the layer above in its own header
      - Compressing packets
      - Splitting a database
    correct: 1
    explanation: An HTTP message is wrapped in a TCP segment, then an IP packet, then a link-layer frame.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

The internet is a network of networks. Machines get addresses, data is cut into packets, and routers pass each packet along until it reaches the right address.

## What it is

The internet links millions of separate networks. Each network connects its own computers, and special computers called routers connect the networks to each other, so a message can hop from network to network until it arrives. <Src id="mdn" />

Every machine on it has an **<Term id="ip-address">IP address</Term>**. The Internet Protocol (IP) carries packets from a source address to a destination address. It is best effort: it does not promise that a packet arrives, arrives once, or arrives in order. <Src id="wiki-ip" />

## How it works

Networking is built in **layers**. Each layer does one job and relies on the one below it. The four-layer internet model is the one you meet in practice: <Src id="wiki-osi" />

| Layer | Job | Examples |
|---|---|---|
| Application | What the program means | <Term id="http">HTTP</Term>, <Term id="dns">DNS</Term>, SMTP |
| Transport | Process-to-process delivery, ports, reliability | <Term id="tcp">TCP</Term>, <Term id="udp">UDP</Term> |
| Internet | Addressing and routing between networks | IP |
| Link | Moving frames on one physical network | Ethernet, Wi-Fi |

The seven-layer OSI model splits the same work more finely. Interviewers mostly use its numbers as shorthand: "L4 <Term id="load-balancer">load balancer</Term>" means one that looks at TCP/UDP, "L7" means one that reads HTTP. <Src id="wiki-osi" />

When you send a request, each layer wraps the data from the layer above in its own header (encapsulation). The HTTP message goes inside a TCP segment, that goes inside an IP packet, and that goes inside an Ethernet or Wi-Fi frame. The receiver unwraps them in reverse.

A typical page load:

1. The browser asks DNS for the IP address of the name.
2. It opens a TCP connection to that address (and a <Term id="tls">TLS</Term> session for HTTPS).
3. It sends an HTTP request; routers forward the packets hop by hop.
4. The server replies, and the packets travel back the same way.

Distance matters. Light in fiber covers about 200 km per millisecond, so a round trip between continents costs tens of milliseconds no matter how much <Term id="bandwidth">bandwidth</Term> you buy.

## Trade-offs

- **Layers make the network flexible.** You can swap Wi-Fi for Ethernet without touching HTTP. The cost is header overhead and some lost information between layers.
- **Best-effort IP keeps the core simple.** Reliability is pushed to the edges (TCP), which is why the core scales, and why apps must handle loss.
- **<Term id="latency">Latency</Term> is bounded by physics.** Putting servers and <Term id="cache">caches</Term> near users is often the only way to cut it.

## Interview tips

- Know the four layers and where HTTP, TCP, UDP and IP sit; "L4 vs L7" comes up with load balancers.
- Walk through "what happens when you type a URL": DNS, TCP, TLS, HTTP, response, render.
- When latency matters, count round trips and mention distance. Each cross-ocean round trip is roughly 100 ms.
