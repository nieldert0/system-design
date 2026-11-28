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
    use: reworded
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
  - prompt: What does TLS add to HTTP?
    options:
      - Compression only
      - Encryption, integrity and server authentication
      - Load balancing
      - Caching
    correct: 1
    explanation: HTTPS is HTTP over TLS, which encrypts traffic, detects tampering and proves the server's identity with a certificate.
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
  - prompt: In the worked example (80 ms RTT), how much does reusing a kept-alive HTTPS connection save on a later request, compared with a fresh connection using TLS 1.2?
    options:
      - Nothing
      - About 80 ms
      - About 240 ms, the TCP round trip plus TLS 1.2's two round trips
      - About 1 second
    correct: 2
    explanation: A fresh TLS 1.2 connection costs 3 RTTs before the request (1 for TCP, 2 for TLS). A reused connection skips all three.
  - prompt: A payment POST times out, and the client does not know whether it was charged. What makes a retry safe?
    options:
      - Switching the request to GET
      - Sending an idempotency key so the server recognises the repeat and returns the first result
      - Retrying faster
      - Using HTTP/2
    correct: 1
    explanation: POST is not idempotent, so the server must deduplicate. An idempotency key turns a retry into a lookup of the original outcome.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import TlsHandshakeFlow from '#lib/diagrams/TlsHandshakeFlow.svelte';
</script>

HTTP is how browsers and services ask for things and get answers. HTTPS is the same protocol inside an encrypted TLS tunnel. Between them they decide most of what an API looks like, how retries behave, and how many round trips a request costs.

## What it is

Here is the problem. A [TCP connection](/modules/tcp-and-udp) gives two programs a reliable pipe of bytes, but says nothing about what the bytes mean. A browser needs a shared way to say "give me `/products/42`, I accept JSON, here is my login", and a server needs a way to answer "here it is, it is valid for 60 seconds" or "not found". Worse, those bytes cross networks you do not own: café Wi-Fi, ISPs, corporate proxies. Anyone along the path can read them or change them.

**<Term id="http">HTTP</Term>** (Hypertext Transfer Protocol) solves the first part. It is a request/response protocol: the client sends a method, a path, headers and an optional body, and the server sends back a status code, headers and a body. Each request carries everything needed to understand it, so requests can pass through intermediaries (load balancers, caches, proxies) that route, cache, compress or inspect them. <Src id="primer" />

**HTTPS** solves the second part. It is plain HTTP sent through **<Term id="tls">TLS</Term>** (Transport Layer Security), which does three things: it **encrypts** the traffic so others cannot read it, **detects tampering** so others cannot change it, and **authenticates** the server through a certificate so you know you are talking to the real `bank.com`. <Src id="mdn-tls" />

## How it works

### Requests, methods and status codes

A request names a method (verb) and a resource (path). The methods you will use in API design: <Src id="primer" />

| Verb | Description | Idempotent* | Safe | Cacheable |
|---|---|---|---|---|
| GET | Reads a resource | Yes | Yes | Yes |
| POST | Creates a resource or triggers a process | No | No | Yes if the response contains freshness info |
| PUT | Creates or replaces a resource | Yes | No | No |
| PATCH | Partially updates a resource | No | No | Yes if the response contains freshness info |
| DELETE | Deletes a resource | Yes | No | No |

*Idempotent means calling it many times has the same effect as calling it once. Safe means it does not change server state.

Idempotency is what makes retries safe. If a PUT times out, sending it again is harmless, because the second one sets the same value. A POST that creates an order may create two. APIs fix this with an <Term id="idempotency-key">idempotency key</Term>, covered in the follow-up questions.

Status codes come in families: 2xx success (200 OK, 201 Created), 3xx redirect (301, 304 Not Modified), 4xx the client's fault (400, 401 unauthenticated, 403 forbidden, 404, 429 too many requests), 5xx the server's fault (500, 502 bad gateway, 503 unavailable, 504 gateway timeout). Clients should retry 503 and 504 with backoff, and never blindly retry 4xx.

Headers carry everything else. `Cache-Control: max-age=60` tells browsers and CDNs how long a response stays fresh, `Authorization` carries credentials, `Content-Type` says the body's format, and `Connection: keep-alive` (the default since HTTP/1.1) keeps the TCP connection open for the next request.

