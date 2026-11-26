// Glossary: each term's definition, its source, and the module that teaches it.
export type GlossaryEntry = {
	id: string;
	term: string;
	definition: string;
	module: string;
	source: { title: string; url: string; license: string };
};

const primer = (anchor: string) => ({
	title: 'The System Design Primer',
	url: `https://github.com/donnemartin/system-design-primer#${anchor}`,
	license: 'CC BY 4.0'
});

export const glossary: GlossaryEntry[] = [
	{
		id: 'latency',
		term: 'Latency',
		definition: 'The time to perform some action or to produce some result.',
		module: 'latency-vs-throughput',
		source: primer('latency-vs-throughput')
	},
	{
		id: 'throughput',
		term: 'Throughput',
		definition: 'The number of actions or results per unit of time.',
		module: 'latency-vs-throughput',
		source: primer('latency-vs-throughput')
	},
	{
		id: 'bandwidth',
		term: 'Bandwidth',
		definition: 'The maximum achievable speed or capacity of a channel. Throughput is what is actually achieved, and is always less.',
		module: 'latency-vs-throughput',
		source: {
			title: 'Wikipedia, Network throughput',
			url: 'https://en.wikipedia.org/wiki/Network_throughput',
			license: 'CC BY-SA 4.0'
		}
	},
	{
		id: 'littles-law',
		term: "Little's law",
		definition:
			'The average number of items in a system equals their average arrival rate multiplied by the average time each spends in the system (L = λW).',
		module: 'latency-vs-throughput',
		source: {
			title: "Wikipedia, Little's law",
			url: 'https://en.wikipedia.org/wiki/Little%27s_law',
			license: 'CC BY-SA 4.0'
		}
	},
	{
		id: 'scalability',
		term: 'Scalability',
		definition:
			'A service is scalable if it results in increased performance in a manner proportional to resources added.',
		module: 'performance-vs-scalability',
		source: primer('performance-vs-scalability')
	},
	{
		id: 'horizontal-scaling',
		term: 'Horizontal scaling',
		definition:
			'Scaling out by adding more machines that share the work, as opposed to scaling up one server on more expensive hardware (vertical scaling).',
		module: 'performance-vs-scalability',
		source: primer('horizontal-scaling')
	},
	{
		id: 'back-of-the-envelope',
		term: 'Back-of-the-envelope estimate',
		definition:
			'A quick estimate done by hand, such as how long a job takes or how much memory a structure needs, aiming for the right order of magnitude.',
		module: 'back-of-the-envelope',
		source: primer('appendix')
	},
	{
		id: 'ip-address',
		term: 'IP address',
		definition:
			'A numeric label for a network interface, used by the Internet Protocol to route packets from a source to a destination.',
		module: 'how-the-internet-works',
		source: { title: 'Wikipedia, IP address', url: 'https://en.wikipedia.org/wiki/IP_address', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'tcp',
		term: 'TCP',
		definition:
			'A connection-oriented transport protocol that delivers data reliably and in order, using sequence numbers, checksums, acknowledgements and retransmission.',
		module: 'tcp-and-udp',
		source: primer('transmission-control-protocol-tcp')
	},
	{
		id: 'udp',
		term: 'UDP',
		definition:
			'A connectionless transport protocol. Datagrams might arrive out of order or not at all, but it has lower overhead and latency than TCP.',
		module: 'tcp-and-udp',
		source: primer('user-datagram-protocol-udp')
	},
	{
		id: 'dns',
		term: 'DNS',
		definition:
			'The Domain Name System translates a domain name such as www.example.com to an IP address.',
		module: 'dns',
		source: primer('domain-name-system')
	},
	{
		id: 'ttl',
		term: 'Time to live (TTL)',
		definition:
			'How long a cached answer, such as a DNS record, may be reused before it must be fetched again.',
		module: 'dns',
		source: primer('domain-name-system')
	},
	{
		id: 'http',
		term: 'HTTP',
		definition:
			'A request/response protocol for encoding and transporting data between a client and a server.',
		module: 'http-https-tls',
		source: primer('hypertext-transfer-protocol-http')
	},
	{
		id: 'tls',
		term: 'TLS',
		definition:
			'Transport Layer Security: encrypts a connection, protects it from tampering and authenticates the server with a certificate. HTTPS is HTTP over TLS.',
		module: 'http-https-tls',
		source: { title: 'MDN Web Docs, Transport Layer Security', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security', license: 'CC BY-SA 2.5' }
	},
	{
		id: 'sse',
		term: 'Server-sent events (SSE)',
		definition:
			'A one-way stream of text events from server to client over a long-lived HTTP response.',
		module: 'real-time',
		source: { title: 'MDN Web Docs, Server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events', license: 'CC BY-SA 2.5' }
	},
	{
		id: 'websocket',
		term: 'WebSocket',
		definition:
			'A long-lived, two-way connection between client and server, started by upgrading an HTTP request.',
		module: 'real-time',
		source: { title: 'MDN Web Docs, The WebSocket API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', license: 'CC BY-SA 2.5' }
	}
];
