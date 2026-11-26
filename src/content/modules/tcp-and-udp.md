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
    use: copied
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
      - With a handshake
      - With a DNS lookup
      - With a TLS certificate
    correct: 1
    explanation: TCP opens a connection with a handshake (SYN, SYN-ACK, ACK) before sending data.
  - prompt: Which use case fits UDP best?
    options:
      - Transferring a bank statement
      - Real-time voice chat, where late data is worse than lost data
      - Sending email
      - SSH sessions
    correct: 1
    explanation: For voice or games, a late packet is useless, so UDP's lower latency wins.
  - prompt: A web server keeps many TCP connections open to memcached and uses lots of memory. What helps?
    options:
      - Opening a new connection per request
      - Connection pooling
      - Disabling checksums
      - Using DNS round robin
    correct: 1
    explanation: The primer suggests connection pooling, and switching to UDP where applicable.
  - prompt: Why can DHCP use UDP but not TCP?
    options:
      - DHCP needs encryption
      - The client has no IP address yet, and UDP can broadcast to the whole subnet
      - TCP is too fast
      - DHCP runs over HTTP
    correct: 1
    explanation: UDP can broadcast, which works before the client has an address.
  - prompt: What does TCP do when the sender gets no acknowledgement?
    options:
      - Ignores it
      - Resends the packets, and drops the connection after repeated timeouts
      - Switches to UDP
      - Sends an email
    correct: 1
    explanation: TCP retransmits; after multiple timeouts, the connection is dropped.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
</script>

TCP and UDP are the two main transport protocols. TCP is reliable and ordered, at some cost in speed. UDP is fast and simple, and leaves reliability to you.

## What it is

**<Term id="tcp">TCP</Term>** is a connection-oriented protocol over an IP network. Connection is established and terminated using a handshake. All packets sent are guaranteed to reach the destination in the original order and without corruption. <Src id="primer" />

**<Term id="udp">UDP</Term>** is connectionless. Datagrams (analogous to packets) are guaranteed only at the datagram level. Datagrams might reach their destination out of order or not at all. UDP does not support congestion control. Without the guarantees that TCP support, UDP is generally more efficient. <Src id="primer" />

## How it works

TCP gets its guarantees through: <Src id="primer" />

- Sequence numbers and checksum fields for each packet
- Acknowledgement packets and automatic retransmission

If the sender does not receive a correct response, it will resend the packets. If there are multiple timeouts, the connection is dropped. TCP also implements flow control and congestion control. These guarantees cause delays and generally result in less efficient transmission than UDP. <Src id="primer" />

To ensure high throughput, web servers can keep a large number of TCP connections open, resulting in high memory usage. It can be expensive to have a large number of open connections between web server threads and say, a memcached server. Connection pooling can help in addition to switching to UDP where applicable. <Src id="primer" />

UDP can broadcast, sending datagrams to all devices on the subnet. This is useful with DHCP because the client has not yet received an IP address, thus preventing a way for TCP to stream without the IP address. <Src id="primer" />

## Trade-offs

TCP is useful for applications that require high reliability but are less time critical. Some examples include web servers, database info, SMTP, FTP, and SSH. Use TCP over UDP when: <Src id="primer" />

- You need all of the data to arrive intact
- You want to automatically make a best estimate use of the network throughput

UDP is less reliable but works well in real time use cases such as VoIP, video chat, streaming, and realtime multiplayer games. Use UDP over TCP when: <Src id="primer" />

- You need the lowest latency
- Late data is worse than loss of data
- You want to implement your own error correction

## Interview tips

- Default to TCP (via HTTP or gRPC). Reach for UDP only for real-time media or games, and say why: late data is worthless.
- A new TCP connection costs a round trip before any data; add TLS and it costs more. That is why keep-alive and connection pools matter.
- Mention that HTTP/3 runs over QUIC, which is built on UDP, to avoid TCP's head-of-line blocking.
