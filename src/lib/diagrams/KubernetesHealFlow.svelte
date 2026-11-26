<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'cp', label: 'Control plane', x: 205, y: 20, w: 160 },
		{ id: 'n1', label: 'Node 1: pod', x: 20, y: 140, w: 160 },
		{ id: 'n1x', label: 'Node 1: pod ✕', x: 20, y: 140, w: 160 },
		{ id: 'n2', label: 'Node 2: pod', x: 390, y: 140, w: 160 },
		{ id: 'n2b', label: 'Node 2: 2 pods', x: 390, y: 140, w: 160 }
	];
	const always = ['cp'];
	const steps: FlowStep[] = [
		{ caption: 'Desired state: the Deployment asks for 2 replicas. The scheduler has placed one pod on each node.', moves: [], visible: [...always, 'n1', 'n2'] },
		{ caption: 'A pod dies: its node crashes, so only 1 of the 2 replicas is running.', moves: [{ from: 'n1x', to: 'n1x', fail: true }], visible: [...always, 'n1x', 'n2'] },
		{ caption: 'The controller notices: it keeps comparing actual state with desired state and sees one replica missing.', moves: [{ from: 'cp', to: 'n1x', fail: true }], visible: [...always, 'n1x', 'n2'] },
		{ caption: 'Reschedule: the scheduler places a replacement pod on a healthy node, and the count is back to 2.', moves: [{ from: 'cp', to: 'n2b' }], visible: [...always, 'n2b'] }
	];
</script>

<FlowWalkthrough
	title="Kubernetes self-healing: a pod dies and is rescheduled"
	desc="A control plane and two nodes. A Deployment wants two replicas of a pod."
	viewBox="0 0 570 200"
	{boxes}
	{steps}
/>
