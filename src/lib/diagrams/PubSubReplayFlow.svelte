<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'pub', label: 'Publisher', x: 20, y: 90, w: 110 },
		{ id: 't', label: 'Topic (retained log)', x: 190, y: 90, w: 180 },
		{ id: 's1', label: 'Email service', x: 440, y: 20, w: 150 },
		{ id: 's2', label: 'Analytics', x: 440, y: 90, w: 150 },
		{ id: 's3', label: 'New service', x: 440, y: 160, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A service publishes an event to a topic, without knowing who listens.', moves: [{ from: 'pub', to: 't' }], visible: ['pub', 't', 's1', 's2'] },
		{ caption: 'The broker fans it out to every subscription.', moves: [{ from: 't', to: 's1' }, { from: 't', to: 's2' }], visible: ['pub', 't', 's1', 's2'] },
		{ caption: 'Replay: because the log is retained, a new service starts from offset 0 and reads every past event to build its own view.', moves: [{ from: 't', to: 's3', label: 'from offset 0' }], visible: ['pub', 't', 's1', 's2', 's3'] }
	];
</script>

<FlowWalkthrough
	title="Pub/sub fan-out and replay"
	desc="A publisher, a topic stored as a log, and three subscribers, one of them new."
	viewBox="0 0 610 220"
	{boxes}
	{steps}
/>
