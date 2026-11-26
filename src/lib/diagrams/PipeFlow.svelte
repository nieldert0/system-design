<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'log', label: 'access.log', x: 20, y: 60, w: 110 },
		{ id: 'cut', label: 'cut', x: 160, y: 60, w: 70 },
		{ id: 'sort', label: 'sort', x: 260, y: 60, w: 70 },
		{ id: 'uniq', label: 'uniq -c', x: 360, y: 60, w: 90 },
		{ id: 'sort2', label: 'sort -rn', x: 480, y: 60, w: 90 },
		{ id: 'head', label: 'head -5', x: 600, y: 60, w: 90 }
	];
	const steps: FlowStep[] = [
		{ caption: 'cut reads the log and keeps only the first field, the client IP.', moves: [{ from: 'log', to: 'cut' }] },
		{ caption: 'Its output is piped into sort, which groups equal IPs together.', moves: [{ from: 'cut', to: 'sort', label: '|' }] },
		{ caption: 'uniq -c collapses each group into one line with a count.', moves: [{ from: 'sort', to: 'uniq', label: '|' }] },
		{ caption: 'sort -rn orders by count, highest first, and head -5 keeps the top five.', moves: [{ from: 'uniq', to: 'sort2', label: '|' }, { from: 'sort2', to: 'head', label: '|' }] }
	];
</script>

<FlowWalkthrough
	title="A shell pipeline: top client IPs"
	desc="Six boxes in a row: the log file and the five commands it flows through."
	viewBox="0 0 710 140"
	{boxes}
	{steps}
/>
