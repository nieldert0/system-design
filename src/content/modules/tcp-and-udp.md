---
slug: tcp-and-udp
title: TCP and UDP
section: networking
readFirst:
  - how-the-internet-works
sources:
  - id: primer
    title: The System Design Primer, TCP and UDP
    url: https://github.com/donnemartin/system-design-primer#transmission-control-protocol-tcp
    license: CC BY 4.0
    use: reworded
  - id: wiki-tcp
    title: Wikipedia, Transmission Control Protocol
    url: https://en.wikipedia.org/wiki/Transmission_Control_Protocol
    license: CC BY-SA 4.0
    use: reworded
  - id: wiki-quic
    title: Wikipedia, QUIC
    url: https://en.wikipedia.org/wiki/QUIC
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: Which protocol guarantees that data arrives intact and in order?
    options:
      - UDP
      - TCP
      - IP
      - DNS
    correct: 1
    explanation: TCP uses sequence numbers, checksums, acknowledgements and retransmission.
  - prompt: How is a TCP connection established?
    options:
      - It is not; TCP is connectionless
      - With a three-way handshake (SYN, SYN-ACK, ACK)
      - With a DNS lookup
      - With a TLS certificate
    correct: 1
    explanation: TCP opens a connection with a handshake before sending data, which costs one round trip.
  - prompt: Which use case fits UDP best?
    options:
      - Transferring a bank statement
      - Real-time voice chat, where late data is worse than lost data
      - Sending email
      - SSH sessions
    correct: 1
    explanation: For voice or games, a late packet is useless, so UDP's lower latency wins.
  - prompt: Why can DHCP use UDP but not TCP?
    options:
      - DHCP needs encryption
      - The client has no IP address yet, and UDP can broadcast to the whole subnet
      - TCP is too fast
      - DHCP runs over HTTP
    correct: 1
    explanation: UDP can broadcast, which works before the client has an address. TCP needs a connection between two known addresses.
  - prompt: In the worked example, each request opens a new TCP connection to a database 2 ms away, at 5,000 requests a second. What does a connection pool save?
    options:
      - Nothing, connections are free
      - One handshake round trip (2 ms) per request and 5,000 connection setups a second on the database
      - Only bandwidth
      - The TLS certificate check only
    correct: 1
    explanation: A pooled connection is already open, so the request skips the SYN/SYN-ACK round trip and the server skips the setup and teardown work.
  - prompt: A link has 100 ms RTT and 1% packet loss, and the sender uses classic Reno-style congestion control. Why can a single TCP download be far slower than the link's bandwidth?
    options:
      - TCP compresses data
      - Every loss makes congestion control halve its sending window, and the window only grows back by about one packet per round trip
      - UDP traffic always takes priority
      - The checksum takes too long
    correct: 1
    explanation: Throughput is roughly window size divided by RTT, and loss keeps the window small. CUBIC and BBR react less sharply, but long, lossy paths still hurt loss-based TCP most.
  - prompt: HTTP/2 multiplexes 50 streams over one TCP connection and one packet is lost. What happens?
    options:
      - Only the stream that owned the packet waits
      - All 50 streams wait, because TCP delivers bytes strictly in order and holds everything after the gap
      - The connection closes
      - The packet is skipped
    correct: 1
    explanation: This is TCP head-of-line blocking. QUIC, used by HTTP/3, fixes it by ordering each stream separately over UDP.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TcpFlow from '#lib/diagrams/TcpFlow.svelte';
	import UdpFlow from '#lib/diagrams/UdpFlow.svelte';
</script>

TCP and UDP are the two main transport protocols. TCP is reliable and ordered, at some cost in speed. UDP is fast and simple, and leaves reliability to you. Most of the latency and connection-count problems you meet in design come from TCP's guarantees.

## What it is

The problem starts with IP. As [How the internet works](/modules/how-the-internet-works) explains, IP delivers packets on a best-effort basis: some get lost, some arrive twice, some overtake each other. Meanwhile a program wants to send a 2 MB file and have exactly those 2 MB come out the other side, in order. And on one machine, a hundred programs share the same IP address, so something has to say which program each packet is for.

The transport layer solves both. It adds **ports**, numbers that pick out a program on a machine, and then offers two very different deals.

**<Term id="tcp">TCP</Term>** (Transmission Control Protocol) gives you a reliable, ordered stream of bytes over a connection. Before any data moves, the two sides agree to talk with a handshake. After that, TCP numbers every byte, checks each packet for corruption, resends whatever goes missing, and hands bytes to the application only in order. It also slows down when the network is congested. <Src id="primer" />

**<Term id="udp">UDP</Term>** (User Datagram Protocol) gives you almost nothing on top of IP: ports and a checksum. Each message, called a **datagram**, is sent on its own with no connection, no retransmission, no ordering, and no congestion control. Datagrams may arrive out of order, twice, or never. Because it does so little, it adds no handshake delay and no waiting for lost data, which is exactly what real-time media wants. <Src id="primer" />

## How it works

### The TCP handshake and teardown

