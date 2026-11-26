<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'u1', label: 'User 1', x: 20, y: 20, w: 100 },
		{ id: 'u2', label: 'User 2', x: 20, y: 140, w: 100 },
		{ id: 'edge', label: 'CDN edge', x: 210, y: 80, w: 130 },
		{ id: 'origin', label: 'Origin server', x: 430, y: 80, w: 140 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The first user asks the nearby edge for a file; the edge does not have it yet.', moves: [{ from: 'u1', to: 'edge' }, { from: 'edge', to: 'edge', fail: true, label: 'miss' }] },
		{ caption: 'A pull CDN fetches it from your origin server. This first request is slower.', moves: [{ from: 'edge', to: 'origin' }, { from: 'origin', to: 'edge' }] },
		{ caption: 'The edge stores the file for its TTL and returns it.', moves: [{ from: 'edge', to: 'u1' }] },
		{ caption: 'The next user nearby gets a hit, served straight from the edge.', moves: [{ from: 'u2', to: 'edge' }, { from: 'edge', to: 'u2', label: 'hit' }] }
	];
</script>

<FlowWalkthrough
	title="Pull CDN: a miss, then a hit"
	desc="Two users, a CDN edge server and the origin server."
	viewBox="0 0 590 200"
	{boxes}
	{steps}
/>
