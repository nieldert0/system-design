---
slug: http-https-tls
title: HTTP, HTTPS and TLS
section: networking
readFirst:
  - tcp-and-udp
  - dns
sources:
  - id: primer
    title: The System Design Primer, Hypertext transfer protocol (HTTP)
    url: https://github.com/donnemartin/system-design-primer#hypertext-transfer-protocol-http
    license: CC BY 4.0
    use: copied
  - id: mdn-tls
    title: MDN Web Docs, Transport Layer Security (TLS)
    url: https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security
    license: CC BY-SA 2.5
    use: reworded
  - id: mdn-http
    title: MDN Web Docs, Evolution of HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP
    license: CC BY-SA 2.5
    use: reworded
quiz:
  - prompt: What kind of protocol is HTTP?
    options:
      - A broadcast protocol
      - A request/response protocol between client and server
      - A routing protocol
      - A peer-to-peer file protocol
    correct: 1
    explanation: Clients send requests; servers send responses with content and status.
  - prompt: Which verb is idempotent but not safe?
    options:
      - GET
      - POST
      - PUT
      - PATCH
    correct: 2
    explanation: PUT replaces a resource, so repeating it gives the same result, but it changes state.
  - prompt: Why does idempotency matter for retries?
    options:
      - It does not
      - An idempotent request can be safely retried after a timeout without doing the work twice
      - It makes requests faster
      - It encrypts the request
    correct: 1
    explanation: If you don't know whether a request landed, you can retry only when repeating it is harmless.
  - prompt: What does TLS add to HTTP?
    options:
      - Compression only
      - Encryption, integrity and server authentication
      - Load balancing
      - Caching
    correct: 1
    explanation: HTTPS is HTTP over TLS, which encrypts traffic and proves the server's identity with a certificate.
  - prompt: What does TLS termination at a load balancer mean?
    options:
      - The load balancer drops TLS traffic
      - The load balancer decrypts TLS, so backends receive plain HTTP and are spared the crypto work
      - Certificates expire
      - The server closes the connection
    correct: 1
    explanation: Terminating TLS at the edge centralises certificates and offloads crypto from app servers.
  - prompt: What is a key improvement of HTTP/2 over HTTP/1.1?
    options:
      - It uses UDP
      - It multiplexes many requests over one connection
      - It removes headers
      - It drops TLS
    correct: 1
    explanation: HTTP/2 multiplexes streams on one TCP connection. HTTP/3 moves to QUIC over UDP.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TlsHandshakeFlow from '#lib/diagrams/TlsHandshakeFlow.svelte';
</script>

HTTP is how browsers and services ask for things and get answers. HTTPS is the same protocol inside an encrypted TLS tunnel.

## What it is

**<Term id="http">HTTP</Term>** is a method for encoding and transporting data between a client and a server. It is a request/response protocol: clients issue requests and servers issue responses with relevant content and completion status info about the request. HTTP is self-contained, allowing requests and responses to flow through many intermediate routers and servers that perform load balancing, caching, encryption, and compression. <Src id="primer" />

**HTTPS** is HTTP sent over **<Term id="tls">TLS</Term>**, which encrypts the traffic, detects tampering and lets the client check, through a certificate, that it is talking to the real server. <Src id="mdn-tls" />

## How it works

A basic HTTP request consists of a verb (method) and a resource (endpoint). Below are common HTTP verbs: <Src id="primer" />

| Verb | Description | Idempotent* | Safe | Cacheable |
|---|---|---|---|---|
| GET | Reads a resource | Yes | Yes | Yes |
| POST | Creates a resource or trigger a process that handles data | No | No | Yes if response contains freshness info |
| PUT | Creates or replace a resource | Yes | No | No |
| PATCH | Partially updates a resource | No | No | Yes if response contains freshness info |
| DELETE | Deletes a resource | Yes | No | No |

*Can be called many times without different outcomes. <Src id="primer" />

HTTP is an application layer protocol relying on lower-level protocols such as **<Term id="tcp">TCP</Term>** and **<Term id="udp">UDP</Term>**. <Src id="primer" />

**The TLS handshake.** Before any HTTP is sent, client and server agree on a cipher, the server presents a certificate signed by a trusted authority, and both derive shared session keys. TLS 1.3 does this in one round trip. <Src id="mdn-tls" />

<TlsHandshakeFlow />

**Versions.** HTTP/1.1 sends one request at a time per connection, so browsers open several connections. HTTP/2 multiplexes many requests over one connection with compressed headers. HTTP/3 runs over QUIC on UDP, so one lost packet no longer stalls every stream. <Src id="mdn-http" />

## Trade-offs

- **HTTPS costs a little <Term id="latency">latency</Term> and CPU,** mostly in the handshake. Connection reuse and TLS 1.3 make it small; there is no good reason to serve plain HTTP today.
- **Terminating TLS at the <Term id="load-balancer">load balancer</Term>** keeps certificates in one place and spares app servers, but traffic inside your network is then unencrypted unless you re-encrypt.
- **Stateless requests scale well** behind load balancers and <Term id="cache">caches</Term>, but anything stateful (sessions) has to live somewhere shared.

## Interview tips

- Use verbs correctly in API design, and call out idempotency when you talk about retries.
- Say where TLS ends: "TLS terminates at the load balancer; internal traffic uses mTLS" is a solid default.
- When latency matters, count round trips: <Term id="dns">DNS</Term>, TCP, TLS, then the request. Keep-alive and HTTP/2 cut most of them.