### The TLS handshake

Before any HTTP is sent, client and server run a handshake. The client says which TLS versions and ciphers it supports and sends a key share. The server picks a cipher, sends its own key share, and presents its **certificate**: a document binding the hostname to a public key, signed by a <Term id="certificate-authority">certificate authority (CA)</Term> that the client's operating system or browser already trusts. The client checks the signature chain, the hostname and the expiry date, and both sides derive the same session keys from the key shares without ever sending them. From then on, every record is encrypted and integrity-checked with those keys. <Src id="mdn-tls" />

TLS 1.3 does this in **one round trip** after the TCP handshake; TLS 1.2 needed two. TLS 1.3 also supports session resumption and "0-RTT" data, where a returning client sends its first request along with the handshake, at the cost of that early data being replayable, so it should only carry idempotent requests.

<TlsHandshakeFlow />

### Where TLS ends

TLS protects one hop between two endpoints. In most systems the first endpoint is not your app server but a load balancer, CDN or [reverse proxy](/modules/reverse-proxies-api-gateways) that **terminates TLS**: it decrypts, routes on the HTTP contents, and either forwards plain HTTP inside the private network or opens a new TLS connection to the backend. Inside service meshes, services often use <Term id="mtls">mTLS</Term> (mutual TLS), where both sides present certificates, so each service can prove its identity to the other.

### Versions

<Src id="mdn-http" />

- **HTTP/1.1** sends one request at a time per connection; the next waits for the previous response. Browsers work around it by opening about six connections per host.
- **HTTP/2** splits each connection into many **streams**, so dozens of requests and responses are interleaved on one TCP connection, and it compresses headers. But all streams share TCP's in-order delivery, so one lost packet stalls all of them (<Term id="head-of-line-blocking">head-of-line blocking</Term>).
- **HTTP/3** runs over <Term id="quic">QUIC</Term> on UDP. Streams are ordered independently, so a loss only stalls its own stream, and the transport and TLS handshakes are combined into one round trip.

## Worked example

A shopper in Paris opens a product page from a server in a US East region, **80 ms** round trip away. The page needs the HTML and 30 small resources (CSS, scripts, images). Server time per request is 10 ms.

**Step 1, first visit, HTTP/1.1 and TLS 1.2.** DNS is cached. TCP handshake: 1 RTT. TLS 1.2: 2 RTTs. The HTML request: 1 RTT plus 10 ms. Time to first byte: 4 × 80 + 10 = **330 ms**. The browser then opens 5 more connections for the resources, each paying 3 RTTs (240 ms) of handshakes in parallel, and then pushes 30 requests through 6 connections, 5 rounds of 90 ms. Roughly 330 + 240 + 450 ≈ **1 second**.

**Step 2, TLS 1.3 and HTTP/2.** TLS drops to 1 RTT, so first byte is 3 × 80 + 10 = **250 ms**. HTTP/2 sends all 30 resource requests at once on the existing connection: one more round of about 90 ms, plus transfer time. Roughly 250 + 90 ≈ **350 ms**, a third of before, with no change to the server.

**Step 3, a returning visit.** The connection was closed, but the browser has a TLS session ticket. With TLS 1.3 resumption and HTTP/3, the QUIC and TLS handshakes share one RTT: first byte is 2 × 80 + 10 = **170 ms**. If the browser still has an open, kept-alive connection, it is just 1 RTT plus server time: **90 ms**.

**Step 4, move the endpoint.** A CDN edge in Paris, 5 ms away, terminates TLS and serves cached resources. Handshakes cost 5 ms each, and the edge keeps a warm connection to the US origin for the HTML. First byte becomes about 2 × 5 + 80 + 10 ≈ **100 ms** on a fresh connection, and resources come from the edge cache in a few milliseconds.

**What TLS costs the server.** A full handshake with modern elliptic-curve keys takes well under a millisecond of CPU, and bulk encryption with AES runs at gigabytes per second on CPUs with AES instructions. For a server doing 10,000 new connections a second, handshakes might take a core or two. That is why connection reuse matters more than avoiding TLS, and why terminating TLS at a few edge machines is attractive.

## In the real world

