<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'src', label: 'Click events (Kafka)', x: 20, y: 90, w: 170 },
		{ id: 'op', label: 'Flink: 1-min windows', x: 250, y: 90, w: 170 },
		{ id: 'late', label: 'Late-data side output', x: 250, y: 180, w: 170 },
		{ id: 'sink', label: 'Counts table', x: 480, y: 90, w: 130 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Events arrive tagged with the time they happened (event time), not the time they reach the job.', moves: [{ from: 'src', to: 'op', label: '12:00:41' }], visible: ['src', 'op', 'sink'] },
		{ caption: 'The job keeps one counter per key per 1-minute window in its state, checkpointed so a crash does not lose it.', moves: [{ from: 'src', to: 'op', label: '12:00:58' }], visible: ['src', 'op', 'sink'] },
		{ caption: 'A watermark of 12:01:05 says "events older than 12:01:00 are unlikely now", so the 12:00 window closes and its count is emitted.', moves: [{ from: 'op', to: 'sink', label: 'window 12:00 = 3,412' }], visible: ['src', 'op', 'sink'] },
		{ caption: 'An event stamped 12:00:30 arrives after the window closed and its allowed lateness ran out. It goes to a side output instead of silently vanishing.', moves: [{ from: 'src', to: 'op', label: '12:00:30 (late)' }, { from: 'op', to: 'late' }], visible: ['src', 'op', 'late', 'sink'], sequence: true }
	];
</script>

<FlowWalkthrough
	title="Event-time windows and a watermark"
	desc="A stream job counts clicks per minute, closes a window when the watermark passes it, and routes a late event aside."
	viewBox="0 0 630 240"
	{boxes}
	{steps}
/>
