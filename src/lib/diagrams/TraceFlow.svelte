<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'gw', label: 'Gateway: span 1', x: 20, y: 20, w: 170 },
		{ id: 'orders', label: 'Orders: span 2', x: 20, y: 150, w: 170 },
		{ id: 'pay', label: 'Payments: span 3', x: 230, y: 150, w: 170 },
		{ id: 'col', label: 'Trace collector', x: 400, y: 20, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The gateway receives a request, starts a trace with a new trace ID, and opens the first span.', moves: [{ from: 'gw', to: 'gw' }] },
		{ caption: 'It calls the orders service, passing the trace ID in a header. Orders opens a child span.', moves: [{ from: 'gw', to: 'orders' }] },
		{ caption: 'Orders calls payments with the same trace ID, adding a third span.', moves: [{ from: 'orders', to: 'pay' }] },
		{ caption: 'Each service sends its spans to a collector, which joins them by trace ID into one timeline.', moves: [{ from: 'gw', to: 'col' }, { from: 'orders', to: 'col' }, { from: 'pay', to: 'col' }] }
	];
</script>

<FlowWalkthrough
	title="Distributed tracing: one request, one trace, many spans"
	desc="A gateway, an orders service, a payments service, and a trace collector."
	viewBox="0 0 570 210"
	{boxes}
	{steps}
/>
