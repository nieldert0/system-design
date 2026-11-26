<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 't1', label: 'Transaction 1', x: 20, y: 20, w: 140 },
		{ id: 't2', label: 'Transaction 2', x: 20, y: 160, w: 140 },
		{ id: 'row', label: 'stock = 10', x: 300, y: 90, w: 140 },
		{ id: 'row9', label: 'stock = 9', x: 300, y: 90, w: 140 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Transaction 1 reads stock = 10.', moves: [{ from: 'row', to: 't1', label: 'read 10' }], visible: ['t1', 't2', 'row'] },
		{ caption: 'Transaction 2 also reads stock = 10, before transaction 1 writes.', moves: [{ from: 'row', to: 't2', label: 'read 10' }], visible: ['t1', 't2', 'row'] },
		{ caption: 'Transaction 1 sells one and writes 9.', moves: [{ from: 't1', to: 'row9', label: 'write 9' }], visible: ['t1', 't2', 'row9'] },
		{ caption: 'Transaction 2 also writes 9, overwriting it. Two items sold, stock dropped by one: an update was lost.', moves: [{ from: 't2', to: 'row9', fail: true, label: 'write 9' }], visible: ['t1', 't2', 'row9'] }
	];
</script>

<FlowWalkthrough
	title="A lost update from two interleaved transactions"
	desc="Two transactions read the same row and both write it back."
	viewBox="0 0 460 220"
	{boxes}
	{steps}
/>
