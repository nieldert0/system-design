<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Clients', x: 20, y: 80, w: 100 },
		{ id: 'a', label: 'Active (owns IP)', x: 200, y: 20, w: 160 },
		{ id: 'ax', label: 'Active ✕', x: 200, y: 20, w: 160 },
		{ id: 'p', label: 'Passive', x: 200, y: 140, w: 160 },
		{ id: 'pa', label: 'New active (owns IP)', x: 200, y: 140, w: 160 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The active server handles traffic and sends heartbeats to the passive one on standby.', moves: [{ from: 'c', to: 'a' }, { from: 'a', to: 'p', label: 'heartbeat' }], visible: ['c', 'a', 'p'] },
		{ caption: 'The active server dies, and the heartbeats stop.', moves: [{ from: 'ax', to: 'p', fail: true, label: 'silence' }], visible: ['c', 'ax', 'p'] },
		{ caption: 'The passive server takes over the active\'s IP address and resumes service.', moves: [{ from: 'c', to: 'pa' }], visible: ['c', 'ax', 'pa'] }
	];
</script>

<FlowWalkthrough
	title="Active-passive failover"
	desc="Clients, an active server and a passive standby exchanging heartbeats."
	viewBox="0 0 380 200"
	{boxes}
	{steps}
/>
