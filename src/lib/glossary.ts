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
	},
	{
		id: 'index',
		term: 'Index',
		definition:
			'An extra data structure, usually a B-tree, that lets a database find rows without scanning the whole table.',
		module: 'indexes-and-sql-tuning',
		source: { title: 'Wikipedia, Database index', url: 'https://en.wikipedia.org/wiki/Database_index', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'nosql',
		term: 'NoSQL',
		definition:
			'A collection of data items represented in a key-value store, document store, wide column store, or a graph database.',
		module: 'nosql-types',
		source: primer('nosql')
	},
	{
		id: 'base',
		term: 'BASE',
		definition:
			'Basically available, soft state, eventual consistency: properties often used to describe NoSQL databases, choosing availability over consistency.',
		module: 'nosql-types',
		source: primer('nosql')
	},
	{
		id: 'object-storage',
		term: 'Object storage',
		definition:
			'Storage for whole files (objects) addressed by a key, with metadata, in a flat namespace, such as Amazon S3.',
		module: 'object-storage',
		source: { title: 'Wikipedia, Object storage', url: 'https://en.wikipedia.org/wiki/Object_storage', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'rest',
		term: 'REST',
		definition:
			'An architectural style where clients act on resources, identified by URIs, using a uniform set of verbs; communication is stateless and cacheable.',
		module: 'api-design',
		source: primer('representational-state-transfer-rest')
	},
	{
		id: 'rpc',
		term: 'RPC',
		definition:
			'Remote procedure call: a client causes a procedure to execute on a remote server, coded as if it were a local call.',
		module: 'api-design',
		source: primer('remote-procedure-call-rpc')
	},
	{
		id: 'idempotency-key',
		term: 'Idempotency key',
		definition:
			'A unique id the client sends with a request so the server can recognise retries and return the original result instead of repeating the action.',
		module: 'api-design',
		source: { title: 'Wikipedia, Idempotence', url: 'https://en.wikipedia.org/wiki/Idempotence', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'message-queue',
		term: 'Message queue',
		definition:
			'A service that receives, holds, and delivers messages, so work can be processed in the background.',
		module: 'queues-and-back-pressure',
		source: primer('message-queues')
	},
	{
		id: 'back-pressure',
		term: 'Back pressure',
		definition:
			'Limiting a queue size so jobs already queued keep good throughput, and telling clients to retry later when it is full.',
		module: 'queues-and-back-pressure',
		source: primer('back-pressure')
	},
	{
		id: 'pub-sub',
		term: 'Pub/sub',
		definition:
			'Publish-subscribe: publishers send messages to topics and every subscriber of a topic receives a copy, without either side knowing the other.',
		module: 'pub-sub-and-event-streaming',
		source: { title: 'Wikipedia, Publish-subscribe pattern', url: 'https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'rate-limiting',
		term: 'Rate limiting',
		definition:
			'Capping how many requests a client may make in a period, to protect a service from overload and abuse.',
		module: 'rate-limiting',
		source: { title: 'Wikipedia, Rate limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'monolith',
		term: 'Monolith',
		definition:
			'An application built and deployed as a single unit, with all its features in one codebase and usually one process.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Monolithic application', url: 'https://en.wikipedia.org/wiki/Monolithic_application', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'microservices',
		term: 'Microservices',
		definition:
			'An architecture that splits an application into small, independently deployable services, each owning one business capability and its own data.',
		module: 'monolith-vs-microservices',
		source: primer('microservices')
	},
	{
		id: 'serverless',
		term: 'Serverless',
		definition:
			'A model where the cloud provider runs your functions on demand, scales them (down to zero) and bills per use; you manage no servers.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Serverless computing', url: 'https://en.wikipedia.org/wiki/Serverless_computing', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'service-discovery',
		term: 'Service discovery',
		definition:
			'Automatically finding the network addresses of healthy instances of a service, usually through a service registry.',
		module: 'service-discovery',
		source: primer('service-discovery')
	},
	{
		id: 'service-registry',
		term: 'Service registry',
		definition:
			'A database of services and their live instances, kept current by registration and health checks; e.g. Consul, etcd, ZooKeeper.',
		module: 'service-discovery',
		source: primer('service-discovery')
	},
	{
		id: 'least-privilege',
		term: 'Least privilege',
		definition:
			'Giving every user, service and process only the access it needs to do its job.',
		module: 'security-basics',
		source: { title: 'Wikipedia, Principle of least privilege', url: 'https://en.wikipedia.org/wiki/Principle_of_least_privilege', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'sql-injection',
		term: 'SQL injection',
		definition:
			'An attack where user input is interpreted as SQL; prevented with parameterised queries.',
		module: 'security-basics',
		source: { title: 'OWASP Cheat Sheet Series, SQL Injection Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'xss',
		term: 'XSS',
		definition:
			'Cross-site scripting: an attacker gets their script to run in the browsers of other users of your site; prevented by escaping output and a Content Security Policy.',
		module: 'security-basics',
		source: { title: 'OWASP Cheat Sheet Series, Cross Site Scripting Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'authentication',
		term: 'Authentication',
		definition:
			'Proving who a user or service is, such as with a password, one-time code or certificate.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, Authentication', url: 'https://en.wikipedia.org/wiki/Authentication', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'authorization',
		term: 'Authorization',
		definition:
			'Deciding what an authenticated identity is allowed to do.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, Authorization', url: 'https://en.wikipedia.org/wiki/Authorization', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'jwt',
		term: 'JWT',
		definition:
			'JSON Web Token: a compact, signed JSON object carrying claims such as user ID and expiry, verifiable without a lookup.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, JSON Web Token', url: 'https://en.wikipedia.org/wiki/JSON_Web_Token', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'oauth',
		term: 'OAuth 2.0',
		definition:
			'A protocol that lets a user grant an app limited access to their data on another service without sharing their password.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, OAuth', url: 'https://en.wikipedia.org/wiki/OAuth', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'rbac',
		term: 'RBAC',
		definition:
			'Role-based access control: permissions are given to roles, and users are given roles.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, Role-based access control', url: 'https://en.wikipedia.org/wiki/Role-based_access_control', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'container',
		term: 'Container',
		definition:
			'An isolated process that shares the host kernel but has its own filesystem, network and process view.',
		module: 'docker',
		source: { title: 'Wikipedia, OS-level virtualization', url: 'https://en.wikipedia.org/wiki/OS-level_virtualization', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'container-image',
		term: 'Container image',
		definition:
			'A read-only package of an app with its libraries and settings, from which containers are started.',
		module: 'docker',
		source: { title: 'Kubernetes Documentation, Containers', url: 'https://kubernetes.io/docs/concepts/containers/', license: 'CC BY 4.0' }
	},
	{
		id: 'kubernetes',
		term: 'Kubernetes',
		definition:
			'An open-source platform that runs containers across a cluster, keeping the actual state matched to the declared desired state.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Overview', url: 'https://kubernetes.io/docs/concepts/overview/', license: 'CC BY 4.0' }
	},
	{
		id: 'pod',
		term: 'Pod',
		definition:
			'The smallest deployable unit in Kubernetes: one or more containers that share a network address and storage.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Pods', url: 'https://kubernetes.io/docs/concepts/workloads/pods/', license: 'CC BY 4.0' }
	},
	{
		id: 'ci-cd',
		term: 'CI/CD',
		definition:
			'Continuous integration and continuous delivery or deployment: automatically building, testing and releasing every change.',
		module: 'ci-cd-and-deployment',
		source: { title: 'Wikipedia, Continuous integration', url: 'https://en.wikipedia.org/wiki/Continuous_integration', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'blue-green',
		term: 'Blue-green deployment',
		definition:
			'Running two identical environments and switching traffic from the old (blue) to the new (green) at once, so rollback is a switch back.',
		module: 'ci-cd-and-deployment',
		source: { title: 'Wikipedia, Blue–green deployment', url: 'https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'canary-release',
		term: 'Canary release',
		definition:
			'Sending a small share of traffic to a new version first and widening it while metrics stay healthy.',
		module: 'ci-cd-and-deployment',
		source: { title: 'Martin Fowler, Canary Release', url: 'https://martinfowler.com/bliki/CanaryRelease.html', license: 'All rights reserved' }
	},
	{
		id: 'observability',
		term: 'Observability',
		definition:
			'The ability to understand a system from its outputs (logs, metrics and traces) and answer new questions without shipping new code.',
		module: 'observability',
		source: { title: 'OpenTelemetry Documentation, Observability primer', url: 'https://opentelemetry.io/docs/concepts/observability-primer/', license: 'CC BY 4.0' }
	},
	{
		id: 'distributed-tracing',
		term: 'Distributed tracing',
		definition:
			'Following one request across services as a trace: a tree of spans, linked by a trace ID passed in request headers.',
		module: 'observability',
		source: { title: 'OpenTelemetry Documentation, Traces', url: 'https://opentelemetry.io/docs/concepts/signals/traces/', license: 'CC BY 4.0' }
	},
	{
		id: 'base62',
		term: 'Base62',
		definition:
			'Writing a number with the 62 characters 0-9, a-z and A-Z, so a large ID becomes a short, URL-safe key.',
		module: 'url-shortener',
		source: { title: 'System Design Primer, Design Pastebin.com (or Bit.ly)', url: 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/pastebin/README.md', license: 'CC BY 4.0' }
	},
	{
		id: 'fan-out-on-write',
		term: 'Fan-out on write',
		definition:
			"Copying a new post into every follower's precomputed feed when it is written, so reading a feed is one lookup.",
		module: 'twitter-timeline',
		source: { title: 'System Design Primer, Design the Twitter timeline and search', url: 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md', license: 'CC BY 4.0' }
	},
	{
		id: 'url-frontier',
		term: 'URL frontier',
		definition:
			'The queue of URLs a web crawler has found but not yet fetched, usually split per host to stay polite.',
		module: 'web-crawler',
		source: { title: 'Wikipedia, Web crawler', url: 'https://en.wikipedia.org/wiki/Web_crawler', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'autoscaling',
		term: 'Autoscaling',
		definition:
			'Adding or removing servers automatically as load changes, based on metrics such as CPU or request rate.',
		module: 'scaling-on-aws',
		source: { title: 'Wikipedia, Autoscaling', url: 'https://en.wikipedia.org/wiki/Autoscaling', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'fixed-window-counter',
		term: 'Fixed window counter',
		definition:
			'A rate-limiting algorithm that counts requests per caller in fixed time windows and rejects them once the count passes the limit.',
		module: 'api-rate-limiter',
		source: { title: 'Wikipedia, Rate limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'hit-ratio',
		term: 'Hit ratio',
		definition:
			'The share of reads a cache answers without going to the backing store. The miss ratio (1 minus the hit ratio) is the share that reaches the database.',
		module: 'cache-strategies-and-eviction',
		source: { title: 'Wikipedia, Cache (computing)', url: 'https://en.wikipedia.org/wiki/Cache_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'thundering-herd',
		term: 'Thundering herd',
		definition:
			'When a popular cache entry expires and many requests miss at the same moment, all of them query the database for the same data at once. Also called a cache stampede.',
		module: 'cache-strategies-and-eviction',
		source: { title: 'Wikipedia, Cache stampede', url: 'https://en.wikipedia.org/wiki/Cache_stampede', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'request-coalescing',
		term: 'Request coalescing',
		definition:
			'Letting only the first of many identical concurrent requests do the expensive work (such as a database read) while the others wait for and share its result.',
		module: 'cache-strategies-and-eviction',
		source: { title: 'Wikipedia, Cache stampede', url: 'https://en.wikipedia.org/wiki/Cache_stampede', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'functional-requirements',
		term: 'Functional requirements',
		definition:
			'What a system must do: the features and behaviours users rely on, such as \'shorten a URL\' or \'redirect on visit\'.',
		module: 'approach-a-design-interview',
		source: { title: 'Wikipedia, Functional requirement', url: 'https://en.wikipedia.org/wiki/Functional_requirement', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'non-functional-requirements',
		term: 'Non-functional requirements',
		definition:
			'How well a system must do its job: targets for scale, latency, availability, durability, consistency and cost.',
		module: 'approach-a-design-interview',
		source: { title: 'Wikipedia, Non-functional requirement', url: 'https://en.wikipedia.org/wiki/Non-functional_requirement', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'percentile',
		term: 'Percentile (p50, p99)',
		definition:
			'The value below which a given share of measurements fall. p99 latency is the time that 99% of requests beat, so it describes the slowest 1 in 100.',
		module: 'latency-vs-throughput',
		source: { title: 'Wikipedia, Percentile', url: 'https://en.wikipedia.org/wiki/Percentile', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'tail-latency',
		term: 'Tail latency',
		definition:
			'The latency of the slowest requests, usually p99 or above. It dominates user experience when one action fans out to many services.',
		module: 'latency-vs-throughput',
		source: { title: 'The Tail at Scale (Dean and Barroso)', url: 'https://research.google/pubs/the-tail-at-scale/', license: 'Cited, not copied' }
	},
	{
		id: 'hedged-requests',
		term: 'Hedged requests',
		definition:
			'Sending a duplicate request to a second replica when the first has not answered within a short deadline, and using whichever reply arrives first, to cut tail latency.',
		module: 'latency-vs-throughput',
		source: { title: 'The Tail at Scale (Dean and Barroso)', url: 'https://research.google/pubs/the-tail-at-scale/', license: 'Cited, not copied' }
	},
	{
		id: 'utilisation',
		term: 'Utilisation',
		definition:
			'The fraction of time a resource such as a CPU core or disk is busy. Queueing delay rises sharply as utilisation approaches 100%.',
		module: 'latency-vs-throughput',
		source: { title: 'Wikipedia, Queueing theory', url: 'https://en.wikipedia.org/wiki/Queueing_theory', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'vertical-scaling',
		term: 'Vertical scaling',
		definition:
			'Adding capacity by making one machine bigger (more CPU, memory or faster disks) instead of adding machines. Also called scaling up.',
		module: 'performance-vs-scalability',
		source: { title: 'Wikipedia, Scalability', url: 'https://en.wikipedia.org/wiki/Scalability', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'stateless',
		term: 'Stateless service',
		definition:
			'A service whose servers keep no per-user data between requests, so any copy can handle any request and copies can be added or removed freely.',
		module: 'performance-vs-scalability',
		source: { title: 'Wikipedia, Stateless protocol', url: 'https://en.wikipedia.org/wiki/Stateless_protocol', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'amdahls-law',
		term: "Amdahl's law",
		definition:
			'The overall speed-up from parallelising work is limited by the part that cannot be parallelised: with a serial fraction s, the speed-up can never exceed 1/s.',
		module: 'performance-vs-scalability',
		source: { title: "Wikipedia, Amdahl's law", url: 'https://en.wikipedia.org/wiki/Amdahl%27s_law', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'connection-pool',
		term: 'Connection pool',
		definition:
			'A set of open database connections that many application threads share and reuse, so the database is not overwhelmed by opening one connection per request.',
		module: 'performance-vs-scalability',
		source: { title: 'Wikipedia, Connection pool', url: 'https://en.wikipedia.org/wiki/Connection_pool', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'order-of-magnitude',
		term: 'Order of magnitude',
		definition:
			'A factor of ten. Estimates aim to land within the right order of magnitude (100 vs 1,000), not on an exact figure.',
		module: 'back-of-the-envelope',
		source: { title: 'Wikipedia, Order of magnitude', url: 'https://en.wikipedia.org/wiki/Order_of_magnitude', license: 'CC BY-SA 4.0' }
	}
];
