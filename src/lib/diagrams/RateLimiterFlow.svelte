<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'client', label: 'Client', x: 20, y: 80, w: 110 },
		{ id: 'gw', label: 'Rate limiter', x: 190, y: 80, w: 140 },
		{ id: 'redis', label: 'Redis counter', x: 390, y: 20, w: 150 },
		{ id: 'api', label: 'API service', x: 390, y: 140, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A request arrives at the rate limiter, which identifies the caller by API key, user or IP.', moves: [{ from: 'client', to: 'gw' }] },
		{ caption: "It atomically increments the caller's counter for the current window in Redis and reads the new count.", moves: [{ from: 'gw', to: 'redis', label: 'INCR' }] },
		{ caption: 'Under the limit: the request is forwarded to the API service.', moves: [{ from: 'gw', to: 'api' }] },
		{ caption: 'Over the limit: the limiter replies 429 Too Many Requests with a Retry-After header, and the API never sees it.', moves: [{ from: 'gw', to: 'client', fail: true, label: '429' }] }
	];
</script>

<FlowWalkthrough
	title="API rate limiter: allow or reject"
	desc="A client, a rate limiter, a shared Redis counter and the API service behind it."
	viewBox="0 0 560 200"
	{boxes}
	{steps}
/>
