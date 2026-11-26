<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Clients', x: 20, y: 90, w: 100 },
		{ id: 'lb', label: 'Load balancer', x: 170, y: 90, w: 140 },
		{ id: 'a', label: 'Server A', x: 380, y: 20, w: 120 },
		{ id: 'b', label: 'Server B', x: 380, y: 90, w: 120 },
		{ id: 'bx', label: 'Server B ✕', x: 380, y: 90, w: 120 },
		{ id: 'x', label: 'Server C', x: 380, y: 160, w: 120 }
	];
	const all = ['c', 'lb', 'a', 'x'];
	const steps: FlowStep[] = [
		{ caption: 'Round robin: requests go to each server in turn, A, then B, then C.', moves: [{ from: 'c', to: 'lb' }, { from: 'lb', to: 'a' }, { from: 'lb', to: 'b' }, { from: 'lb', to: 'x' }], visible: [...all, 'b'] },
		{ caption: 'Health check: server B stops answering the load balancer\'s checks.', moves: [{ from: 'lb', to: 'bx', fail: true, label: 'no reply' }], visible: [...all, 'bx'] },
		{ caption: 'B is taken out of rotation, so new requests are spread over A and C only.', moves: [{ from: 'c', to: 'lb' }, { from: 'lb', to: 'a' }, { from: 'lb', to: 'x' }], visible: [...all, 'bx'] }
	];
</script>

<FlowWalkthrough
	title="Load balancer: round robin and a failed health check"
	desc="Clients, a load balancer and three servers; one server fails its health check and is skipped."
	viewBox="0 0 520 220"
	{boxes}
	{steps}
/>
