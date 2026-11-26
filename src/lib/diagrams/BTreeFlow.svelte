<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'q', label: 'WHERE id = 42', x: 20, y: 20, w: 150 },
		{ id: 'root', label: 'Root: <50 | ≥50', x: 230, y: 20, w: 160 },
		{ id: 'mid', label: '<25 | 25–49', x: 230, y: 110, w: 160 },
		{ id: 'leaf', label: 'Leaf: 40–49 → row', x: 230, y: 200, w: 160 },
		{ id: 'scan', label: 'Full scan: row 1…N', x: 450, y: 110, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'With an index, the lookup starts at the B-tree root, which says ids under 50 are on the left.', moves: [{ from: 'q', to: 'root' }] },
		{ caption: 'One level down, 42 falls in 25–49.', moves: [{ from: 'root', to: 'mid' }] },
		{ caption: 'The leaf points straight at the row: a few page reads, logarithmic in table size.', moves: [{ from: 'mid', to: 'leaf' }] },
		{ caption: 'Without an index, the database reads every row and checks each one: a full table scan.', moves: [{ from: 'q', to: 'scan', fail: true, label: 'N rows' }] }
	];
</script>

<FlowWalkthrough
	title="An index lookup vs a full table scan"
	desc="A query, three levels of a B-tree, and a full table scan for comparison."
	viewBox="0 0 640 260"
	{boxes}
	{steps}
/>