A connection opens with a three-way handshake. The client sends SYN ("synchronise", with its starting sequence number), the server answers SYN-ACK (its own sequence number, and an acknowledgement of the client's), and the client replies ACK. The client can send data with that final ACK, so the handshake costs **one round trip** before the first request byte. Closing uses FIN packets from each side, and the side that closes first keeps the connection in a TIME_WAIT state for a while (often 60 seconds on Linux) so late packets cannot be confused with a new connection. <Src id="wiki-tcp" />

<TcpFlow />

### Reliability: sequence numbers, ACKs and retransmission

Every byte has a sequence number. The receiver sends back acknowledgements saying "I have everything up to byte N". If the sender gets no acknowledgement within a timeout, or sees the same acknowledgement repeated three times (a sign a later packet arrived but one in between did not), it resends. After repeated timeouts it gives up and drops the connection. A checksum on each segment catches corruption. <Src id="primer" />

Because TCP hands bytes to the application strictly in order, one missing packet holds back everything behind it until the resend arrives. This is TCP <Term id="head-of-line-blocking">head-of-line blocking</Term>, and it matters once many independent streams share one connection.

### Flow control and congestion control

Two different brakes limit how much unacknowledged data the sender may have in flight.

- **Flow control** protects the receiver. The receiver advertises a window, how much buffer space it has left, and the sender never exceeds it.
- **<Term id="congestion-control">Congestion control</Term>** protects the network. The sender keeps a congestion window that starts small (Linux defaults to 10 packets, about 14 KB), roughly doubles every round trip during **slow start**, and cuts back sharply when it detects loss, since loss usually means a router queue overflowed.

The amount in flight is capped by the smaller of the two windows, so throughput is at most window ÷ RTT. A 64 KB window over a 100 ms path can never exceed 640 KB/s, however fat the link. <Src id="wiki-tcp" />

### UDP

UDP sends each datagram on its own. There is no setup, no state on the server per client, and no waiting. The application decides what to do about loss: a voice call just plays on, a game sends the latest position and ignores the old one, and a protocol like DNS simply asks again after a timeout. UDP can also broadcast to every machine on a local network, which DHCP relies on: a new laptop has no IP address yet, so it cannot open a TCP connection, but it can shout "is there a DHCP server?" to the whole subnet. <Src id="primer" />

<UdpFlow />

### QUIC: reliability rebuilt on UDP

<Term id="quic">QUIC</Term> is a transport built on top of UDP that offers what TCP offers (reliability, ordering, congestion control) plus built-in TLS 1.3 encryption, and orders each stream separately. A lost packet only stalls the stream it belonged to. It also combines the transport and TLS handshakes into one round trip, and lets a connection survive a change of IP address, such as a phone moving from Wi-Fi to mobile data. HTTP/3 runs on QUIC. It is built on UDP because middleboxes on the internet (firewalls, NAT routers) understand UDP and TCP but would block a brand-new transport protocol. <Src id="wiki-quic" />

### Connection cost on servers

Each open TCP connection costs the server kernel memory for buffers and a <Term id="file-descriptor">file descriptor</Term>, plus the handshake work to open it. A web server that keeps thousands of connections open to a cache such as memcached, one per thread, can use a lot of memory. <Term id="connection-pooling">Connection pooling</Term> helps, and for simple cache lookups some systems switch to UDP. <Src id="primer" />

## Worked example

An API service handles **5,000 requests a second**. Each request makes one query to a PostgreSQL database in the same data centre, **2 ms** round trip away. The query itself takes 3 ms.

**Step 1, a new connection per request.** Every request pays the TCP handshake (one RTT, 2 ms), then, because the database requires TLS, a TLS 1.3 handshake (another 2 ms plus some CPU for key exchange), then the PostgreSQL login exchange (roughly one more RTT, 2 ms). The query is 2 ms of RTT plus 3 ms of work. Total: about **11 ms**, of which only 5 is the query. The database sets up and tears down 5,000 connections a second; PostgreSQL starts a whole operating-system process per connection, so it spends a large share of its CPU on connection churn. And every closed connection sits in TIME_WAIT on the client for about 60 seconds. Spread over 20 app servers, each one opens 250 connections a second, so 250 × 60 = **15,000** of its sockets sit in TIME_WAIT. That is more than half of the roughly 28,000 local ports in Linux's default ephemeral range, and the limit applies per client IP talking to one database address and port. Uneven traffic, or a single busy host such as a batch worker doing 1,000 connections a second (60,000 in TIME_WAIT), runs out of ports.

**Step 2, add a connection pool.** Each of the 20 app servers keeps a pool of 10 open connections, 200 in total. A request borrows one, runs the query, and returns it. Latency drops to **5 ms**. The database holds 200 steady connections instead of creating 5,000 a second. Is 10 per server enough? By <Term id="littles-law">Little's law</Term>, connections in use = arrival rate × time held = 5,000/s × 0.005 s = **25** on average across the fleet, so 200 leaves plenty of headroom for bursts.

**Step 3, a lossy long-distance link.** Now a nightly job copies a 1 GB backup to another region, **100 ms** away, over a 1 Gbit/s link with **1% packet loss**. In theory 1 GB takes 8 seconds. Under classic Reno-style congestion control, each loss halves the congestion window, and the window regrows by about one packet per round trip. For that model, a rough rule (the Mathis formula) puts the ceiling at about 1,460 bytes ÷ (0.1 s × √0.01) ≈ **146 KB/s** for one connection, so the copy would take nearly two hours. Linux's default, CUBIC, backs off less (to about 70% of the window) and regrows faster on long paths, so it does better, but random loss on a long path still costs it a lot of throughput. Fixes: run many parallel connections, use a modern congestion control algorithm such as BBR that does not treat every loss as congestion, or fix the loss itself.

The lesson: on short paths, the cost of TCP is the handshakes, so reuse connections. On long, lossy paths, the cost is congestion control, so parallelise or tune.

## In the real world

- **Linux TCP defaults.** The initial congestion window is 10 packets, the default congestion control is CUBIC (`net.ipv4.tcp_congestion_control`), and BBR is available and used by Google and many CDNs. The ephemeral port range is set by `net.ipv4.ip_local_port_range` (default 32768 to 60999). `net.core.somaxconn` caps the queue of connections waiting to be accepted.
- **PgBouncer.** A connection pooler for PostgreSQL. In `pool_mode = transaction` it lends a server connection to a client only for the duration of a transaction, so thousands of app connections share a few dozen database ones. `default_pool_size` (default 20) sets connections per database and user.
- **HTTP/3 and QUIC at Google and Cloudflare.** Chrome, YouTube and Cloudflare serve a large share of traffic over QUIC on UDP port 443. Clients fall back to TCP when a network blocks UDP, so you always run both.
- **Memcached and Facebook.** Facebook's memcache paper describes using UDP for cache gets, to cut per-connection overhead across thousands of servers, while keeping TCP for sets and deletes where loss would matter.

## Trade-offs

| | TCP | UDP |
|---|---|---|
| Setup | One RTT handshake | None |
| Delivery | Every byte, in order | Maybe, any order |
| Congestion control | Built in | None; the application's job |
| Per-client server state | Buffers, a socket, a file descriptor | None required |
| Head-of-line blocking | Yes, a loss stalls later bytes | No |
| Typical uses | HTTP/1.1 and HTTP/2, databases, SSH, email | Voice, video, games, DNS, QUIC |

TCP suits work where every byte must arrive and a little delay is fine: web pages, APIs, database traffic, file transfer, SSH. UDP suits work where late data is worthless, such as voice and video calls, live streaming and multiplayer games, or where the application wants its own reliability scheme. <Src id="primer" />

## Interview tips

- Default to TCP (via <Term id="http">HTTP</Term> or gRPC). Reach for UDP only for real-time media or games, and say why: late data is worthless.
- A new TCP connection costs a round trip before any data; add <Term id="tls">TLS</Term> and it costs more. That is why keep-alive and connection pools matter.
- Mention that HTTP/3 runs over QUIC, which is built on UDP, to avoid TCP's head-of-line blocking.

**Common mistakes:**

- Saying UDP is "faster" without qualification. It skips the handshake and never waits for resends, but it does not make bits travel faster, and you inherit loss handling yourself.
- Opening a fresh connection per request to a database or downstream service. It multiplies latency and can exhaust ports and database processes.
- Assuming one TCP connection can fill any link. Over long, lossy paths, congestion control caps a single stream far below the link speed.

## Common follow-up questions

### Why does a game use UDP instead of TCP?

A game sends the player's position perhaps 30 times a second. If one update is lost, the next one, 33 ms later, replaces it anyway. TCP would hold every later update until the lost one was resent, adding a whole RTT of stutter for data nobody needs. Games send over UDP and add only the reliability they need, such as acknowledging important events like "player picked up item".

### What is head-of-line blocking, and how does HTTP/3 fix it?

TCP delivers bytes strictly in order, so a lost packet blocks everything behind it, even data from unrelated HTTP/2 streams on the same connection. QUIC keeps sequence numbers per stream, so a loss only stalls the stream it belongs to. HTTP/3 is HTTP over QUIC.

### How many TCP connections can one server hold?

The limit is memory and file descriptors, not ports: a connection is identified by four values, so one server port can accept connections from millions of client address and port pairs. Well-tuned servers hold hundreds of thousands to a few million idle connections. Raise the file-descriptor limit (`ulimit -n`) and keep per-connection buffers small.

### How do you make UDP reliable when you need it?

Add sequence numbers, acknowledgements and retransmission for the messages that matter, and a timeout per request. DNS just retries the query. QUIC is the fully general answer: it rebuilds TCP's guarantees on UDP.

## Go deeper

- [High Performance Browser Networking, Building blocks of TCP](https://hpbn.co/building-blocks-of-tcp/): slow start, congestion windows and head-of-line blocking with real numbers.
- [RFC 9293, Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293): the current consolidated TCP specification.
- [RFC 9000, QUIC](https://www.rfc-editor.org/rfc/rfc9000): the QUIC transport, including streams and connection migration.
- [PgBouncer configuration](https://www.pgbouncer.org/config.html): every pooling mode and size knob for a widely used connection pooler.
