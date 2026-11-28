<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client', x: 20, y: 80, w: 100 },
		{ id: 'api', label: 'Payment API', x: 160, y: 80, w: 110 },
		{ id: 'db', label: 'Keys + charges', x: 300, y: 80, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The client sends POST /charges with Idempotency-Key k1 and a 2 s timeout. The API stores k1 and charges the card.', moves: [{ from: 'c', to: 'api', label: 'k1' }, { from: 'api', to: 'db', label: 'save k1' }], sequence: true },
		{ caption: 'The response is lost on the way back. The client hits its timeout and cannot tell whether the charge happened.', moves: [{ from: 'api', to: 'c', fail: true, label: 'lost' }], links: [{ from: 'api', to: 'db' }] },
		{ caption: 'The client waits 100 ms plus random jitter, then retries with the same key k1.', moves: [{ from: 'c', to: 'api', label: 'retry k1' }] },
		{ caption: 'The API finds k1 already stored and returns the saved result. The card is charged exactly once.', moves: [{ from: 'api', to: 'db', label: 'k1 seen' }, { from: 'api', to: 'c', label: '200, same id' }], sequence: true }
	];
</script>

<FlowWalkthrough
	title="Retry with an idempotency key"
	desc="A client, a payment API and its database, showing a timed-out request retried safely."
	viewBox="0 0 420 200"
	{boxes}
	{steps}
/>
