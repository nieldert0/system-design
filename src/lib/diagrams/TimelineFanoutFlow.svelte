<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'author', label: 'Author', x: 20, y: 80, w: 100 },
		{ id: 'api', label: 'Write API', x: 150, y: 80, w: 120 },
		{ id: 'db', label: 'Tweet store', x: 300, y: 20, w: 130 },
		{ id: 'fan', label: 'Fan-out service', x: 300, y: 140, w: 130 },
		{ id: 't1', label: 'Follower A timeline', x: 460, y: 20, w: 170 },
		{ id: 't2', label: 'Follower B timeline', x: 460, y: 140, w: 170 },
		{ id: 'reader', label: 'Follower A reads', x: 460, y: 240, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Post: the author sends a tweet to the write API.', moves: [{ from: 'author', to: 'api' }] },
		{ caption: 'The tweet is saved once in the tweet store, and a fan-out job is queued.', moves: [{ from: 'api', to: 'db' }, { from: 'api', to: 'fan' }] },
		{ caption: "Fan-out: the service looks up the author's followers and pushes the tweet ID into each follower's timeline in the cache.", moves: [{ from: 'fan', to: 't1' }, { from: 'fan', to: 't2' }] },
		{ caption: 'Read: a follower opens their home timeline, which is already built in the cache, so it is one fast read.', moves: [{ from: 't1', to: 'reader' }] }
	];
</script>

<FlowWalkthrough
	title="Twitter timeline: fan-out on write"
	desc="An author, a write API, a tweet store, a fan-out service, and two followers' cached timelines."
	viewBox="0 0 650 300"
	{boxes}
	{steps}
/>
