<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'p', label: 'Producer', x: 20, y: 80, w: 110 },
		{ id: 'q', label: 'Queue', x: 200, y: 80, w: 120 },
		{ id: 'qf', label: 'Queue (full)', x: 200, y: 80, w: 120 },
		{ id: 'w1', label: 'Worker 1', x: 400, y: 20, w: 110 },
		{ id: 'w2', label: 'Worker 2', x: 400, y: 140, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The application publishes a job to the queue and tells the user it is in progress.', moves: [{ from: 'p', to: 'q' }], visible: ['p', 'q', 'w1', 'w2'] },
		{ caption: 'Workers pick jobs up from the queue and process them in the background.', moves: [{ from: 'q', to: 'w1' }, { from: 'q', to: 'w2' }], visible: ['p', 'q', 'w1', 'w2'] },
		{ caption: 'Jobs arrive faster than workers finish, and the queue fills up.', moves: [{ from: 'p', to: 'qf' }], visible: ['p', 'qf', 'w1', 'w2'] },
		{ caption: 'Back pressure: the full queue rejects new jobs (HTTP 503), and the client retries later with backoff.', moves: [{ from: 'qf', to: 'p', fail: true, label: '503' }], visible: ['p', 'qf', 'w1', 'w2'] }
	];
</script>

<FlowWalkthrough
	title="A job queue, then back pressure"
	desc="A producer, a queue and two workers."
	viewBox="0 0 530 200"
	{boxes}
	{steps}
/>
