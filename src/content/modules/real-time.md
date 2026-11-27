---
slug: real-time
title: 'Real-time: polling, SSE and WebSockets'
section: networking
upgraded: true
readFirst:
  - http-https-tls
sources:
  - id: mdn-sse
    title: MDN Web Docs, Using server-sent events
    url: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
    license: CC BY-SA 2.5
    use: reworded
  - id: mdn-ws
    title: MDN Web Docs, The WebSocket API
    url: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
    license: CC BY-SA 2.5
    use: reworded
  - id: wiki-push
    title: Wikipedia, Push technology (long polling)
    url: https://en.wikipedia.org/wiki/Push_technology#Long_polling
    license: CC BY-SA 4.0
    use: reworded
quiz:
  - prompt: How does long polling differ from short polling?
    options:
      - It uses WebSockets
      - The server holds the request open until there is new data or a timeout, then the client asks again
      - It polls less often on a timer
      - It only works over UDP
    correct: 1
    explanation: Long polling cuts empty responses by waiting on the server side.
  - prompt: What is true of server-sent events (SSE)?
    options:
      - They are two-way
      - They are one-way, server to client, over a plain HTTP response
      - They need a custom protocol
      - They only send binary data
    correct: 1
    explanation: SSE streams text events from server to client over HTTP; the browser reconnects automatically.
  - prompt: Which fits a multiplayer chat where both sides send often?
    options:
      - Short polling
      - SSE
      - WebSockets
      - DNS
    correct: 2
    explanation: WebSockets give a full-duplex connection, so both sides can send at any time.
  - prompt: What is a scaling challenge with WebSockets?
    options:
      - They cannot carry text
      - Each client holds a long-lived connection to one server, so you need a way to fan messages out to whichever server holds each user
      - They are slower than polling for every case
      - They need DNS changes per message
    correct: 1
    explanation: Long-lived connections are stateful. A pub/sub layer usually fans messages out to the right connection servers.
  - prompt: A dashboard needs live stock prices pushed to the browser; clients never send data back. What fits best?
    options:
      - WebSockets
      - SSE
      - Short polling every 100 ms
      - UDP
    correct: 1
    explanation: One-way server push is exactly what SSE is for, and it works over plain HTTP.
  - prompt: In the worked example, 1 million users short-poll every 5 seconds and a message arrives for each user about once a minute. What share of poll responses are empty?
    options:
      - About 8%
      - About 50%
      - About 92%, because only 1 in 12 polls finds a message
      - 0%
    correct: 2
    explanation: 12 polls a minute, 1 message a minute, so 11 of 12 responses (about 92%) are empty, while the server still handles 200,000 requests a second.
  - prompt: A WebSocket server holding 100,000 connections is restarted for a deploy. What should clients do to avoid overloading the remaining servers?
    options:
      - Reconnect immediately all at once
      - Reconnect with randomised exponential backoff and resume from the last message id they saw
      - Switch to short polling forever
      - Wait for a DNS change
    correct: 1
    explanation: Instant reconnects become a reconnect storm. Jittered backoff spreads them out, and resuming from a cursor fills the gap without losing messages.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RealTimeLanesFlow from '#lib/diagrams/RealTimeLanesFlow.svelte';
</script>

<Term id="http">HTTP</Term> is built for the client to ask. Real-time features need the server to tell. Polling, server-sent events and WebSockets are three ways to get there, and the choice decides how many connections, requests and servers you run.

## What it is

Here is the problem. A chat message for Alice arrives at your backend. Alice's browser is open, but in plain HTTP the server can only answer a request; it cannot start one. And because of <Term id="nat">NAT</Term> and firewalls, the server usually cannot connect to Alice's device at all (see [How the internet works](/modules/how-the-internet-works)). So either Alice keeps asking, or Alice opens a connection the server can keep writing to.

Four techniques cover it, from simplest to most capable:

- **Short polling**: the client asks on a timer ("anything new?"). Simple, but most answers are empty and the delay is up to one interval.
- **Long polling**: the client asks, and the server holds the request open until it has news or a timeout passes, then the client immediately asks again. Almost no empty answers, and delivery is nearly instant. <Src id="wiki-push" />
- **<Term id="sse">Server-sent events (SSE)</Term>**: the server keeps one HTTP response open and writes text events to it as they happen. It is one way, server to client, and the browser reconnects by itself. <Src id="mdn-sse" />
- **<Term id="websocket">WebSockets</Term>**: a two-way, long-lived connection. Both sides can send messages at any time without new requests. <Src id="mdn-ws" />

