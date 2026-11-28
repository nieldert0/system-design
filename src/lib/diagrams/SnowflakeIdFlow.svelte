<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'app', label: 'App servers', x: 20, y: 80, w: 110 },
		{ id: 'w1', label: 'Worker 7', x: 175, y: 20, w: 100 },
		{ id: 'w2', label: 'Worker 12', x: 175, y: 140, w: 100 },
		{ id: 'db', label: 'Database', x: 315, y: 80, w: 95 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Each worker gets a unique 10-bit worker ID once, at start-up (for example from ZooKeeper or its pod ordinal). No coordination is needed after that.', moves: [{ from: 'app', to: 'w1' }, { from: 'app', to: 'w2' }] },
		{ caption: 'Worker 7 takes the milliseconds since its epoch (41 bits), shifts it left 22 bits, adds 7 << 12, and adds sequence 0.', moves: [{ from: 'w1', to: 'app', label: 'ts|7|0' }] },
		{ caption: 'A second request in the same millisecond gets sequence 1. Worker 12 issues IDs in that same millisecond without a clash, because its worker bits differ.', moves: [{ from: 'w1', to: 'app', label: 'ts|7|1' }, { from: 'w2', to: 'app', label: 'ts|12|0' }] },
		{ caption: 'The IDs become primary keys. The timestamp sits in the high bits, so they sort roughly by time and land at the right edge of the B-tree index.', moves: [{ from: 'app', to: 'db', label: 'INSERT' }] }
	];
</script>

<FlowWalkthrough
	title="Building a Snowflake ID"
	desc="Two ID workers, each building 64-bit IDs from a timestamp, a worker ID and a sequence number."
	viewBox="0 0 420 200"
	{boxes}
	{steps}
/>
