<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'api', label: 'Order service', x: 20, y: 100, w: 130 },
		{ id: 'log', label: 'Event store / log', x: 210, y: 100, w: 160 },
		{ id: 'pay', label: 'Payments', x: 440, y: 20, w: 140 },
		{ id: 'inv', label: 'Inventory', x: 440, y: 100, w: 140 },
		{ id: 'view', label: 'Order view (CQRS read)', x: 440, y: 180, w: 180 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The order service validates the command PlaceOrder and appends the fact OrderPlaced. It does not call anyone.', moves: [{ from: 'api', to: 'log', label: 'OrderPlaced' }], visible: ['api', 'log', 'pay', 'inv', 'view'] },
		{ caption: 'Choreography: payments and inventory each subscribe and react on their own.', moves: [{ from: 'log', to: 'pay' }, { from: 'log', to: 'inv' }], visible: ['api', 'log', 'pay', 'inv', 'view'] },
		{ caption: 'Inventory finds the item out of stock and publishes StockRejected. Payments reacts by refunding: a compensating step, not a rollback.', moves: [{ from: 'inv', to: 'log', label: 'StockRejected', fail: true }, { from: 'log', to: 'pay', label: 'refund' }], visible: ['api', 'log', 'pay', 'inv', 'view'], sequence: true },
		{ caption: 'A projection folds every event into a read model, so the "my orders" page reads one denormalised row instead of replaying history.', moves: [{ from: 'log', to: 'view', label: 'project' }], visible: ['api', 'log', 'pay', 'inv', 'view'] }
	];
</script>

<FlowWalkthrough
	title="Events, choreography, and a CQRS read model"
	desc="An order event fans out to payments and inventory, a rejection triggers a compensating refund, and a projection builds the read side."
	viewBox="0 0 640 240"
	{boxes}
	{steps}
/>