## How it works

### Long polling

Long polling looks like ordinary HTTP, so it passes through any proxy and firewall. The client sends `GET /updates?after=1041`; the server parks the request (holds it without replying) until a message after id 1041 exists or about 30 seconds pass, replies, and the client immediately sends the next request. Every delivered batch costs a full request with its headers, and a burst of messages means a burst of requests. <Src id="wiki-push" />

### Server-sent events

SSE uses a normal HTTP response with the content type `text/event-stream` that simply never ends. The server writes lines such as `id: 1042` and `data: {"price": 187.3}` followed by a blank line for each event. In the browser, an `EventSource` object reads the stream and fires an event per message. If the connection drops, it reconnects automatically after a delay the server can set with a `retry:` line, and sends a `Last-Event-ID` header so the server can resume from where it left off. SSE carries text only, and the client sends data back through ordinary HTTP requests. Over HTTP/1.1, browsers limit a site to about six connections, so many SSE tabs can exhaust them; over HTTP/2 they share one connection. <Src id="mdn-sse" />

### WebSockets

A WebSocket starts as an HTTP request with an `Upgrade: websocket` header. The server answers `101 Switching Protocols`, and from then on the same <Term id="tcp">TCP</Term> connection carries small framed messages in both directions, text or binary, with only a few bytes of overhead each. There is no built-in reconnect or message history: if the connection drops, your code must reconnect and catch up. Idle connections are often closed by proxies and load balancers after a minute or so, so both sides send periodic **heartbeats** (small ping and pong frames) to keep the connection alive and detect dead peers. <Src id="mdn-ws" />

<RealTimeLanesFlow />

### Scaling long-lived connections

Every open SSE or WebSocket connection is pinned to one server process. That creates two problems.

1. **Routing a message to a user.** The message for Alice is produced by some backend service, but Alice's connection lives on connection server 17. The usual answer is a <Term id="pub-sub">pub/sub</Term> layer: each connection server subscribes to the channels for the users connected to it (or to shared topic channels), and any backend publishes to the channel. See [Pub/sub and event streaming](/modules/pub-sub-and-event-streaming).
2. **Connections are state.** Deploys and crashes drop thousands of connections at once, and load balancers spread *new* connections well but cannot move existing ones. So you need client reconnects with backoff, a way to replay missed messages, and graceful draining (stop accepting new connections, ask clients to reconnect elsewhere, then shut down). Some systems also use <Term id="sticky-session">sticky sessions</Term> so a long-polling client keeps hitting the same server.

## Worked example

A messaging app has **1 million users online**. Each receives about **one message a minute** and expects it within a couple of seconds.

**Step 1, short polling every 5 seconds.** Each user sends 12 requests a minute, so the servers handle 1,000,000 ÷ 5 = **200,000 requests a second**. Only one poll in 12 finds a message, so about **92%** of responses are empty. With roughly 800 bytes of headers per request and response, that is about 160 MB/s of overhead, and every request authenticates the user and checks storage. Average delay is 2.5 seconds, worst case 5. Polling every second would cut delay but quintuple the load to 1 million requests a second.

**Step 2, long polling.** Each client keeps one request parked. A request completes when a message arrives (about once a minute) or after a 30-second timeout (twice a minute at most), so roughly **two requests a minute per user**: about 33,000 requests a second, a sixth of short polling, with delivery in well under a second. But the server now holds 1 million parked requests at any moment.

**Step 3, WebSockets.** One connection per user, 1 million concurrent connections, and almost no requests: messages flow down at 1,000,000 ÷ 60 ≈ **16,700 messages a second**, each a few bytes of framing plus the payload. Heartbeats every 30 seconds add about 33,000 tiny frames a second. How many servers? An event-driven server (Node.js, Go, Erlang) can hold around **100,000 idle connections** comfortably, with memory per connection of tens of kilobytes for TCP buffers and app state. 1 million ÷ 100,000 = **10 connection servers**, plus headroom, say 15. Raise the file-descriptor limit on each, since every connection is one <Term id="file-descriptor">file descriptor</Term>.

**Step 4, a deploy.** You restart one of the 15 servers. Its roughly 67,000 clients reconnect. If they all retry instantly, the remaining servers see 67,000 TLS handshakes and authentications in the same second: a reconnect storm, the real-time version of the <Term id="thundering-herd">thundering herd</Term>. Fix it with **randomised exponential backoff** (wait a random 0 to 1 second, then 0 to 2, and so on) so reconnects spread over several seconds, and have each client send the id of the last message it received so the server replays what it missed from storage.

