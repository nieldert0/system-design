<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'w', label: 'Writer', x: 20, y: 20, w: 100 },
		{ id: 'p', label: 'Primary', x: 200, y: 20, w: 120 },
		{ id: 'r1', label: 'Replica 1', x: 400, y: 20, w: 120 },
		{ id: 'r2', label: 'Replica 2', x: 400, y: 140, w: 120 },
		{ id: 'rd', label: 'Reader', x: 200, y: 140, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A write goes to the primary, which confirms it right away.', moves: [{ from: 'w', to: 'p' }, { from: 'p', to: 'w', label: 'ok' }] },
		{ caption: 'Asynchronous replication copies it to the replicas a moment later.', moves: [{ from: 'p', to: 'r1', label: 'async' }] },
		{ caption: 'A read lands on a replica that has not caught up yet, and returns stale data.', moves: [{ from: 'r2', to: 'rd', fail: true, label: 'stale' }] }
	];
</script>

<FlowWalkthrough
	title="Async replication and a stale read"
	desc="A writer, a primary, two replicas and a reader."
	viewBox="0 0 540 200"
	{boxes}
	{steps}
/>
