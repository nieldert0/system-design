// Three hand-picked study lists, after the System Design Primer's study guide:
// every timeline aims for breadth; longer ones add depth and more case studies (some, many, most).
import type { Tier } from './progress.ts';
import { allModules } from './outline.ts';

export type StudyTier = { id: Tier; label: string; summary: string; slugs: string[] };

const short = [
	'approach-a-design-interview', 'performance-vs-scalability', 'latency-vs-throughput', 'back-of-the-envelope',
	'dns', 'http-https-tls', 'load-balancers', 'cdn', 'cap-theorem', 'replication',
	'federation-sharding-denormalization', 'sql-vs-nosql', 'where-to-cache', 'cache-strategies-and-eviction',
	'api-design', 'queues-and-back-pressure', 'url-shortener', 'api-rate-limiter'
];

const medium = [
	...short.slice(0, 4), 'how-the-internet-works', 'tcp-and-udp', 'dns', 'http-https-tls', 'real-time',
	'load-balancers', 'reverse-proxies-api-gateways', 'cdn', 'cap-theorem', 'consistency-patterns',
	'availability-patterns', 'relational-and-acid', 'replication', 'federation-sharding-denormalization',
	'consistent-hashing', 'indexes-and-sql-tuning', 'nosql-types', 'sql-vs-nosql', 'where-to-cache',
	'cache-strategies-and-eviction', 'api-design', 'queues-and-back-pressure', 'pub-sub-and-event-streaming',
	'rate-limiting', 'monolith-vs-microservices', 'authentication-and-authorization', 'docker',
	'url-shortener', 'twitter-timeline', 'scaling-on-aws', 'api-rate-limiter'
];

export const studyPlan: StudyTier[] = [
	{ id: 'short', label: '1 week', summary: 'Breadth: the core topics and a couple of case studies.', slugs: short },
	{ id: 'medium', label: '1 month', summary: 'Breadth and some depth, with most case studies.', slugs: medium },
	{
		id: 'long',
		label: '3+ months',
		summary: 'Everything, in order: breadth, more depth and every case study.',
		slugs: allModules.map((m) => m.slug)
	}
];