## In the real world

- **Slack.** Each desktop and mobile client holds a WebSocket to Slack's gateway servers, which subscribe to channel servers on the user's behalf; a message posted to a channel fans out to every gateway with a member connected. Slack's engineering blog describes this split between channel servers, gateway servers and presence.
- **Discord.** Runs its real-time gateway on Elixir (the Erlang virtual machine), where each connected user is a lightweight process; it has written about handling millions of concurrent users per cluster and uses zlib compression on the WebSocket stream to cut bandwidth.
- **Nginx and AWS load balancers.** Proxying WebSockets in Nginx needs `proxy_http_version 1.1` and passing the `Upgrade` and `Connection` headers, and `proxy_read_timeout` (default 60 seconds) closes idle connections unless heartbeats keep them alive. An AWS Application Load Balancer supports WebSockets natively, with an idle timeout that defaults to 60 seconds.
- **Socket.IO.** A popular Node.js library that uses WebSockets and falls back to long polling when they are blocked, with built-in reconnection, rooms, and adapters (for example a Redis adapter) that do the pub/sub fan-out between servers.

## Trade-offs

| | Short polling | Long polling | SSE | WebSockets |
|---|---|---|---|---|
| Direction | Client asks | Client asks | Server → client | Both ways |
| <Term id="latency">Latency</Term> | Up to one interval | Low | Low | Lowest |
| Overhead | High, many empty requests | A request per message batch | One open response | One open connection |
| Reconnect and resume | n/a | Client re-asks with a cursor | Built in (`Last-Event-ID`) | Your code |
| Infrastructure | Plain HTTP | Plain HTTP | Plain HTTP | Needs upgrade support, long idle timeouts |

- Polling is the simplest and fine when a few seconds of delay is acceptable and users are few.
- SSE covers most "push updates to the page" needs with plain HTTP and free reconnects.
- WebSockets suit chat, games and collaborative editing, at the cost of stateful connections to manage.

## Interview tips

- Pick the simplest option that meets the latency need, and say why. "Notifications every few seconds: long polling or SSE. Chat: WebSockets."
- Explain fan-out: connection servers plus pub/sub, so any backend can reach any user.
- Mention reconnects and missed messages. Clients drop off; store recent events so they can catch up.
- Size it: connections per server, servers needed, and messages a second, as in the worked example.

**Common mistakes:**

- Treating the WebSocket as the source of truth. Connections drop, so persist messages first and push them as a notification; a reconnecting client fetches what it missed.
- Forgetting idle timeouts. Proxies and load balancers close silent connections after about 60 seconds unless heartbeats run.
- Letting all clients reconnect at once after a deploy, which overloads the remaining servers.
- Reaching for WebSockets when data only flows one way, adding stateful infrastructure that SSE would have avoided.

## Common follow-up questions

### How do you send a message to a user connected to a different server?

Keep a mapping from user to connection server, or simpler, have each connection server subscribe to a pub/sub channel per connected user or per room (Redis pub/sub, NATS or Kafka). The service that produces the message publishes to the channel, and only servers with subscribers receive it.

### How do you guarantee a user does not miss messages?

Store every message durably with an increasing id before pushing it. The client remembers the last id it saw and, on reconnect, asks for everything after it. The push is then just a fast path; correctness comes from the store. SSE's `Last-Event-ID` header does exactly this.

### How do you show who is online (presence)?

Each connection server records "user X is connected" with a short expiry in a shared store such as Redis, refreshed by heartbeats. When the connection drops, the entry expires within seconds. Broadcast presence changes only to the user's contacts, since fanning out every change to everyone is the expensive part.

### Why not use WebSockets for everything?

They need stateful servers, long idle timeouts on every proxy, custom reconnect logic, and bypass HTTP caching. For request/response APIs, plain HTTP is simpler and cacheable. Use WebSockets where frequent two-way messages justify the cost.

## Go deeper

- [RFC 6455, The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455): the upgrade handshake, framing, ping/pong and close codes.
- [WHATWG HTML, Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html): the event-stream format, reconnection and `Last-Event-ID`.
- [Slack Engineering, Real-time messaging](https://slack.engineering/real-time-messaging/): how Slack routes messages through channel and gateway servers to millions of WebSocket clients.
- [MDN, The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API): the browser API, with examples of both WebSocket and the newer WebSocketStream.
