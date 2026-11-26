<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'w', label: 'Writer', x: 20, y: 20, w: 100 },
		{ id: 'p', label: 'Primary', x: 200, y: 20, w: 120 },
		{ id: 'r', label: 'Replica', x: 200, y: 150, w: 120 },
		{ id: 'rd', label: 'Reader', x: 420, y: 150, w: 100 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A write goes to the primary.', moves: [{ from: 'w', to: 'p' }] },
		{ caption: 'Weak: the copy to the replica is best effort. A read may or may not see the write.', moves: [{ from: 'p', to: 'r', fail: true, label: 'maybe' }, { from: 'r', to: 'rd', label: '?' }] },
		{ caption: 'Eventual: the copy is asynchronous. A read right away may be stale, but within milliseconds it sees the write.', moves: [{ from: 'r', to: 'rd', label: 'stale' }, { from: 'p', to: 'r', label: 'async' }] },
		{ caption: 'Strong: the write is copied synchronously before it is acknowledged, so every read sees it.', moves: [{ from: 'p', to: 'r', label: 'sync' }, { from: 'p', to: 'w', label: 'ack' }, { from: 'r', to: 'rd', label: 'new' }] }
	];
</script>

<FlowWalkthrough
	title="A read after a write under weak, eventual and strong consistency"
	desc="A writer, a primary, a replica and a reader."
	viewBox="0 0 540 210"
	{boxes}
	{steps}
/>
