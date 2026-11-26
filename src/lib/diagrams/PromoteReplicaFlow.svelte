<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'app', label: 'App', x: 20, y: 80, w: 100 },
		{ id: 'p', label: 'Primary', x: 200, y: 20, w: 150 },
		{ id: 'px', label: 'Primary ✕', x: 200, y: 20, w: 150 },
		{ id: 'r1', label: 'Replica 1', x: 200, y: 140, w: 150 },
		{ id: 'np', label: 'Replica 1 → primary', x: 200, y: 140, w: 150 },
		{ id: 'r2', label: 'Replica 2', x: 420, y: 140, w: 130 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Writes go to the primary, which copies them to the replicas.', moves: [{ from: 'app', to: 'p' }, { from: 'p', to: 'r1' }, { from: 'p', to: 'r2' }], visible: ['app', 'p', 'r1', 'r2'] },
		{ caption: 'The primary goes offline. Reads can continue from the replicas, but writes cannot.', moves: [{ from: 'app', to: 'px', fail: true }], visible: ['app', 'px', 'r1', 'r2'] },
		{ caption: 'A replica is promoted to primary, and the other replica follows it.', moves: [{ from: 'np', to: 'r2' }], visible: ['app', 'px', 'np', 'r2'] },
		{ caption: 'The app sends writes to the new primary.', moves: [{ from: 'app', to: 'np' }], visible: ['app', 'px', 'np', 'r2'] }
	];
</script>

<FlowWalkthrough
	title="The primary dies and a replica is promoted"
	desc="An app, a primary and two replicas; the primary fails and replica 1 takes over."
	viewBox="0 0 570 200"
	{boxes}
	{steps}
/>
