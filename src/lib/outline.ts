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
	{ slug: 'availability', title: 'Availability & consistency', modules: [
		m('cap-theorem', 'CAP theorem'),
		m('consistency-patterns', 'Consistency patterns'),
		m('availability-patterns', 'Availability patterns')
	] },
	{ slug: 'databases', title: 'Databases', modules: [
		m('relational-and-acid', 'Relational databases and ACID'),
		m('replication', 'Replication'),
		m('federation-sharding-denormalization', 'Federation, sharding and denormalization'),
		m('consistent-hashing', 'Consistent hashing'),
		m('indexes-and-sql-tuning', 'Indexes and SQL tuning'),
		m('nosql-types', 'NoSQL types'),
		m('sql-vs-nosql', 'SQL vs NoSQL'),
		m('object-storage', 'Object storage')
	] },
	{ slug: 'caching', title: 'Caching', modules: [
		m('where-to-cache', 'Where to cache'),
		m('cache-strategies-and-eviction', 'Cache strategies and eviction')
	] },
	{ slug: 'communication', title: 'Communication', modules: [
		m('api-design', 'API design'),
		m('queues-and-back-pressure', 'Queues and back pressure'),
		m('pub-sub-and-event-streaming', 'Pub/sub and event streaming'),
		m('rate-limiting', 'Rate limiting')
	] },
	{ slug: 'architecture', title: 'Architecture', modules: [
		m('monolith-vs-microservices', 'Monolith vs microservices'),
		m('service-discovery', 'Service discovery')
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
		m('twitter-timeline', 'Design the Twitter timeline and search'),
		m('web-crawler', 'Design a web crawler'),
		m('scaling-on-aws', 'Scale to millions of users on AWS'),
		m('api-rate-limiter', 'Design an API rate limiter')
	] }
];

export const allModules = outline.flatMap((s) =>
	s.modules.map((mod) => ({ ...mod, section: s.slug, sectionTitle: s.title }))
);
