<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'app', label: 'Application', x: 20, y: 80, w: 130 },
		{ id: 'cache', label: 'Cache', x: 230, y: 80, w: 120 },
		{ id: 'db', label: 'Database', x: 430, y: 80, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Write-through: the application writes to the cache...', moves: [{ from: 'app', to: 'cache' }] },
		{ caption: '...and the cache writes to the database before the write is acknowledged. Slow, but the data is safe.', moves: [{ from: 'cache', to: 'db', label: 'sync' }, { from: 'cache', to: 'app', label: 'ack' }] },
		{ caption: 'Write-behind: the application writes to the cache and is acknowledged at once.', moves: [{ from: 'app', to: 'cache' }, { from: 'cache', to: 'app', label: 'ack' }] },
		{ caption: 'The cache writes to the database later, asynchronously. Fast, but a cache crash before then loses the write.', moves: [{ from: 'cache', to: 'db', label: 'async' }] }
	];
</script>

<FlowWalkthrough
	title="Write-through vs write-behind"
	desc="An application, a cache and a database in a row."
	viewBox="0 0 570 200"
	{boxes}
	{steps}
/>
