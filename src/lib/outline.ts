// Single source of truth for section order, module order, titles and slugs.
export type OutlineModule = { slug: string; title: string };
export type OutlineSection = { slug: string; title: string; modules: OutlineModule[] };

const m = (slug: string, title: string): OutlineModule => ({ slug, title });

export const outline: OutlineSection[] = [
	{ slug: 'start-here', title: 'Start here', modules: [
		m('approach-a-design-interview', 'How to approach a design interview'),
		m('performance-vs-scalability', 'Performance vs scalability'),
		m('latency-vs-throughput', 'Latency vs throughput'),
		m('back-of-the-envelope', 'Back-of-the-envelope numbers')
	] },
	{ slug: 'networking', title: 'Networking', modules: [
		m('how-the-internet-works', 'How the internet works'),
		m('tcp-and-udp', 'TCP and UDP'),
		m('dns', 'DNS'),
		m('http-https-tls', 'HTTP, HTTPS and TLS'),
		m('real-time', 'Real-time: polling, SSE and WebSockets')
	] },
	{ slug: 'linux', title: 'Linux & the OS', modules: [
		m('processes-threads-memory', 'Processes, threads and memory'),
		m('files-permissions-shell', 'Files, permissions and the shell')
	] },
	{ slug: 'edge', title: 'Edge & traffic', modules: [
		m('load-balancers', 'Load balancers'),
		m('reverse-proxies-api-gateways', 'Reverse proxies and API gateways'),
		m('cdn', 'Content delivery networks')
	] },
	{ slug: 'availability', title: 'Distributed systems', modules: [
		m('cap-theorem', 'CAP theorem'),
		m('consistency-patterns', 'Consistency patterns'),
		m('availability-patterns', 'Availability patterns'),
		m('handling-failure', 'Timeouts, retries and idempotency'),
		m('consensus-and-leader-election', 'Consensus and leader election'),
		m('distributed-transactions', 'Distributed transactions'),
		m('unique-id-generation', 'Unique ID generation')
	] },
	{ slug: 'databases', title: 'Databases', modules: [
		m('relational-and-acid', 'Relational databases, ACID and isolation levels'),
		m('replication', 'Replication'),
		m('federation-sharding-denormalization', 'Federation, sharding and denormalization'),
		m('consistent-hashing', 'Consistent hashing'),
		m('indexes-and-sql-tuning', 'Indexes and SQL tuning'),
		m('storage-engines', 'Storage engines: B-trees and LSM-trees'),
		m('nosql-types', 'NoSQL types'),
		m('sql-vs-nosql', 'SQL vs NoSQL'),
		m('search-and-inverted-indexes', 'Search and inverted indexes'),
		m('geospatial-indexing', 'Geospatial indexing'),
		m('probabilistic-data-structures', 'Probabilistic data structures'),
		m('object-storage', 'Object storage')
	] },
	{ slug: 'caching', title: 'Caching', modules: [
		m('where-to-cache', 'Where to cache'),
		m('cache-strategies-and-eviction', 'Cache strategies and eviction')
	] },
	{ slug: 'communication', title: 'Communication', modules: [
		m('api-design', 'API design: REST, gRPC and GraphQL'),
		m('queues-and-back-pressure', 'Queues and back pressure'),
		m('pub-sub-and-event-streaming', 'Pub/sub and event streaming'),
		m('batch-and-stream-processing', 'Batch and stream processing'),
		m('rate-limiting', 'Rate limiting')
	] },
	{ slug: 'architecture', title: 'Architecture', modules: [
		m('monolith-vs-microservices', 'Monolith vs microservices vs serverless'),
		m('service-discovery', 'Service discovery'),
		m('event-driven-architecture', 'Event-driven architecture'),
		m('multi-region-and-disaster-recovery', 'Multi-region and disaster recovery')
	] },
	{ slug: 'security', title: 'Security', modules: [
		m('security-basics', 'Security basics'),
		m('authentication-and-authorization', 'Authentication and authorization')
	] },
	{ slug: 'devops', title: 'DevOps', modules: [
		m('docker', 'Docker'),
		m('kubernetes', 'Kubernetes'),
		m('ci-cd-and-deployment', 'CI/CD and deployment strategies'),
		m('observability', 'Observability')
	] },
	{ slug: 'case-studies', title: 'Case studies', modules: [
		m('url-shortener', 'Design a URL shortener'),
		m('api-rate-limiter', 'Design an API rate limiter'),
		m('typeahead', 'Design typeahead autocomplete'),
		m('notification-system', 'Design a notification system'),
		m('chat-system', 'Design a chat system'),
		m('twitter-timeline', 'Design the Twitter timeline and search'),
		m('web-crawler', 'Design a web crawler'),
		m('nearby-places', 'Design a nearby places service'),
		m('video-streaming', 'Design a video streaming service'),
		m('payment-system', 'Design a payment system'),
		m('key-value-store', 'Design a key-value store'),
		m('scaling-on-aws', 'Scale to millions of users on AWS')
	] }
];

export const allModules = outline.flatMap((s) =>
	s.modules.map((mod) => ({ ...mod, section: s.slug, sectionTitle: s.title }))
);
