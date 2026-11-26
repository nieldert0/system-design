<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'new', label: 'New: D', x: 20, y: 90, w: 90 },
		{ id: 'a', label: 'A (oldest use)', x: 170, y: 20, w: 140 },
		{ id: 'b', label: 'B', x: 170, y: 90, w: 140 },
		{ id: 'c', label: 'C (newest use)', x: 170, y: 160, w: 140 },
		{ id: 'out', label: 'Evicted', x: 380, y: 20, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The cache is full: A, B and C, ordered by when each was last used.', moves: [], visible: ['a', 'b', 'c'] },
		{ caption: 'D needs a slot.', moves: [], visible: ['new', 'a', 'b', 'c'] },
		{ caption: 'LRU drops the entry untouched for longest: A.', moves: [{ from: 'a', to: 'out', fail: true }], visible: ['new', 'a', 'b', 'c', 'out'] },
		{ caption: 'D takes its place as the most recently used entry.', moves: [{ from: 'new', to: 'a', label: 'D' }], visible: ['new', 'a', 'b', 'c', 'out'] }
	];
</script>

<FlowWalkthrough
	title="LRU eviction"
	desc="A full cache of three entries, a new entry, and the least recently used one being evicted."
	viewBox="0 0 510 220"
	{boxes}
	{steps}
/>
