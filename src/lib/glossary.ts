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
	},
	{
		id: 'process',
		term: 'Process',
		definition:
			'A running program: its code, its own isolated memory and the resources the OS gave it.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Process (computing)', url: 'https://en.wikipedia.org/wiki/Process_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'thread',
		term: 'Thread',
		definition:
			'A sequence of instructions the OS schedules. Threads of one process share its memory.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Thread (computing)', url: 'https://en.wikipedia.org/wiki/Thread_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'file-descriptor',
		term: 'File descriptor',
		definition:
			'A small integer a process uses to refer to an open file, socket or pipe.',
		module: 'files-permissions-shell',
		source: { title: 'Wikipedia, File descriptor', url: 'https://en.wikipedia.org/wiki/File_descriptor', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'load-balancer',
		term: 'Load balancer',
		definition:
			'Distributes incoming client requests to computing resources such as application servers and databases.',
		module: 'load-balancers',
		source: primer('load-balancer')
	},
	{
		id: 'reverse-proxy',
		term: 'Reverse proxy',
		definition:
			'A web server that centralizes internal services and provides unified interfaces to the public.',
		module: 'reverse-proxies-api-gateways',
		source: primer('reverse-proxy-web-server')
	},
	{
		id: 'cdn',
		term: 'CDN',
		definition:
			'A content delivery network: a globally distributed network of proxy servers, serving content from locations closer to the user.',
		module: 'cdn',
		source: primer('content-delivery-network')
	},
	{
		id: 'cp',
		term: 'CP system',
		definition:
			'A system that, during a network partition, keeps consistency and may return errors or time out instead of stale data.',
		module: 'cap-theorem',
		source: primer('cp---consistency-and-partition-tolerance')
	},
	{
		id: 'ap',
		term: 'AP system',
		definition:
			'A system that, during a network partition, keeps answering with the most readily available data, which might not be the latest.',
		module: 'cap-theorem',
		source: primer('ap---availability-and-partition-tolerance')
	},
	{
		id: 'eventual-consistency',
		term: 'Eventual consistency',
		definition:
			'After a write, reads will eventually see it (typically within milliseconds). Data is replicated asynchronously.',
		module: 'consistency-patterns',
		source: primer('eventual-consistency')
	},
	{
		id: 'strong-consistency',
		term: 'Strong consistency',
		definition:
			'After a write, reads will see it. Data is replicated synchronously.',
		module: 'consistency-patterns',
		source: primer('strong-consistency')
	},
	{
		id: 'failover',
		term: 'Fail-over',
		definition:
			'Switching traffic to a standby copy when the active one fails, for example when heartbeats stop.',
		module: 'availability-patterns',
		source: primer('fail-over')
	},
	{
		id: 'cache',
		term: 'Cache',
		definition:
			'A fast store that keeps previous results so a request can be answered without repeating the work.',
		module: 'where-to-cache',
		source: primer('cache')
	},
	{
		id: 'cache-aside',
		term: 'Cache-aside',
		definition:
			'The application checks the cache, loads from the database on a miss and adds the entry to the cache. Also called lazy loading.',
		module: 'cache-strategies-and-eviction',
		source: primer('cache-aside')
	},
	{
		id: 'lru',
		term: 'LRU',
		definition:
			'Least recently used: an eviction policy that drops the cache entry that has gone longest without being used.',
		module: 'cache-strategies-and-eviction',
		source: { title: 'Wikipedia, Cache replacement policies', url: 'https://en.wikipedia.org/wiki/Cache_replacement_policies', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'acid',
		term: 'ACID',
		definition:
			'Atomicity, Consistency, Isolation, Durability: a set of properties of relational database transactions.',
		module: 'relational-and-acid',
		source: primer('relational-database-management-system-rdbms')
	},
	{
		id: 'transaction',
		term: 'Transaction',
		definition:
			'A group of database operations that is applied all together or not at all.',
		module: 'relational-and-acid',
		source: { title: 'Wikipedia, Database transaction', url: 'https://en.wikipedia.org/wiki/Database_transaction', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'replication',
		term: 'Replication',
		definition:
			'Copying data from one database node to others, so reads can be spread and a copy survives failures. Layouts are primary/replica or multi-primary.',
		module: 'replication',
		source: primer('master-slave-replication')
	},
	{
		id: 'sharding',
		term: 'Sharding',
		definition:
			'Distributing data across different databases such that each database can only manage a subset of the data.',
		module: 'federation-sharding-denormalization',
		source: primer('sharding')
	},
	{
		id: 'denormalization',
		term: 'Denormalization',
		definition:
			'Writing redundant copies of data in multiple tables to avoid expensive joins, improving reads at some cost to writes.',
		module: 'federation-sharding-denormalization',
		source: primer('denormalization')
	},
	{
		id: 'consistent-hashing',
		term: 'Consistent hashing',
		definition:
			'Placing keys and servers on a hash ring so that adding or removing a server moves only about 1/n of the keys.',
		module: 'consistent-hashing',
		source: { title: 'Wikipedia, Consistent hashing', url: 'https://en.wikipedia.org/wiki/Consistent_hashing', license: 'CC BY-SA 4.0' }
	}
];
