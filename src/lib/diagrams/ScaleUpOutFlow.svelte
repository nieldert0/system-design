<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'load', label: 'Requests', x: 20, y: 90, w: 110 },
		{ id: 's1', label: 'Server', x: 200, y: 90, w: 110 },
		{ id: 'big', label: 'Bigger server', x: 200, y: 75, w: 170, h: 74 },
		{ id: 'lb', label: 'Load balancer', x: 180, y: 90, w: 130 },
		{ id: 'a', label: 'Server 1', x: 380, y: 20, w: 110 },
		{ id: 'b', label: 'Server 2', x: 380, y: 90, w: 110 },
		{ id: 'c', label: 'Server 3', x: 380, y: 160, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Load rises: one server is running out of CPU or memory.', moves: [{ from: 'load', to: 's1', fail: true }], visible: ['load', 's1'] },
		{ caption: 'Scale up: give the same machine more CPU and memory. Simple, but it has a ceiling and is still one point of failure.', moves: [{ from: 'load', to: 'big' }], visible: ['load', 'big'] },
		{ caption: 'Scale out: add machines behind a load balancer, which spreads the work across them.', moves: [{ from: 'load', to: 'lb' }, { from: 'lb', to: 'a' }, { from: 'lb', to: 'b' }, { from: 'lb', to: 'c' }], visible: ['load', 'lb', 'a', 'b', 'c'] }
	];
</script>

<FlowWalkthrough
	title="Scale up vs scale out"
	desc="Requests reach one server. Scaling up makes that server bigger; scaling out adds servers behind a load balancer."
	viewBox="0 0 510 220"
	{boxes}
	{steps}
/>
