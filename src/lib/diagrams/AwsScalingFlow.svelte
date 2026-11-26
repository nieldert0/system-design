<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'user', label: 'Users', x: 20, y: 120, w: 100 },
		{ id: 'one', label: 'One server: web + DB', x: 170, y: 120, w: 180 },
		{ id: 'web', label: 'Web server', x: 170, y: 120, w: 140 },
		{ id: 'cdn', label: 'CDN + S3', x: 170, y: 20, w: 140 },
		{ id: 'lb', label: 'Load balancer', x: 170, y: 120, w: 140 },
		{ id: 'webs', label: 'Web servers ×N', x: 350, y: 120, w: 150 },
		{ id: 'db', label: 'SQL primary', x: 540, y: 120, w: 130 },
		{ id: 'rep', label: 'Read replicas', x: 540, y: 220, w: 130 },
		{ id: 'cache', label: 'Memory cache', x: 350, y: 220, w: 150 },
		{ id: 'q', label: 'Queue + workers', x: 350, y: 20, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: '1 user: one server runs the web app and the database, with a DNS name pointing at it.', moves: [{ from: 'user', to: 'one' }], visible: ['user', 'one'] },
		{ caption: 'Split the database onto its own managed SQL instance, and serve static files from S3 behind a CDN.', moves: [{ from: 'user', to: 'cdn' }, { from: 'web', to: 'db' }], visible: ['user', 'web', 'cdn', 'db'] },
		{ caption: 'Scale out: a load balancer spreads traffic over several stateless web servers in more than one zone.', moves: [{ from: 'user', to: 'lb' }, { from: 'lb', to: 'webs' }, { from: 'webs', to: 'db' }], visible: ['user', 'cdn', 'lb', 'webs', 'db'] },
		{ caption: 'Reads dominate: add a memory cache and read replicas so the primary only handles writes.', moves: [{ from: 'webs', to: 'cache' }, { from: 'webs', to: 'rep' }], visible: ['user', 'cdn', 'lb', 'webs', 'db', 'rep', 'cache'] },
		{ caption: 'Millions of users: autoscale the web tier and move slow work to a queue with workers.', moves: [{ from: 'webs', to: 'q' }], visible: ['user', 'cdn', 'lb', 'webs', 'db', 'rep', 'cache', 'q'] }
	];
</script>

<FlowWalkthrough
	title="Scaling on AWS: from one server to millions of users"
	desc="The architecture grows step by step: one server, a separate database and CDN, a load balancer and web servers, then a cache, read replicas and a queue."
	viewBox="0 0 690 280"
	{boxes}
	{steps}
/>
