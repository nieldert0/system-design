<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'refill', label: 'Refill: r tokens/s', x: 20, y: 20, w: 160 },
		{ id: 'b3', label: 'Bucket: 3 tokens', x: 220, y: 90, w: 160 },
		{ id: 'b2', label: 'Bucket: 2 tokens', x: 220, y: 90, w: 160 },
		{ id: 'b0', label: 'Bucket: 0 tokens', x: 220, y: 90, w: 160 },
		{ id: 'b1', label: 'Bucket: 1 token', x: 220, y: 90, w: 160 },
		{ id: 'req', label: 'Requests', x: 20, y: 160, w: 120 },
		{ id: 'api', label: 'Service', x: 440, y: 90, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The bucket holds up to b tokens (here 3) and refills at r tokens per second.', moves: [{ from: 'refill', to: 'b3' }], visible: ['refill', 'b3', 'req', 'api'] },
		{ caption: 'Each request takes a token and passes.', moves: [{ from: 'req', to: 'b2' }, { from: 'b2', to: 'api' }], visible: ['refill', 'b2', 'req', 'api'] },
		{ caption: 'A burst uses the remaining tokens: bursts up to b are allowed.', moves: [{ from: 'req', to: 'b0' }, { from: 'b0', to: 'api' }], visible: ['refill', 'b0', 'req', 'api'] },
		{ caption: 'The bucket is empty, so the next request is rejected with 429.', moves: [{ from: 'b0', to: 'req', fail: true, label: '429' }], visible: ['refill', 'b0', 'req', 'api'] },
		{ caption: 'A token refills, and requests pass again at the average rate r.', moves: [{ from: 'refill', to: 'b1' }], visible: ['refill', 'b1', 'req', 'api'] }
	];
</script>

<FlowWalkthrough
	title="Token bucket rate limiting"
	desc="A bucket of tokens that refills at a steady rate; requests take tokens or are rejected."
	viewBox="0 0 570 220"
	{boxes}
	{steps}
/>
