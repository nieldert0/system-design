<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'req', label: 'Requirements: users, QPS, reads:writes', x: 20, y: 20, w: 300 },
		{ id: 'client', label: 'Clients', x: 20, y: 120, w: 100 },
		{ id: 'app', label: 'App server', x: 190, y: 120, w: 130 },
		{ id: 'lb', label: 'Load balancer', x: 160, y: 120, w: 130 },
		{ id: 'apps', label: 'App servers ×N', x: 330, y: 120, w: 140 },
		{ id: 'db', label: 'Database', x: 520, y: 120, w: 120 },
		{ id: 'zoom', label: 'Zoom: API + data model', x: 380, y: 20, w: 200 },
		{ id: 'cache', label: 'Cache', x: 330, y: 220, w: 140 },
		{ id: 'rep', label: 'Read replicas', x: 520, y: 220, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Step 1: outline use cases, constraints and assumptions. Write the numbers down where the interviewer can see them.', moves: [], visible: ['req'] },
		{ caption: 'Step 2: a high-level design. Often just clients, an app server and a database, working end to end.', moves: [{ from: 'client', to: 'app' }, { from: 'app', to: 'db' }], visible: ['req', 'client', 'app', 'db'] },
		{ caption: 'Step 3: dive into the core components, such as the API and how data is stored.', moves: [{ from: 'app', to: 'zoom' }], visible: ['req', 'client', 'app', 'db', 'zoom'] },
		{ caption: 'Step 4: scale the design. Add a load balancer and more app servers, a cache and replicas, each for a named bottleneck.', moves: [{ from: 'client', to: 'lb' }, { from: 'lb', to: 'apps' }, { from: 'apps', to: 'cache' }, { from: 'apps', to: 'rep' }], visible: ['req', 'client', 'lb', 'apps', 'db', 'cache', 'rep'] }
	];
</script>

<FlowWalkthrough
	title="A design interview: the design grows step by step"
	desc="Requirements are written down, then a simple client, app server and database design, a zoom into one component, and finally a load balancer, more servers, a cache and read replicas."
	viewBox="0 0 660 280"
	{boxes}
	{steps}
/>
