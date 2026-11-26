<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'req', label: 'GET user 1042', x: 20, y: 90, w: 140 },
		{ id: 'route', label: 'Router: hash(user id)', x: 200, y: 90, w: 180 },
		{ id: 's0', label: 'Shard 0', x: 440, y: 20, w: 110 },
		{ id: 's1', label: 'Shard 1', x: 440, y: 90, w: 110 },
		{ id: 's2', label: 'Shard 2', x: 440, y: 160, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A request for one user arrives.', moves: [{ from: 'req', to: 'route' }] },
		{ caption: 'The shard key, here the user id, is hashed to pick the shard that owns that user.', moves: [{ from: 'route', to: 'route' }] },
		{ caption: 'The query goes only to that shard. The others are not touched, so each carries less traffic.', moves: [{ from: 'route', to: 's1', label: 'shard 1' }] }
	];
</script>

<FlowWalkthrough
	title="Routing a request to its shard"
	desc="A request, a router that hashes the shard key, and three shards."
	viewBox="0 0 570 220"
	{boxes}
	{steps}
/>
