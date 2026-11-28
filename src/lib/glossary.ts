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
	},
	{
		id: 'bgp',
		term: 'BGP (Border Gateway Protocol)',
		definition:
			'The routing protocol networks run by different operators use to tell each other which IP address ranges they can reach, so routers across the internet can build their forwarding tables.',
		module: 'how-the-internet-works',
		source: { title: 'Wikipedia, Border Gateway Protocol', url: 'https://en.wikipedia.org/wiki/Border_Gateway_Protocol', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'nat',
		term: 'NAT (network address translation)',
		definition:
			'A router rewriting the addresses on packets as they pass, typically so many machines with private addresses share one public IP address. Machines behind NAT can open connections out but cannot easily be reached from outside.',
		module: 'how-the-internet-works',
		source: { title: 'Wikipedia, Network address translation', url: 'https://en.wikipedia.org/wiki/Network_address_translation', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'rtt',
		term: 'Round-trip time (RTT)',
		definition:
			'The time for a packet to go from one machine to another and for the reply to come back. Handshakes and request/response exchanges each cost at least one RTT.',
		module: 'how-the-internet-works',
		source: { title: 'Wikipedia, Round-trip delay', url: 'https://en.wikipedia.org/wiki/Round-trip_delay', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'head-of-line-blocking',
		term: 'Head-of-line blocking',
		definition:
			'When one delayed or lost item at the front of an ordered queue holds back everything behind it, even items that are ready. In TCP, one lost packet stalls all later bytes until it is resent.',
		module: 'tcp-and-udp',
		source: { title: 'Wikipedia, Head-of-line blocking', url: 'https://en.wikipedia.org/wiki/Head-of-line_blocking', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'congestion-control',
		term: 'Congestion control',
		definition:
			'How a TCP sender limits the data it has in flight to avoid overloading the network: it starts small, grows while data is acknowledged, and cuts back sharply when packets are lost.',
		module: 'tcp-and-udp',
		source: { title: 'Wikipedia, TCP congestion control', url: 'https://en.wikipedia.org/wiki/TCP_congestion_control', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'quic',
		term: 'QUIC',
		definition:
			'A transport protocol built on UDP that provides reliable, ordered, encrypted streams with TLS 1.3 built in. Each stream is ordered independently, avoiding TCP head-of-line blocking. HTTP/3 runs on it.',
		module: 'tcp-and-udp',
		source: { title: 'Wikipedia, QUIC', url: 'https://en.wikipedia.org/wiki/QUIC', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'connection-pooling',
		term: 'Connection pooling',
		definition:
			'Keeping a set of already-open connections (to a database or service) and lending them to requests, instead of opening and closing a connection per request, which saves handshakes and server resources.',
		module: 'tcp-and-udp',
		source: { title: 'Wikipedia, Connection pool', url: 'https://en.wikipedia.org/wiki/Connection_pool', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'recursive-resolver',
		term: 'Recursive resolver',
		definition:
			'A DNS server that answers a client by walking the DNS tree (root, top-level domain, authoritative server) on its behalf, and caches the answers for every client it serves.',
		module: 'dns',
		source: { title: 'Wikipedia, Domain Name System', url: 'https://en.wikipedia.org/wiki/Domain_Name_System', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'anycast',
		term: 'Anycast',
		definition:
			'Announcing the same IP address from many locations at once, so internet routing delivers each user to the nearest one. Used by DNS root servers, public resolvers and CDNs.',
		module: 'dns',
		source: { title: 'Wikipedia, Anycast', url: 'https://en.wikipedia.org/wiki/Anycast', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'certificate-authority',
		term: 'Certificate authority (CA)',
		definition:
			'An organisation that clients trust to sign certificates, vouching that the holder of a private key controls a given domain name. Browsers and operating systems ship a list of trusted CAs.',
		module: 'http-https-tls',
		source: { title: 'Wikipedia, Certificate authority', url: 'https://en.wikipedia.org/wiki/Certificate_authority', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'mtls',
		term: 'mTLS (mutual TLS)',
		definition:
			'TLS in which both the client and the server present certificates, so each side proves its identity to the other. Common for service-to-service traffic inside a network.',
		module: 'http-https-tls',
		source: { title: 'Wikipedia, Mutual authentication', url: 'https://en.wikipedia.org/wiki/Mutual_authentication', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'sticky-session',
		term: 'Sticky session',
		definition:
			'A load-balancer setting that keeps sending a given client to the same backend server, usually by cookie or client IP, so state held on that server stays reachable.',
		module: 'real-time',
		source: { title: 'Wikipedia, Load balancing (computing)', url: 'https://en.wikipedia.org/wiki/Load_balancing_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'health-check',
		term: 'Health check',
		definition:
			'A regular probe, such as an HTTP request to /healthz, that a load balancer sends to each server so it can stop routing traffic to servers that fail it.',
		module: 'load-balancers',
		source: { title: 'Wikipedia, Load balancing (computing)', url: 'https://en.wikipedia.org/wiki/Load_balancing_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'circuit-breaker',
		term: 'Circuit breaker',
		definition:
			'A guard that stops calling a dependency after repeated failures and fails fast for a while, giving the dependency time to recover instead of a flood of retries.',
		module: 'reverse-proxies-api-gateways',
		source: { title: 'Wikipedia, Circuit breaker design pattern', url: 'https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'origin-server',
		term: 'Origin server',
		definition:
			'Your own server that holds the original copy of content. A CDN fetches from it on a cache miss and serves cached copies to users.',
		module: 'cdn',
		source: { title: 'Wikipedia, Content delivery network', url: 'https://en.wikipedia.org/wiki/Content_delivery_network', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'cache-control',
		term: 'Cache-Control',
		definition:
			'The HTTP header that tells browsers and shared caches such as CDNs whether a response may be stored and for how long, for example max-age=86400 or private.',
		module: 'cdn',
		source: { title: 'MDN, Cache-Control', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control', license: 'CC BY-SA 2.5' }
	},
	{
		id: 'network-partition',
		term: 'Network partition',
		definition:
			'A failure in which the network splits nodes into groups that cannot reach each other, even though every node is still running. Each group has to decide whether to keep answering.',
		module: 'cap-theorem',
		source: { title: 'Wikipedia, Network partition', url: 'https://en.wikipedia.org/wiki/Network_partition', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'linearizability',
		term: 'Linearizability',
		definition:
			'The strongest single-object consistency model: the system behaves as if there were one copy of the data, so once any client sees a value, no later read returns an older one.',
		module: 'consistency-patterns',
		source: { title: 'Wikipedia, Linearizability', url: 'https://en.wikipedia.org/wiki/Linearizability', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'quorum',
		term: 'Quorum',
		definition:
			'The minimum number of replicas that must take part in a read or write for it to count, usually a majority. If write and read quorums add up to more than the replica count, every read overlaps the latest write.',
		module: 'cap-theorem',
		source: { title: 'Wikipedia, Quorum (distributed computing)', url: 'https://en.wikipedia.org/wiki/Quorum_(distributed_computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'last-write-wins',
		term: 'Last-write-wins (LWW)',
		definition:
			'A conflict rule for replicated data: when two versions of the same item collide, keep the one with the later timestamp and discard the other. Simple, but it silently loses writes.',
		module: 'cap-theorem',
		source: { title: 'Wikipedia, Eventual consistency', url: 'https://en.wikipedia.org/wiki/Eventual_consistency', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'replication-lag',
		term: 'Replication lag',
		definition:
			'How far a replica is behind the primary it copies from, measured in time or log position. Reads from a lagging replica return older data.',
		module: 'consistency-patterns',
		source: { title: 'Wikipedia, Replication (computing)', url: 'https://en.wikipedia.org/wiki/Replication_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'read-your-writes',
		term: 'Read-your-writes',
		definition:
			'A session guarantee that a user always sees their own earlier writes, even when other users may still see older data. Usually done by routing that user to the primary or an up-to-date replica.',
		module: 'consistency-patterns',
		source: { title: 'Wikipedia, Consistency model', url: 'https://en.wikipedia.org/wiki/Consistency_model', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'heartbeat',
		term: 'Heartbeat',
		definition:
			'A small periodic "I am alive" message between nodes. When several in a row go missing, the receiver assumes the sender has failed and may start a fail-over.',
		module: 'availability-patterns',
		source: { title: 'Wikipedia, Heartbeat (computing)', url: 'https://en.wikipedia.org/wiki/Heartbeat_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'split-brain',
		term: 'Split-brain',
		definition:
			'A failure where two nodes both believe they are the primary, usually because the link between them broke, and both accept writes that then conflict.',
		module: 'availability-patterns',
		source: { title: 'Wikipedia, Split-brain (computing)', url: 'https://en.wikipedia.org/wiki/Split-brain_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'fencing',
		term: 'Fencing',
		definition:
			'Stopping a node that has lost its role from doing further damage, for example by cutting its power, revoking its storage access, or rejecting writes that carry an old term number.',
		module: 'availability-patterns',
		source: { title: 'Wikipedia, Fencing (computing)', url: 'https://en.wikipedia.org/wiki/Fencing_(computing)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'write-ahead-log',
		term: 'Write-ahead log (WAL)',
		definition:
			'An append-only file where a database records every change before applying it to data pages. A commit is durable once its log record is flushed, and after a crash the log is replayed to redo committed work and undo the rest.',
		module: 'relational-and-acid',
		source: { title: 'Wikipedia, Write-ahead logging', url: 'https://en.wikipedia.org/wiki/Write-ahead_logging', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'isolation-level',
		term: 'Isolation level',
		definition:
			'How strictly a database keeps concurrent transactions from seeing each other\'s effects, from read uncommitted to serializable. Weaker levels are faster but allow anomalies such as non-repeatable reads and lost updates.',
		module: 'relational-and-acid',
		source: { title: 'Wikipedia, Isolation (database systems)', url: 'https://en.wikipedia.org/wiki/Isolation_(database_systems)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'mvcc',
		term: 'MVCC (multi-version concurrency control)',
		definition:
			'A concurrency technique where writes create new row versions instead of overwriting, and each transaction reads a consistent snapshot of committed versions, so readers and writers do not block each other.',
		module: 'relational-and-acid',
		source: { title: 'Wikipedia, Multiversion concurrency control', url: 'https://en.wikipedia.org/wiki/Multiversion_concurrency_control', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'virtual-node',
		term: 'Virtual node (vnode)',
		definition:
			'One of many positions a single physical server takes on a consistent-hashing ring, so its share of keys evens out and its keys spread across many servers if it fails.',
		module: 'consistent-hashing',
		source: { title: 'Wikipedia, Consistent hashing', url: 'https://en.wikipedia.org/wiki/Consistent_hashing', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'shard-key',
		term: 'Shard key',
		definition:
			'The column or field, such as user_id or tenant_id, that decides which shard a row lives on. A good one has many distinct values, spreads traffic evenly, and appears in most queries.',
		module: 'federation-sharding-denormalization',
		source: { title: 'Wikipedia, Shard (database architecture)', url: 'https://en.wikipedia.org/wiki/Shard_(database_architecture)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'scatter-gather',
		term: 'Scatter-gather',
		definition:
			'Sending one query to every shard or node in parallel and merging the results. Its latency is set by the slowest responder.',
		module: 'federation-sharding-denormalization',
		source: { title: 'Wikipedia, Shard (database architecture)', url: 'https://en.wikipedia.org/wiki/Shard_(database_architecture)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'b-tree',
		term: 'B-tree',
		definition:
			'A balanced tree whose nodes are disk pages holding hundreds of sorted keys, so lookups, inserts and range scans take only a few page reads even for billions of rows. The default index structure in relational databases.',
		module: 'indexes-and-sql-tuning',
		source: { title: 'Wikipedia, B-tree', url: 'https://en.wikipedia.org/wiki/B-tree', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'composite-index',
		term: 'Composite index',
		definition:
			'An index on several columns, sorted by the first column and then by each next one. It helps queries that filter on its leading columns, but not on later columns alone.',
		module: 'indexes-and-sql-tuning',
		source: { title: 'Wikipedia, Database index', url: 'https://en.wikipedia.org/wiki/Database_index', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'covering-index',
		term: 'Covering index',
		definition:
			'An index that contains every column a query needs, so the database can answer from the index alone without reading the table.',
		module: 'indexes-and-sql-tuning',
		source: { title: 'Wikipedia, Database index', url: 'https://en.wikipedia.org/wiki/Database_index', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'query-planner',
		term: 'Query planner',
		definition:
			'The part of a database that chooses how to run a query, such as which index to use and in what order to join tables, based on table statistics. EXPLAIN shows its choice.',
		module: 'indexes-and-sql-tuning',
		source: { title: 'Wikipedia, Query plan', url: 'https://en.wikipedia.org/wiki/Query_plan', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'partition-key',
		term: 'Partition key',
		definition:
			'The part of a record\'s key that a distributed database hashes to decide which nodes store it. All rows with the same partition key live together, so it sets both data locality and the risk of hotspots.',
		module: 'nosql-types',
		source: { title: 'Wikipedia, Partition (database)', url: 'https://en.wikipedia.org/wiki/Partition_(database)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'lsm-tree',
		term: 'LSM tree (log-structured merge-tree)',
		definition:
			'A storage structure that buffers writes in memory, flushes them to immutable sorted files, and merges those files in the background. Writes are sequential and fast; reads may check several files.',
		module: 'nosql-types',
		source: { title: 'Wikipedia, Log-structured merge-tree', url: 'https://en.wikipedia.org/wiki/Log-structured_merge-tree', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'schema-on-read',
		term: 'Schema-on-read',
		definition:
			'Storing records without enforcing a fixed structure, so the application decides how to interpret fields when it reads them. The opposite, schema-on-write, is how relational tables reject rows that do not match their declared columns.',
		module: 'sql-vs-nosql',
		source: { title: 'Wikipedia, Database schema', url: 'https://en.wikipedia.org/wiki/Database_schema', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'polyglot-persistence',
		term: 'Polyglot persistence',
		definition:
			'Using several kinds of database in one system, each chosen for the data and access pattern it fits best, such as PostgreSQL for orders and Redis for sessions.',
		module: 'sql-vs-nosql',
		source: { title: 'Martin Fowler, Polyglot Persistence', url: 'https://martinfowler.com/bliki/PolyglotPersistence.html', license: 'All rights reserved, cited' }
	},
	{
		id: 'multipart-upload',
		term: 'Multipart upload',
		definition:
			'Uploading one large object as many parts in parallel, retrying only failed parts, then asking the storage service to combine them into a single object.',
		module: 'object-storage',
		source: { title: 'Wikipedia, Object storage', url: 'https://en.wikipedia.org/wiki/Object_storage', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'erasure-coding',
		term: 'Erasure coding',
		definition:
			'Splitting data into fragments plus extra parity fragments, so the original can be rebuilt from any large enough subset. It survives several failed disks using much less space than full copies.',
		module: 'object-storage',
		source: { title: 'Wikipedia, Erasure code', url: 'https://en.wikipedia.org/wiki/Erasure_code', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'presigned-url',
		term: 'Pre-signed URL',
		definition:
			'A URL carrying a signature that grants one specific operation, such as uploading to one key, until a short expiry, so a client can talk to object storage directly without your credentials.',
		module: 'object-storage',
		source: { title: 'Wikipedia, Object storage', url: 'https://en.wikipedia.org/wiki/Object_storage', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'storage-class',
		term: 'Storage class',
		definition:
			'A price tier of an object store, such as S3 Standard, Standard-IA or Glacier, trading cheaper storage per GB for slower or more expensive retrieval.',
		module: 'object-storage',
		source: { title: 'Wikipedia, Object storage', url: 'https://en.wikipedia.org/wiki/Object_storage', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'buffer-pool',
		term: 'Buffer pool',
		definition:
			"The database's own in-memory cache of table and index pages. Reads served from it skip the disk; its size (shared_buffers in PostgreSQL, innodb_buffer_pool_size in MySQL) is one of the most important settings to tune.",
		module: 'where-to-cache',
		source: { title: 'PostgreSQL docs, Resource Consumption', url: 'https://www.postgresql.org/docs/current/runtime-config-resource.html', license: 'PostgreSQL License' }
	},
	{
		id: 'cache-invalidation',
		term: 'Cache invalidation',
		definition:
			'Removing or replacing a cached copy when the data behind it changes, so readers stop seeing the old value. Usually done by deleting the key on write, purging a URL, or letting a TTL expire.',
		module: 'where-to-cache',
		source: { title: 'Wikipedia, Cache invalidation', url: 'https://en.wikipedia.org/wiki/Cache_invalidation', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'grpc',
		term: 'gRPC',
		definition:
			'An open-source RPC framework from Google. Services and messages are defined in a Protocol Buffers schema, client and server code is generated from it, and calls run as binary messages over HTTP/2, with streaming in both directions.',
		module: 'api-design',
		source: { title: 'Wikipedia, GRPC', url: 'https://en.wikipedia.org/wiki/GRPC', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'protobuf',
		term: 'Protocol Buffers',
		definition:
			'A schema language and compact binary format for structured data. Each field has a number that is sent instead of its name, so messages are small, and new fields can be added without breaking old readers.',
		module: 'api-design',
		source: { title: 'Wikipedia, Protocol Buffers', url: 'https://en.wikipedia.org/wiki/Protocol_Buffers', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'graphql',
		term: 'GraphQL',
		definition:
			'A query language for APIs: the server publishes a typed schema, and the client sends one query naming exactly the fields it wants across related objects, receiving exactly that shape back.',
		module: 'api-design',
		source: { title: 'Wikipedia, GraphQL', url: 'https://en.wikipedia.org/wiki/GraphQL', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'n-plus-one',
		term: 'N+1 query problem',
		definition:
			'Running one query to fetch a list of N items and then one more query per item, so a single request costs N+1 database round trips. Fixed by batching the per-item lookups into one query.',
		module: 'api-design',
		source: { title: 'Wikipedia, Object–relational impedance mismatch', url: 'https://en.wikipedia.org/wiki/Object%E2%80%93relational_impedance_mismatch', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'cursor-pagination',
		term: 'Cursor pagination',
		definition:
			'Paging through a list by returning an opaque token that marks where the last page ended (usually its last sort key), so the next page is an index seek rather than skipping rows with OFFSET. Stays fast on deep pages and stable while rows are inserted.',
		module: 'api-design',
		source: { title: 'Wikipedia, Pagination', url: 'https://en.wikipedia.org/wiki/Pagination', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'at-least-once-delivery',
		term: 'At-least-once delivery',
		definition:
			'A messaging guarantee that every message is delivered one or more times: nothing is lost, but a consumer that crashes before acknowledging will see the same message again, so consumers must be idempotent.',
		module: 'queues-and-back-pressure',
		source: { title: 'Wikipedia, Message queue', url: 'https://en.wikipedia.org/wiki/Message_queue', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'dead-letter-queue',
		term: 'Dead-letter queue',
		definition:
			'A separate queue that receives messages which failed processing too many times, so one bad message cannot block or endlessly occupy workers. Someone inspects or replays it later.',
		module: 'queues-and-back-pressure',
		source: { title: 'Wikipedia, Dead letter queue', url: 'https://en.wikipedia.org/wiki/Dead_letter_queue', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'exponential-backoff',
		term: 'Exponential backoff',
		definition:
			'A retry policy that waits longer after each failure, typically doubling (1 s, 2 s, 4 s, ...), usually with random jitter added so many clients do not retry at the same instant.',
		module: 'queues-and-back-pressure',
		source: { title: 'Wikipedia, Exponential backoff', url: 'https://en.wikipedia.org/wiki/Exponential_backoff', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'load-shedding',
		term: 'Load shedding',
		definition:
			'Deliberately rejecting or dropping some work, usually the least important, when a system is near capacity, so the remaining work still completes in time.',
		module: 'queues-and-back-pressure',
		source: { title: "Amazon Builders' Library, Using load shedding to avoid overload", url: 'https://aws.amazon.com/builders-library/using-load-shedding-to-avoid-overload/', license: 'All rights reserved' }
	},
	{
		id: 'transactional-outbox',
		term: 'Transactional outbox',
		definition:
			'Writing a business change and an "outbox" record of the message to publish in the same database transaction, then having a separate relay publish outbox records to the broker. Avoids losing or inventing messages when the database and broker cannot share a transaction.',
		module: 'queues-and-back-pressure',
		source: { title: 'microservices.io, Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html', license: 'All rights reserved' }
	},
	{
		id: 'consumer-offset',
		term: 'Offset',
		definition:
			"A record's position number in a partition of an event log. Each consumer group commits the offset it has processed up to, so it can resume there after a restart or rewind to replay.",
		module: 'pub-sub-and-event-streaming',
		source: { title: 'Wikipedia, Apache Kafka', url: 'https://en.wikipedia.org/wiki/Apache_Kafka', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'consumer-group',
		term: 'Consumer group',
		definition:
			'A set of consumers that share reading a topic: each partition is assigned to exactly one member, so the group reads in parallel up to the partition count. Separate groups each receive every record independently.',
		module: 'pub-sub-and-event-streaming',
		source: { title: 'Wikipedia, Apache Kafka', url: 'https://en.wikipedia.org/wiki/Apache_Kafka', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'consumer-lag',
		term: 'Consumer lag',
		definition:
			'How far a consumer group is behind the newest record in a partition, measured in records (newest offset minus committed offset) or in time. The main health metric for a stream consumer.',
		module: 'pub-sub-and-event-streaming',
		source: { title: 'Wikipedia, Apache Kafka', url: 'https://en.wikipedia.org/wiki/Apache_Kafka', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'token-bucket',
		term: 'Token bucket',
		definition:
			'A rate-limiting algorithm: a bucket holds up to b tokens and refills at r per second; each request spends a token and is rejected when none are left. Allows bursts up to b while averaging at most r.',
		module: 'rate-limiting',
		source: { title: 'Wikipedia, Token bucket', url: 'https://en.wikipedia.org/wiki/Token_bucket', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'sliding-window-counter',
		term: 'Sliding window counter',
		definition:
			"A rate-limiting algorithm that estimates requests in the last window as the previous window's count weighted by its remaining overlap, plus the current window's count. Removes most of the fixed window's edge burst using two counters per key.",
		module: 'rate-limiting',
		source: { title: 'Wikipedia, Rate limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'modular-monolith',
		term: 'Modular monolith',
		definition:
			'One deployable application split internally into modules with strict boundaries, so teams own parts of it and a module can later become a service without a rewrite.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Monolithic application', url: 'https://en.wikipedia.org/wiki/Monolithic_application', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'saga',
		term: 'Saga',
		definition:
			'A business operation spanning several services, run as a sequence of local transactions where each step has a compensating action that undoes it if a later step fails.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Long-running transaction', url: 'https://en.wikipedia.org/wiki/Long-running_transaction', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'cold-start',
		term: 'Cold start',
		definition:
			'The extra latency of a serverless call when no warm execution environment exists, so the provider must start one and load your code before running it.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Serverless computing', url: 'https://en.wikipedia.org/wiki/Serverless_computing', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'strangler-fig',
		term: 'Strangler fig pattern',
		definition:
			'Migrating away from an old system piece by piece by routing one feature at a time to new code behind a proxy, until the old system can be removed.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Strangler fig pattern', url: 'https://en.wikipedia.org/wiki/Strangler_fig_pattern', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'distributed-monolith',
		term: 'Distributed monolith',
		definition:
			'Services that are deployed separately but still have to change and deploy together, often because they share a database, so they pay the costs of both styles.',
		module: 'monolith-vs-microservices',
		source: { title: 'Wikipedia, Microservices', url: 'https://en.wikipedia.org/wiki/Microservices', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'service-mesh',
		term: 'Service mesh',
		definition:
			'An infrastructure layer of proxies, one beside each service instance, that handles discovery, load balancing, retries and encryption for service-to-service calls, configured by a central control plane.',
		module: 'service-discovery',
		source: { title: 'Wikipedia, Service mesh', url: 'https://en.wikipedia.org/wiki/Service_mesh', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'sidecar',
		term: 'Sidecar',
		definition:
			'A helper process or container deployed next to each instance of a service, such as a proxy, that adds behaviour without changing the service code.',
		module: 'service-discovery',
		source: { title: 'Wikipedia, Service mesh', url: 'https://en.wikipedia.org/wiki/Service_mesh', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'srv-record',
		term: 'SRV record',
		definition: 'A DNS record that maps a service name to a host name and port, with priority and weight, so DNS can say where a service listens and not only its IP.',
		module: 'service-discovery',
		source: { title: 'Wikipedia, SRV record', url: 'https://en.wikipedia.org/wiki/SRV_record', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'kms',
		term: 'Key management service (KMS)',
		definition:
			'A managed service that creates, stores and uses encryption keys so applications never hold the master keys themselves. Examples are AWS KMS, Google Cloud KMS and HashiCorp Vault.',
		module: 'security-basics',
		source: { title: 'Wikipedia, Key management', url: 'https://en.wikipedia.org/wiki/Key_management', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'envelope-encryption',
		term: 'Envelope encryption',
		definition:
			'Encrypting data with its own data key, then encrypting that data key with a master key held in a KMS. Only the small data key ever goes to the KMS, and rotating the master key does not require re-encrypting the data.',
		module: 'security-basics',
		source: { title: 'AWS KMS Developer Guide, AWS KMS keys', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html', license: 'AWS documentation' }
	},
	{
		id: 'csp',
		term: 'Content Security Policy (CSP)',
		definition:
			'An HTTP response header that tells the browser which sources of scripts, styles and other content a page may load, so an injected script from elsewhere is refused even if escaping fails.',
		module: 'security-basics',
		source: { title: 'Wikipedia, Content Security Policy', url: 'https://en.wikipedia.org/wiki/Content_Security_Policy', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'salt',
		term: 'Salt',
		definition:
			'A random value generated per user and mixed into a password before hashing, then stored beside the hash. Identical passwords get different hashes, so an attacker must crack each user separately and precomputed tables are useless.',
		module: 'security-basics',
		source: { title: 'Wikipedia, Salt (cryptography)', url: 'https://en.wikipedia.org/wiki/Salt_(cryptography)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'waf',
		term: 'Web application firewall (WAF)',
		definition:
			'A filter in front of a web application that inspects HTTP requests and blocks those matching attack patterns, such as SQL injection or XSS payloads, or exceeding rate rules.',
		module: 'security-basics',
		source: { title: 'Wikipedia, Web application firewall', url: 'https://en.wikipedia.org/wiki/Web_application_firewall', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'csrf',
		term: 'Cross-site request forgery (CSRF)',
		definition:
			"An attack where another site makes the victim's browser send a request to your site, and the browser attaches the victim's cookies automatically. SameSite cookies and anti-CSRF tokens prevent it.",
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, Cross-site request forgery', url: 'https://en.wikipedia.org/wiki/Cross-site_request_forgery', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'jwks',
		term: 'JWKS (JSON Web Key Set)',
		definition:
			"A JSON document, usually served at a well-known URL, listing an issuer's public signing keys by key ID (kid). Services fetch and cache it to verify JWT signatures locally.",
		module: 'authentication-and-authorization',
		source: { title: 'RFC 7517, JSON Web Key', url: 'https://datatracker.ietf.org/doc/html/rfc7517', license: 'IETF Trust' }
	},
	{
		id: 'refresh-token',
		term: 'Refresh token',
		definition:
			'A long-lived credential the client exchanges at the auth server for a new short-lived access token. Because the server checks it on each exchange, revoking it ends the session within one access-token lifetime.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, OAuth', url: 'https://en.wikipedia.org/wiki/OAuth', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'pkce',
		term: 'PKCE (Proof Key for Code Exchange)',
		definition:
			'An OAuth extension where the app sends a hash of a random secret when it starts login and the secret itself when it redeems the code, so an intercepted authorization code cannot be used by anyone else.',
		module: 'authentication-and-authorization',
		source: { title: 'RFC 7636, Proof Key for Code Exchange', url: 'https://datatracker.ietf.org/doc/html/rfc7636', license: 'IETF Trust' }
	},
	{
		id: 'oidc',
		term: 'OpenID Connect (OIDC)',
		definition:
			'An identity layer on top of OAuth 2.0. Besides the access token, the app gets an ID token, a signed JWT saying who the user is, which is what powers "Sign in with ..." and single sign-on.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, OpenID', url: 'https://en.wikipedia.org/wiki/OpenID', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'abac',
		term: 'Attribute-based access control (ABAC)',
		definition:
			'Authorization by rules over attributes of the user, the object and the context, such as "owners can edit their own documents". More expressive than roles alone, but harder to audit.',
		module: 'authentication-and-authorization',
		source: { title: 'Wikipedia, Attribute-based access control', url: 'https://en.wikipedia.org/wiki/Attribute-based_access_control', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'idor',
		term: 'Insecure direct object reference (IDOR)',
		definition:
			'An access-control bug where an API takes an object ID from the request and returns the object without checking the caller may access it, so changing /invoices/1043 to /invoices/1044 shows someone else\'s data.',
		module: 'authentication-and-authorization',
		source: { title: 'OWASP Top 10, Broken Access Control', url: 'https://owasp.org/Top10/', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'linux-namespace',
		term: 'Namespace (Linux)',
		definition:
			'A kernel feature that gives a process its own view of one kind of system resource, such as process IDs, mounts, network interfaces or host name, so it cannot see what other processes see.',
		module: 'docker',
		source: { title: 'Wikipedia, Linux namespaces', url: 'https://en.wikipedia.org/wiki/Linux_namespaces', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'cgroup',
		term: 'cgroup',
		definition:
			'A Linux kernel feature (control group) that limits and accounts for how much CPU, memory and I/O a group of processes can use.',
		module: 'docker',
		source: { title: 'Wikipedia, Cgroups', url: 'https://en.wikipedia.org/wiki/Cgroups', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'image-layer',
		term: 'Image layer',
		definition:
			'One read-only filesystem change in a container image, produced by one build step and identified by a hash of its content, so it can be cached and shared between images.',
		module: 'docker',
		source: { title: 'Wikipedia, Docker (software)', url: 'https://en.wikipedia.org/wiki/Docker_(software)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'multi-stage-build',
		term: 'Multi-stage build',
		definition:
			'A Dockerfile with several stages, where build tools live in an early stage and only the finished output is copied into a small final image.',
		module: 'docker',
		source: { title: 'Wikipedia, Docker (software)', url: 'https://en.wikipedia.org/wiki/Docker_(software)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'container-registry',
		term: 'Container registry',
		definition:
			'A server that stores container images by name and tag and serves them to any machine that pulls them, such as Docker Hub or Amazon ECR.',
		module: 'docker',
		source: { title: 'Kubernetes Documentation, Images', url: 'https://kubernetes.io/docs/concepts/containers/images/', license: 'CC BY 4.0' }
	},
	{
		id: 'image-digest',
		term: 'Image digest',
		definition:
			'A SHA-256 hash of the content of an image that names one exact image; unlike a tag, it can never be moved to point at different bytes.',
		module: 'docker',
		source: { title: 'Kubernetes Documentation, Images', url: 'https://kubernetes.io/docs/concepts/containers/images/', license: 'CC BY 4.0' }
	},
	{
		id: 'oom-kill',
		term: 'OOM kill',
		definition:
			'The kernel ending a process because it ran out of memory or exceeded its cgroup memory limit; a killed container exits with code 137.',
		module: 'docker',
		source: { title: 'Wikipedia, Out of memory', url: 'https://en.wikipedia.org/wiki/Out_of_memory', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'control-plane',
		term: 'Control plane',
		definition:
			'The part of a system that makes decisions and stores configuration, such as the Kubernetes API server, etcd, scheduler and controllers, as opposed to the data plane that does the actual work.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Kubernetes Components', url: 'https://kubernetes.io/docs/concepts/overview/components/', license: 'CC BY 4.0' }
	},
	{
		id: 'resource-requests-limits',
		term: 'Resource requests and limits',
		definition:
			'Per-container settings in Kubernetes: the request is the CPU and memory the scheduler reserves for it, and the limit is the hard cap enforced at run time.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Resource Management for Pods and Containers', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/', license: 'CC BY 4.0' }
	},
	{
		id: 'reconciliation-loop',
		term: 'Reconciliation loop',
		definition:
			'A control loop that repeatedly compares the actual state of a system with the declared desired state and acts to close the gap.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Controllers', url: 'https://kubernetes.io/docs/concepts/architecture/controller/', license: 'CC BY 4.0' }
	},
	{
		id: 'liveness-probe',
		term: 'Liveness probe',
		definition:
			'A periodic Kubernetes check of whether a container is still working; after repeated failures the kubelet restarts the container.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Pod Lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/', license: 'CC BY 4.0' }
	},
	{
		id: 'readiness-probe',
		term: 'Readiness probe',
		definition:
			'A periodic Kubernetes check of whether a pod can serve traffic; a failing pod is removed from the endpoints of its Service but not restarted.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Pod Lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/', license: 'CC BY 4.0' }
	},
	{
		id: 'pod-disruption-budget',
		term: 'PodDisruptionBudget',
		definition:
			'A Kubernetes object that limits how many pods of an application can be taken down at once by voluntary actions such as node drains.',
		module: 'kubernetes',
		source: { title: 'Kubernetes Documentation, Disruptions', url: 'https://kubernetes.io/docs/concepts/workloads/pods/disruptions/', license: 'CC BY 4.0' }
	},
	{
		id: 'progressive-delivery',
		term: 'Progressive delivery',
		definition:
			'Releasing a new version to a growing share of traffic in steps, with automated metric checks that promote it or roll it back at each step.',
		module: 'ci-cd-and-deployment',
		source: { title: "Martin Fowler's bliki, Canary Release (Danilo Sato)", url: 'https://martinfowler.com/bliki/CanaryRelease.html', license: 'All rights reserved' }
	},
	{
		id: 'feature-flag',
		term: 'Feature flag',
		definition:
			'A runtime switch in the code that turns a feature on or off, for everyone or for chosen users, without deploying new code.',
		module: 'ci-cd-and-deployment',
		source: { title: 'Wikipedia, Feature toggle', url: 'https://en.wikipedia.org/wiki/Feature_toggle', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'expand-contract',
		term: 'Expand and contract',
		definition:
			'Changing a schema or interface in backward-compatible steps: add the new form, migrate readers and writers to it, and remove the old form only in a later release.',
		module: 'ci-cd-and-deployment',
		source: { title: "Martin Fowler's bliki, Parallel Change", url: 'https://martinfowler.com/bliki/ParallelChange.html', license: 'All rights reserved' }
	},
	{
		id: 'metric-cardinality',
		term: 'Cardinality (metrics)',
		definition:
			'The number of distinct time series a metric produces, one per unique combination of label values; unbounded labels such as user ID make it explode.',
		module: 'observability',
		source: { title: 'OpenTelemetry Documentation, Signals', url: 'https://opentelemetry.io/docs/concepts/signals/', license: 'CC BY 4.0' }
	},
	{
		id: 'span',
		term: 'Span',
		definition:
			'One timed operation inside a trace, such as an HTTP call or a database query, with a start time, duration, parent span and attributes.',
		module: 'observability',
		source: { title: 'OpenTelemetry Documentation, Traces', url: 'https://opentelemetry.io/docs/concepts/signals/traces/', license: 'CC BY 4.0' }
	},
	{
		id: 'tail-based-sampling',
		term: 'Tail-based sampling',
		definition:
			'Deciding whether to keep a trace after it has finished, so every slow or failed trace can be kept while most normal ones are dropped.',
		module: 'observability',
		source: { title: 'OpenTelemetry Documentation, Sampling', url: 'https://opentelemetry.io/docs/concepts/sampling/', license: 'CC BY 4.0' }
	},
	{
		id: 'sli',
		term: 'Service level indicator (SLI)',
		definition:
			'A measured number that reflects what users experience, such as the share of requests that succeed within 300 ms.',
		module: 'observability',
		source: { title: 'Wikipedia, Service level indicator', url: 'https://en.wikipedia.org/wiki/Service_level_indicator', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'slo',
		term: 'Service level objective (SLO)',
		definition:
			'A target for an SLI over a time window, such as 99.9% of requests succeeding over 30 days.',
		module: 'observability',
		source: { title: 'Wikipedia, Service-level objective', url: 'https://en.wikipedia.org/wiki/Service-level_objective', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'error-budget',
		term: 'Error budget',
		definition:
			'The amount of failure an SLO allows over its window, such as 0.1% of requests for a 99.9% target; spending it sets how fast a team can ship.',
		module: 'observability',
		source: { title: 'Google, Site Reliability Engineering Workbook, Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/', license: 'All rights reserved' }
	},
	{
		id: 'burn-rate',
		term: 'Burn rate',
		definition:
			'How fast an error budget is being spent, as the current error rate divided by the rate the SLO allows; a burn rate of 1 uses the budget exactly over the window.',
		module: 'observability',
		source: { title: 'Google, Site Reliability Engineering Workbook, Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/', license: 'All rights reserved' }
	},
	{
		id: 'virtual-memory',
		term: 'Virtual memory',
		definition:
			'Each process sees its own private address space; the kernel maps those addresses page by page onto physical RAM, or onto disk (swap) for pages nobody is using.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Virtual memory', url: 'https://en.wikipedia.org/wiki/Virtual_memory', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'context-switch',
		term: 'Context switch',
		definition:
			'The CPU saving the state of one running thread and loading another\'s. Each switch costs microseconds plus a cold CPU cache, so tens of thousands of busy threads waste real time switching.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Context switch', url: 'https://en.wikipedia.org/wiki/Context_switch', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'page-fault',
		term: 'Page fault',
		definition:
			'What happens when a process touches a memory page that is not mapped into RAM. A minor fault just maps it; a major fault reads it back from disk and costs milliseconds.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Page fault', url: 'https://en.wikipedia.org/wiki/Page_fault', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'oom-killer',
		term: 'OOM killer',
		definition:
			'The Linux kernel\'s last resort when memory runs out: it picks a process, usually the largest, and kills it with SIGKILL (exit code 137). A container hitting its own memory limit triggers it too.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Out of memory', url: 'https://en.wikipedia.org/wiki/Out_of_memory', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'copy-on-write',
		term: 'Copy-on-write',
		definition:
			'Sharing memory pages between a parent and a forked child until one of them writes, and only then copying that page. It makes fork() nearly free.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Copy-on-write', url: 'https://en.wikipedia.org/wiki/Copy-on-write', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'event-loop',
		term: 'Event loop',
		definition:
			'One thread that waits for whichever of many sockets is ready (using epoll on Linux) and runs its handler, so thousands of mostly idle connections need no thread each. CPU-heavy work on it stalls everyone.',
		module: 'processes-threads-memory',
		source: { title: 'Wikipedia, Event loop', url: 'https://en.wikipedia.org/wiki/Event_loop', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'inode',
		term: 'Inode',
		definition:
			'The on-disk record holding a file\'s metadata (owner, permissions, size, block locations). A file name is just a directory entry pointing to an inode, so one inode can have several names.',
		module: 'files-permissions-shell',
		source: { title: 'Wikipedia, Inode', url: 'https://en.wikipedia.org/wiki/Inode', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'umask',
		term: 'umask',
		definition:
			'A per-process mask of permission bits removed from every new file. With the common umask 022, a file requested as 666 is created as 644.',
		module: 'files-permissions-shell',
		source: { title: 'Wikipedia, umask', url: 'https://en.wikipedia.org/wiki/Umask', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'fail-open',
		term: 'Fail open',
		definition:
			'When a protective component such as a rate limiter cannot make its check, letting the request through rather than rejecting it, so its own outage does not block traffic. Failing closed rejects instead.',
		module: 'api-rate-limiter',
		source: { title: 'Wikipedia, Fail-safe', url: 'https://en.wikipedia.org/wiki/Fail-safe', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'fan-out-on-read',
		term: 'Fan-out on read',
		definition:
			'Building a feed at request time by fetching and merging recent posts from every followed account, so posting is one write but each read does the merge.',
		module: 'twitter-timeline',
		source: { title: 'System Design Primer, Design the Twitter timeline and search', url: 'https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md', license: 'CC BY 4.0' }
	},
	{
		id: 'inverted-index',
		term: 'Inverted index',
		definition:
			'A map from each word to the list of documents that contain it, so a keyword search looks up a few lists instead of scanning every document.',
		module: 'twitter-timeline',
		source: { title: 'Wikipedia, Inverted index', url: 'https://en.wikipedia.org/wiki/Inverted_index', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'snowflake-id',
		term: 'Snowflake ID',
		definition:
			'A 64-bit unique ID made of a millisecond timestamp, a machine id, and a per-millisecond sequence number, so servers generate IDs without coordinating and IDs sort by creation time.',
		module: 'twitter-timeline',
		source: { title: 'Wikipedia, Snowflake ID', url: 'https://en.wikipedia.org/wiki/Snowflake_ID', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'crawler-trap',
		term: 'Crawler trap',
		definition:
			'A site structure, such as an endless calendar or session ids in URLs, that generates an unbounded number of distinct URLs and can keep a crawler busy forever.',
		module: 'web-crawler',
		source: { title: 'Wikipedia, Spider trap', url: 'https://en.wikipedia.org/wiki/Spider_trap', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'bloom-filter',
		term: 'Bloom filter',
		definition:
			'A compact bit array that answers "definitely not in the set" or "probably in the set"; it never misses a member but sometimes reports a false positive, in exchange for using a few bits per item.',
		module: 'web-crawler',
		source: { title: 'Wikipedia, Bloom filter', url: 'https://en.wikipedia.org/wiki/Bloom_filter', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'robots-txt',
		term: 'robots.txt',
		definition:
			'A text file at the root of a website that tells crawlers which paths they may and may not fetch; well-behaved crawlers read and obey it before crawling the site.',
		module: 'web-crawler',
		source: { title: 'Wikipedia, robots.txt', url: 'https://en.wikipedia.org/wiki/Robots.txt', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'simhash',
		term: 'SimHash',
		definition:
			'A fingerprint, usually 64 bits, in which similar documents produce values that differ in only a few bits, so near-duplicate pages can be found by comparing fingerprints.',
		module: 'web-crawler',
		source: { title: 'Wikipedia, SimHash', url: 'https://en.wikipedia.org/wiki/SimHash', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'availability-zone',
		term: 'Availability zone',
		definition:
			'One or more data centres in a cloud region with independent power, cooling, and networking, close enough to others in the region for fast links, so a failure in one rarely affects the rest.',
		module: 'scaling-on-aws',
		source: { title: 'AWS, Regions and Availability Zones', url: 'https://aws.amazon.com/about-aws/global-infrastructure/regions_az/', license: 'All rights reserved' }
	},
	{
		id: 'jitter',
		term: 'Jitter',
		definition:
			'Randomness added to a retry delay so that many clients that failed at the same moment do not all retry at the same moment.',
		module: 'handling-failure',
		source: { title: 'AWS Builders\' Library, Timeouts, retries, and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/', license: 'All rights reserved' }
	},
	{
		id: 'retry-storm',
		term: 'Retry storm',
		definition:
			'A spike of load caused by clients retrying failed calls: each layer multiplies the attempts of the layer above, so a slow dependency receives several times its normal traffic and cannot recover.',
		module: 'handling-failure',
		source: { title: 'Google SRE book, Addressing cascading failures', url: 'https://sre.google/sre-book/addressing-cascading-failures/', license: 'CC BY-NC-ND 4.0' }
	},
	{
		id: 'deadline-propagation',
		term: 'Deadline propagation',
		definition:
			'Passing the time a request must finish by along with every downstream call, so a service stops working on a request the caller has already given up on.',
		module: 'handling-failure',
		source: { title: 'gRPC, Deadlines', url: 'https://grpc.io/docs/guides/deadlines/', license: 'CC BY 4.0' }
	},
	{
		id: 'consensus',
		term: 'Consensus',
		definition:
			'Getting a group of machines to agree on one value, or one ordered log of values, even when some of them crash or messages are delayed.',
		module: 'consensus-and-leader-election',
		source: { title: 'Wikipedia, Consensus (computer science)', url: 'https://en.wikipedia.org/wiki/Consensus_(computer_science)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'raft',
		term: 'Raft',
		definition:
			'A consensus algorithm built around one elected leader per numbered term, which appends entries to its log and commits each one once a majority of nodes has stored it.',
		module: 'consensus-and-leader-election',
		source: { title: 'The Raft consensus algorithm', url: 'https://raft.github.io/', license: 'CC BY 3.0' }
	},
	{
		id: 'leader-election',
		term: 'Leader election',
		definition:
			'Choosing exactly one node in a group to act as coordinator, and choosing a new one when it fails, so that only one node makes decisions at a time.',
		module: 'consensus-and-leader-election',
		source: { title: 'Wikipedia, Leader election', url: 'https://en.wikipedia.org/wiki/Leader_election', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'lease',
		term: 'Lease',
		definition:
			'A lock that expires on its own after a set time unless its holder renews it, so a crashed holder cannot block everyone else forever.',
		module: 'consensus-and-leader-election',
		source: { title: 'Wikipedia, Lease (computer science)', url: 'https://en.wikipedia.org/wiki/Lease_(computer_science)', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'two-phase-commit',
		term: 'Two-phase commit (2PC)',
		definition:
			'A protocol where a coordinator first asks every participant to prepare and promise it can commit, then tells all of them to commit only if every one said yes.',
		module: 'distributed-transactions',
		source: { title: 'Wikipedia, Two-phase commit protocol', url: 'https://en.wikipedia.org/wiki/Two-phase_commit_protocol', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'compensating-transaction',
		term: 'Compensating transaction',
		definition:
			'An action that semantically undoes an earlier committed step, such as a refund for a charge, used because the original commit cannot be rolled back.',
		module: 'distributed-transactions',
		source: { title: 'Microsoft, Compensating Transaction pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction', license: 'CC BY 4.0' }
	},
	{
		id: 'uuid',
		term: 'UUID',
		definition:
			'A 128-bit identifier written as 32 hex digits. Version 4 is almost entirely random; version 7 puts a millisecond timestamp in the first 48 bits so IDs sort by creation time.',
		module: 'unique-id-generation',
		source: { title: 'RFC 9562, Universally Unique IDentifiers', url: 'https://www.rfc-editor.org/rfc/rfc9562', license: 'IETF Trust' }
	},
	{
		id: 'clock-skew',
		term: 'Clock skew',
		definition:
			'The difference between the clocks of two machines at the same instant. NTP keeps it to milliseconds, but it is never zero, and a clock can even jump backwards.',
		module: 'unique-id-generation',
		source: { title: 'Wikipedia, Clock skew', url: 'https://en.wikipedia.org/wiki/Clock_skew', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'ticket-server',
		term: 'Ticket server',
		definition:
			'A small database whose only job is to hand out the next number from an auto-increment counter, giving globally unique, increasing IDs from one place.',
		module: 'unique-id-generation',
		source: { title: 'Flickr, Ticket servers: distributed unique primary keys on the cheap', url: 'https://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/', license: 'All rights reserved' }
	},
	id: 'geohash',
	term: 'Geohash',
	definition: 'A short base32 string that encodes a latitude and longitude by interleaving bits from repeatedly halving each range; strings that share a prefix lie in the same rectangular cell.',
	module: 'geospatial-indexing',
	source: { title: 'Wikipedia, Geohash', url: 'https://en.wikipedia.org/wiki/Geohash', license: 'CC BY-SA 4.0' }
},
{
	id: 'space-filling-curve',
	term: 'Space-filling curve',
	definition: 'A path that visits every cell of a 2D grid once, giving each cell a single number so that nearby cells usually get nearby numbers and can be stored in a one-dimensional index.',
	module: 'geospatial-indexing',
	source: { title: 'Wikipedia, Space-filling curve', url: 'https://en.wikipedia.org/wiki/Space-filling_curve', license: 'CC BY-SA 4.0' }
},
{
	id: 'quadtree',
	term: 'Quadtree',
	definition: 'A tree that splits a square region into four equal quadrants whenever it holds more than a set number of points, so dense areas get small cells and empty areas stay as large ones.',
	module: 'geospatial-indexing',
	source: { title: 'Wikipedia, Quadtree', url: 'https://en.wikipedia.org/wiki/Quadtree', license: 'CC BY-SA 4.0' }
},
{
	id: 'r-tree',
	term: 'R-tree',
	definition: 'A balanced tree for spatial data in which each node stores the bounding rectangle of everything beneath it, so a search descends only into rectangles that overlap the query.',
	module: 'geospatial-indexing',
	source: { title: 'Wikipedia, R-tree', url: 'https://en.wikipedia.org/wiki/R-tree', license: 'CC BY-SA 4.0' }
},
	{
	id: 'false-positive',
	term: 'False positive',
	definition: 'A result that wrongly says yes, such as a Bloom filter reporting that an item may be in the set when it was never added. Its rate is the share of absent items that get a yes.',
	module: 'probabilistic-data-structures',
	source: { title: 'Wikipedia, False positives and false negatives', url: 'https://en.wikipedia.org/wiki/False_positives_and_false_negatives', license: 'CC BY-SA 4.0' }
},
{
	id: 'hyperloglog',
	term: 'HyperLogLog',
	definition: 'A sketch that estimates how many distinct items a stream contains from the longest runs of leading zeros in item hashes, spread over many registers. Error is about 1.04/√m for m registers; Redis uses 12 KB for 0.81%.',
	module: 'probabilistic-data-structures',
	source: { title: 'Wikipedia, HyperLogLog', url: 'https://en.wikipedia.org/wiki/HyperLogLog', license: 'CC BY-SA 4.0' }
},
{
	id: 'count-min-sketch',
	term: 'Count-min sketch',
	definition: 'A grid of counters with one hash function per row that estimates how often each item occurs in a stream. It takes the minimum of an item\'s counters, so it never undercounts and overcounts by at most a small fraction of the whole stream.',
	module: 'probabilistic-data-structures',
	source: { title: 'Wikipedia, Count–min sketch', url: 'https://en.wikipedia.org/wiki/Count%E2%80%93min_sketch', license: 'CC BY-SA 4.0' }
},
{
	id: 'cuckoo-filter',
	term: 'Cuckoo filter',
	definition: 'A set-membership filter like a Bloom filter that stores short fingerprints in a cuckoo hash table, so it also supports deleting items. Inserts can fail when the table is nearly full.',
	module: 'probabilistic-data-structures',
	source: { title: 'Wikipedia, Cuckoo filter', url: 'https://en.wikipedia.org/wiki/Cuckoo_filter', license: 'CC BY-SA 4.0' }
},
{
	id: 'heavy-hitters',
	term: 'Heavy hitters',
	definition: 'The items that occur most often in a stream, the top k. Found approximately with a count-min sketch plus a heap, or with counter algorithms such as Misra-Gries and Space-Saving.',
	module: 'probabilistic-data-structures',
	source: { title: 'Wikipedia, Streaming algorithm (heavy hitters)', url: 'https://en.wikipedia.org/wiki/Streaming_algorithm#Heavy_hitters', license: 'CC BY-SA 4.0' }
},
	{
		id: 'stemming',
		term: 'Stemming',
		definition:
			'Cutting words down to a common root with rules, so "running" and "runs" both become "run" and match each other in search.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Wikipedia, Stemming', url: 'https://en.wikipedia.org/wiki/Stemming', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'stop-word',
		term: 'Stop word',
		definition:
			'A very common word such as "the" or "of" that a search analyzer may drop because it appears in almost every document and says little about any of them.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Wikipedia, Stop word', url: 'https://en.wikipedia.org/wiki/Stop_word', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'posting-list',
		term: 'Posting list',
		definition:
			'The sorted list of document ids, with term frequencies and positions, stored for one term in an inverted index.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Manning, Raghavan and Schütze, Introduction to Information Retrieval', url: 'https://nlp.stanford.edu/IR-book/', license: 'Book, cited' }
	},
	{
		id: 'tf-idf',
		term: 'TF-IDF',
		definition:
			'A relevance score that multiplies how often a term appears in a document (term frequency) by how rare it is across all documents (inverse document frequency).',
		module: 'search-and-inverted-indexes',
		source: { title: 'Wikipedia, tf-idf', url: 'https://en.wikipedia.org/wiki/Tf%E2%80%93idf', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'bm25',
		term: 'BM25',
		definition:
			'The standard search ranking formula: like TF-IDF, but repeated terms saturate and long documents are normalised by their length. Default in Lucene and Elasticsearch.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Wikipedia, Okapi BM25', url: 'https://en.wikipedia.org/wiki/Okapi_BM25', license: 'CC BY-SA 4.0' }
	},
	{
		id: 'index-segment',
		term: 'Index segment',
		definition:
			'An immutable, self-contained piece of a Lucene index. New documents go into new segments, and background merges combine small segments into larger ones.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Elasticsearch Reference, Near real-time search', url: 'https://www.elastic.co/docs/manage-data/data-store/near-real-time-search', license: 'Docs, cited' }
	},
	{
		id: 'near-real-time-search',
		term: 'Near-real-time search',
		definition:
			'Search where a written document becomes visible after a short delay, the next refresh (about one second by default in Elasticsearch), rather than instantly.',
		module: 'search-and-inverted-indexes',
		source: { title: 'Elasticsearch Reference, Near real-time search', url: 'https://www.elastic.co/docs/manage-data/data-store/near-real-time-search', license: 'Docs, cited' }
	},
	{
	id: 'memtable',
	term: 'Memtable',
	definition: 'The sorted, in-memory buffer where an LSM-tree places new writes before flushing them to disk as an SSTable.',
	module: 'storage-engines',
	source: { title: 'Wikipedia, Log-structured merge-tree', url: 'https://en.wikipedia.org/wiki/Log-structured_merge-tree', license: 'CC BY-SA 4.0' }
},
{
	id: 'sstable',
	term: 'SSTable',
	definition: 'Sorted string table: an immutable file of key-value pairs sorted by key, the on-disk unit of an LSM-tree.',
	module: 'storage-engines',
	source: { title: 'RocksDB wiki, A Tutorial of RocksDB SST formats', url: 'https://github.com/facebook/rocksdb/wiki/A-Tutorial-of-RocksDB-SST-formats', license: 'GPLv2 / Apache 2.0' }
},
{
	id: 'compaction',
	term: 'Compaction',
	definition: 'Background merging of SSTables into fewer, larger ones, keeping only the newest version of each key and dropping deleted keys.',
	module: 'storage-engines',
	source: { title: 'RocksDB wiki, Compaction', url: 'https://github.com/facebook/rocksdb/wiki/Compaction', license: 'GPLv2 / Apache 2.0' }
},
{
	id: 'write-amplification',
	term: 'Write amplification',
	definition: 'Bytes physically written to disk divided by bytes the application asked to write.',
	module: 'storage-engines',
	source: { title: 'Wikipedia, Write amplification', url: 'https://en.wikipedia.org/wiki/Write_amplification', license: 'CC BY-SA 4.0' }
},
{
	id: 'tombstone',
	term: 'Tombstone',
	definition: 'A marker written in place of a deleted key in an append-only store; the key and marker are removed later by compaction.',
	module: 'storage-engines',
	source: { title: 'Wikipedia, Tombstone (data store)', url: 'https://en.wikipedia.org/wiki/Tombstone_(data_store)', license: 'CC BY-SA 4.0' }
}
];
