<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'r', label: '3 requests', x: 20, y: 110, w: 110 },
		{ id: 't1', label: 'Thread 1', x: 200, y: 20, w: 110 },
		{ id: 't2', label: 'Thread 2', x: 200, y: 80, w: 110 },
		{ id: 't3', label: 'Thread 3', x: 200, y: 140, w: 110 },
		{ id: 'loop', label: 'Event loop (1 thread)', x: 380, y: 110, w: 180 },
		{ id: 'io', label: 'I/O: DB, network', x: 380, y: 210, w: 180 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Thread per request: each of the 3 requests gets its own thread. Simple code, but memory and switching cost grow with connections.', moves: [{ from: 'r', to: 't1' }, { from: 'r', to: 't2' }, { from: 'r', to: 't3' }], visible: ['r', 't1', 't2', 't3'] },
		{ caption: 'Each thread mostly waits on I/O while holding its memory.', moves: [{ from: 't1', to: 't1' }, { from: 't2', to: 't2' }, { from: 't3', to: 't3' }], visible: ['r', 't1', 't2', 't3'] },
		{ caption: 'Event loop: one thread takes all 3 requests and starts their I/O without waiting.', moves: [{ from: 'r', to: 'loop' }, { from: 'loop', to: 'io' }], visible: ['r', 'loop', 'io'] },
		{ caption: 'As each I/O completes, the loop runs that request\'s next step. CPU-heavy work here would block everyone.', moves: [{ from: 'io', to: 'loop' }], visible: ['r', 'loop', 'io'] }
	];
</script>

<FlowWalkthrough
	title="Thread per request vs an event loop"
	desc="Three requests handled first by three threads, then by a single event-loop thread that waits on I/O for all of them."
	viewBox="0 0 580 270"
	{boxes}
	{steps}
/>
