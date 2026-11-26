<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'lb', label: 'Load balancer', x: 20, y: 80, w: 150 },
		{ id: 'v1', label: 'v1 (current)', x: 380, y: 20, w: 170 },
		{ id: 'v2', label: 'v2 (canary)', x: 380, y: 150, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Before: all traffic goes to v1.', moves: [{ from: 'lb', to: 'v1', label: '100%' }] },
		{ caption: '5%: a small slice of users gets v2 while you watch its error rate and latency.', moves: [{ from: 'lb', to: 'v1', label: '95%' }, { from: 'lb', to: 'v2', label: '5%' }] },
		{ caption: '50%: metrics look healthy, so the shift continues. If they get worse, send everything back to v1.', moves: [{ from: 'lb', to: 'v1', label: '50%' }, { from: 'lb', to: 'v2', label: '50%' }] },
		{ caption: '100%: v2 takes all traffic.', moves: [{ from: 'lb', to: 'v2', label: '100%' }] }
	];
</script>

<FlowWalkthrough
	title="Canary release: traffic shifts 5% → 50% → 100%"
	desc="A load balancer splits traffic between the current version and a new canary version."
	viewBox="0 0 570 220"
	{boxes}
	{steps}
/>