- **Nginx.** `ssl_protocols TLSv1.2 TLSv1.3;` controls versions, `ssl_session_cache` and `ssl_session_tickets` enable resumption, and `keepalive_timeout` (default 75 seconds) controls how long idle client connections stay open. For upstreams, the `keepalive` directive keeps a pool of connections to backends instead of opening one per request.
- **Let's Encrypt.** A free, automated CA that issues certificates valid for 90 days through the ACME protocol, renewed by tools such as Certbot. Short lifetimes mean renewal must be automated; most outages caused by expired certificates come from manual renewal.
- **AWS Application Load Balancer.** Terminates TLS using certificates from AWS Certificate Manager, chosen by a security policy (for example one that allows only TLS 1.2 and 1.3), speaks HTTP/2 to clients, and by default forwards to targets over plain HTTP unless you configure HTTPS target groups.
- **Envoy and Istio.** In an Istio service mesh, an Envoy sidecar next to each service handles mTLS automatically, issuing and rotating short-lived certificates, so application code makes plain HTTP calls and still gets encrypted, authenticated traffic. Istio's `PeerAuthentication` with `mode: STRICT` rejects any plaintext.

## Trade-offs

- **HTTPS costs a little <Term id="latency">latency</Term> and CPU,** mostly in the handshake. Connection reuse and TLS 1.3 make it small; there is no good reason to serve plain HTTP today, and browsers mark it insecure.
- **Terminating TLS at the <Term id="load-balancer">load balancer</Term>** keeps certificates in one place and spares app servers, but traffic inside your network is then unencrypted unless you re-encrypt or use mTLS.
- **HTTP/2 against HTTP/3.** HTTP/2 is universally supported and fine on good networks. HTTP/3 wins on lossy mobile networks and saves a round trip, but some networks block UDP, so you must keep HTTP/2 as a fallback.
- **Stateless requests scale well** behind load balancers and <Term id="cache">caches</Term>, but anything stateful (sessions) has to live somewhere shared.

## Interview tips

- Use verbs correctly in [API design](/modules/api-design), and call out idempotency when you talk about retries.
- Say where TLS ends: "TLS terminates at the load balancer; internal traffic uses mTLS" is a solid default.
- When latency matters, count round trips: <Term id="dns">DNS</Term>, TCP, TLS, then the request. Keep-alive and HTTP/2 cut most of them.

**Common mistakes:**

- Retrying non-idempotent requests (POST) on timeout without an idempotency key, which double-charges or double-creates.
- Using GET for actions that change state. Crawlers, link previews and prefetching will trigger them, and caches may serve them.
- Letting certificates expire. Automate renewal and alert well before expiry.
- Assuming HTTPS makes an API secure. TLS protects data in transit; it does nothing for authentication of users, authorisation or input validation.

## Common follow-up questions

### How do you make a POST safe to retry?

The client generates a unique idempotency key per logical operation, for example a UUID, and sends it in a header. The server stores the key with the result of the first request. A repeat with the same key returns the stored result instead of doing the work again. Keep keys for at least as long as clients may retry, typically 24 hours.

### What does a certificate actually prove?

That a CA the client trusts has verified that whoever holds the matching private key controls that domain name. It proves the server is `shop.example.com`, not that the company is honest. The client checks the signature chain up to a trusted root, that the hostname matches, and that it has not expired.

### HTTP/2 or WebSockets for server push?

HTTP/2 multiplexes requests but does not give the server a general way to push messages to a page; its "server push" feature for resources was removed by major browsers. For live updates, use server-sent events or WebSockets, covered in [Real-time](/modules/real-time).

### Should internal service-to-service traffic use TLS?

Yes, increasingly by default. A zero-trust stance assumes the internal network can be compromised, and mTLS gives both encryption and service identity. A service mesh makes it cheap to operate. The cost is certificate management and a little latency per new connection, which pooling hides.

## Go deeper

- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/): every byte of a real TLS 1.3 handshake, annotated.
- [RFC 9110, HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110): the authoritative definition of methods, status codes, idempotency and caching headers.
- [High Performance Browser Networking, TLS](https://hpbn.co/transport-layer-security-tls/): handshake costs, session resumption and performance tuning with numbers.
- [MDN, Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Evolution_of_HTTP): what changed from HTTP/0.9 to HTTP/3 and why.
