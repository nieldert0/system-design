<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client write: x = 2', x: 20, y: 90, w: 170 },
		{ id: 'n1', label: 'Node 1 (x = 1)', x: 260, y: 20, w: 150 },
		{ id: 'n1cp', label: 'CP: rejected', x: 260, y: 20, w: 150 },
		{ id: 'n1ap', label: 'AP: Node 1 x = 2', x: 260, y: 20, w: 150 },
		{ id: 'n2', label: 'Node 2 (x = 1)', x: 260, y: 160, w: 150 },
		{ id: 'cut', label: '✕ partition', x: 450, y: 90, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A network partition: the two nodes can no longer reach each other.', moves: [{ from: 'n1', to: 'n2', fail: true }], visible: ['n1', 'n2', 'cut'] },
		{ caption: 'A write arrives at node 1.', moves: [{ from: 'c', to: 'n1' }], visible: ['c', 'n1', 'n2', 'cut'] },
		{ caption: 'CP: node 1 cannot confirm the write with node 2, so it returns an error or times out. The data stays consistent.', moves: [{ from: 'n1cp', to: 'c', fail: true, label: 'error' }], visible: ['c', 'n1cp', 'n2', 'cut'] },
		{ caption: 'AP: node 1 accepts the write anyway. Readers of node 2 still see x = 1 until the partition heals and the write propagates.', moves: [{ from: 'n1ap', to: 'c', label: 'ok' }], visible: ['c', 'n1ap', 'n2', 'cut'] }
	];
</script>

<FlowWalkthrough
	title="CAP: a write during a partition"
	desc="A client, two nodes holding x, and a network partition between the nodes."
	viewBox="0 0 580 220"
	{boxes}
	{steps}
/>
