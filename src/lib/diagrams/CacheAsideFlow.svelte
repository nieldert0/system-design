<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'app', label: 'Application', x: 20, y: 80, w: 130 },
		{ id: 'cache', label: 'Cache', x: 260, y: 20, w: 120 },
		{ id: 'db', label: 'Database', x: 260, y: 150, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Look for the entry in the cache: a miss.', moves: [{ from: 'app', to: 'cache', fail: true, label: 'miss' }] },
		{ caption: 'Load the entry from the database.', moves: [{ from: 'app', to: 'db' }, { from: 'db', to: 'app' }] },
		{ caption: 'Add the entry to the cache, and return it.', moves: [{ from: 'app', to: 'cache', label: 'set' }] },
		{ caption: 'The next read of the same entry is a hit, and fast.', moves: [{ from: 'cache', to: 'app', label: 'hit' }] }
	];
</script>

<FlowWalkthrough
	title="Cache-aside: a miss, then a hit"
	desc="An application, a cache and a database."
	viewBox="0 0 400 210"
	{boxes}
	{steps}
/>
