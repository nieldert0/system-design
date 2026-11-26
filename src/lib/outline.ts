// Single source of truth for section order, module order, titles and slugs.
// What a written module must show: the content check fails the build when it is missing.
export type Visual = 'walkthrough' | 'diagram' | 'none';
export type OutlineModule = { slug: string; title: string; visual: Visual };
export type OutlineSection = { slug: string; title: string; modules: OutlineModule[] };

const m = (slug: string, title: string, visual: Visual): OutlineModule => ({ slug, title, visual });

export const outline: OutlineSection[] = [
	{ slug: 'start-here', title: 'Start here', modules: [
		m('approach-a-design-interview', 'How to approach a design interview', 'walkthrough'),
		m('performance-vs-scalability', 'Performance vs scalability', 'walkthrough'),
		m('latency-vs-throughput', 'Latency vs throughput', 'walkthrough'),
		m('back-of-the-envelope', 'Back-of-the-envelope numbers', 'none')
	] },
	{ slug: 'networking', title: 'Networking', modules: [
		m('how-the-internet-works', 'How the internet works', 'walkthrough'),
		m('tcp-and-udp', 'TCP and UDP', 'walkthrough'),
		m('dns', 'DNS', 'walkthrough'),
		m('http-https-tls', 'HTTP, HTTPS and TLS', 'walkthrough'),
		m('real-time', 'Real-time: polling, SSE and WebSockets', 'walkthrough')
	] },
	{ slug: 'linux', title: 'Linux & the OS', modules: [
		m('processes-threads-memory', 'Processes, threads and memory', 'walkthrough'),
		m('files-permissions-shell', 'Files, permissions and the shell', 'diagram')
	] },
	{ slug: 'edge', title: 'Edge & traffic', modules: [
		m('load-balancers', 'Load balancers', 'walkthrough'),
		m('reverse-proxies-api-gateways', 'Reverse proxies and API gateways', 'walkthrough'),
		m('cdn', 'Content delivery networks', 'walkthrough')
	] },
	{ slug: 'availability', title: 'Distributed systems', modules: [
		m('cap-theorem', 'CAP theorem', 'walkthrough'),
		m('consistency-patterns', 'Consistency patterns', 'walkthrough'),
		m('availability-patterns', 'Availability patterns', 'walkthrough'),
		m('handling-failure', 'Timeouts, retries and idempotency', 'walkthrough'),
		m('consensus-and-leader-election', 'Consensus and leader election', 'walkthrough'),
		m('distributed-transactions', 'Distributed transactions', 'walkthrough'),
		m('unique-id-generation', 'Unique ID generation', 'walkthrough')
	] },
	{ slug: 'databases', title: 'Databases', modules: [
		m('relational-and-acid', 'Relational databases, ACID and isolation levels', 'walkthrough'),
		m('replication', 'Replication', 'walkthrough'),
		m('federation-sharding-denormalization', 'Federation, sharding and denormalization', 'walkthrough'),
		m('consistent-hashing', 'Consistent hashing', 'walkthrough'),
		m('indexes-and-sql-tuning', 'Indexes and SQL tuning', 'walkthrough'),
		m('storage-engines', 'Storage engines: B-trees and LSM-trees', 'walkthrough'),
		m('nosql-types', 'NoSQL types', 'diagram'),
		m('sql-vs-nosql', 'SQL vs NoSQL', 'none'),
		m('search-and-inverted-indexes', 'Search and inverted indexes', 'walkthrough'),
		m('geospatial-indexing', 'Geospatial indexing', 'walkthrough'),
		m('probabilistic-data-structures', 'Probabilistic data structures', 'walkthrough'),
		m('object-storage', 'Object storage', 'walkthrough')
	] },
	{ slug: 'caching', title: 'Caching', modules: [
		m('where-to-cache', 'Where to cache', 'walkthrough'),
		m('cache-strategies-and-eviction', 'Cache strategies and eviction', 'walkthrough')
	] },
	{ slug: 'communication', title: 'Communication', modules: [
		m('api-design', 'API design: REST, gRPC and GraphQL', 'walkthrough'),
		m('queues-and-back-pressure', 'Queues and back pressure', 'walkthrough'),
		m('pub-sub-and-event-streaming', 'Pub/sub and event streaming', 'walkthrough'),
		m('batch-and-stream-processing', 'Batch and stream processing', 'walkthrough'),
		m('rate-limiting', 'Rate limiting', 'walkthrough')
	] },
	{ slug: 'architecture', title: 'Architecture', modules: [
		m('monolith-vs-microservices', 'Monolith vs microservices vs serverless', 'diagram'),
		m('service-discovery', 'Service discovery', 'walkthrough'),
		m('event-driven-architecture', 'Event-driven architecture', 'walkthrough'),
		m('multi-region-and-disaster-recovery', 'Multi-region and disaster recovery', 'walkthrough')
	] },
	{ slug: 'security', title: 'Security', modules: [
		m('security-basics', 'Security basics', 'diagram'),
		m('authentication-and-authorization', 'Authentication and authorization', 'walkthrough')
	] },
	{ slug: 'devops', title: 'DevOps', modules: [
		m('docker', 'Docker', 'walkthrough'),
		m('kubernetes', 'Kubernetes', 'walkthrough'),
		m('ci-cd-and-deployment', 'CI/CD and deployment strategies', 'walkthrough'),
		m('observability', 'Observability', 'walkthrough')
	] },
	{ slug: 'case-studies', title: 'Case studies', modules: [
		m('url-shortener', 'Design a URL shortener', 'walkthrough'),
		m('api-rate-limiter', 'Design an API rate limiter', 'walkthrough'),
		m('typeahead', 'Design typeahead autocomplete', 'walkthrough'),
		m('notification-system', 'Design a notification system', 'walkthrough'),
		m('chat-system', 'Design a chat system', 'walkthrough'),
		m('twitter-timeline', 'Design the Twitter timeline and search', 'walkthrough'),
		m('web-crawler', 'Design a web crawler', 'walkthrough'),
		m('nearby-places', 'Design a nearby places service', 'walkthrough'),
		m('video-streaming', 'Design a video streaming service', 'walkthrough'),
		m('payment-system', 'Design a payment system', 'walkthrough'),
		m('key-value-store', 'Design a key-value store', 'walkthrough'),
		m('scaling-on-aws', 'Scale to millions of users on AWS', 'walkthrough')
	] }
];

export const allModules = outline.flatMap((s) =>
	s.modules.map((mod) => ({ ...mod, section: s.slug, sectionTitle: s.title }))
);
