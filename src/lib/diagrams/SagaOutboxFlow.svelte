<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'o', label: 'Order service', x: 20, y: 90, w: 120 },
		{ id: 'q', label: 'Broker', x: 175, y: 90, w: 90 },
		{ id: 'p', label: 'Payment', x: 300, y: 20, w: 100 },
		{ id: 'i', label: 'Inventory', x: 300, y: 160, w: 100 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The order service writes the order (PENDING) and an OrderCreated row to its outbox table in one local transaction. A relay publishes the row.', moves: [{ from: 'o', to: 'q', label: 'OrderCreated' }] },
		{ caption: 'Payment charges $40 and publishes PaymentCaptured, again through its own outbox.', moves: [{ from: 'q', to: 'p' }, { from: 'p', to: 'q', label: 'captured' }], sequence: true },
		{ caption: 'Inventory tries to reserve the item, but stock is 0. It publishes ReserveFailed.', moves: [{ from: 'q', to: 'i' }, { from: 'i', to: 'q', fail: true, label: 'failed' }], sequence: true },
		{ caption: 'Compensation runs backwards: payment refunds the $40, and the order service marks the order CANCELLED.', moves: [{ from: 'q', to: 'p', label: 'refund' }, { from: 'q', to: 'o', label: 'cancel' }] }
	];
</script>

<FlowWalkthrough
	title="An order saga with compensation"
	desc="Order, payment and inventory services running a saga, where a failed step triggers a compensating refund."
	viewBox="0 0 420 220"
	{boxes}
	{steps}
/>
