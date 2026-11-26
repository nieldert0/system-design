---
slug: real-time
title: 'Real-time: polling, SSE and WebSockets'
section: networking
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
  - prompt: What is short polling?
    options:
      - The server pushes data over an open socket
      - The client asks the server for updates on a fixed timer
      - The client keeps one request open until data arrives
      - A UDP broadcast
    correct: 1
    explanation: Short polling asks every N seconds, whether or not anything changed.
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
      - Each client holds a long-lived connection to one server, so you need sticky routing and a way to fan messages out across servers
      - They are slower than polling for every case
      - They need DNS changes per message
    correct: 1
    explanation: Long-lived connections are stateful. A pub/sub layer usually fans messages out to whichever server holds each user.
  - prompt: A dashboard needs live stock prices pushed to the browser; clients never send data back. What fits best?
    options:
      - WebSockets
      - SSE
      - Short polling every 100 ms
      - UDP
    correct: 1
    explanation: One-way server push is exactly what SSE is for, and it works over plain HTTP.
---

<script>
	import Src from '#lib/components/Src.svelte';
	import Term from '#lib/components/Term.svelte';
	import RealTimeLanesFlow from '#lib/diagrams/RealTimeLanesFlow.svelte';
</script>

<Term id="http">HTTP</Term> is built for the client to ask. Real-time features need the server to tell. Polling, server-sent events and WebSockets are three ways to get there.

## What it is

- **Short polling**: the client asks on a timer ("anything new?"). Simple, but most answers are empty.
- **Long polling**: the client asks, and the server holds the request open until it has news or a timeout passes, then the client immediately asks again. <Src id="wiki-push" />
- **<Term id="sse">Server-sent events (SSE)</Term>**: the server keeps one HTTP response open and writes text events to it. It is one way, server to client, and the browser reconnects by itself. <Src id="mdn-sse" />
- **<Term id="websocket">WebSockets</Term>**: a two-way, long-lived connection. Both sides can send messages at any time without polling. <Src id="mdn-ws" />

## How it works

Long polling looks like ordinary HTTP, so it passes through any proxy, but every message costs a new request and its headers. <Src id="wiki-push" />

SSE uses a normal HTTP response with the content type `text/event-stream`. In the browser, an `EventSource` reads the stream and fires an event for each message; if the connection drops it reconnects and can resume from the last event id. <Src id="mdn-sse" />

A WebSocket starts as an HTTP request that asks to upgrade the connection. After that, the same <Term id="tcp">TCP</Term> connection carries framed messages in both directions, text or binary. <Src id="mdn-ws" />

<RealTimeLanesFlow />

At scale, every open SSE or WebSocket connection is pinned to one server. To send a message to a user, the system must find the server holding their connection, which is usually solved with a <Term id="pub-sub">pub/sub</Term> channel that all connection servers subscribe to.

## Trade-offs

| | Short polling | Long polling | SSE | WebSockets |
|---|---|---|---|---|
| Direction | Client asks | Client asks | Server → client | Both ways |
| <Term id="latency">Latency</Term> | Up to one interval | Low | Low | Lowest |
| Overhead | High, many empty requests | A request per message | One open response | One open connection |
| Infrastructure | Plain HTTP | Plain HTTP | Plain HTTP | Needs upgrade support, sticky connections |

- Polling is the simplest and fine when a few seconds of delay is acceptable.
- SSE covers most "push updates to the page" needs with plain HTTP.
- WebSockets suit chat, games and collaboration, at the cost of stateful connections to manage.

## Interview tips

- Pick the simplest option that meets the latency need, and say why. "Notifications every few seconds: long polling or SSE. Chat: WebSockets."
- Explain fan-out: connection servers plus pub/sub, so any backend can reach any user.
- Mention reconnects and missed messages. Clients drop off; store recent events so they can catch up.
