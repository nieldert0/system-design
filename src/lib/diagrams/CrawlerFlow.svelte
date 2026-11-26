<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'queue', label: 'URL queue', x: 20, y: 80, w: 120 },
		{ id: 'fetch', label: 'Fetcher', x: 180, y: 20, w: 120 },
		{ id: 'web', label: 'Web page', x: 340, y: 20, w: 120 },
		{ id: 'parse', label: 'Parser', x: 340, y: 140, w: 120 },
		{ id: 'dedupe', label: 'Seen? (dedupe)', x: 180, y: 140, w: 120 },
		{ id: 'store', label: 'Page store', x: 500, y: 140, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Take a URL: a crawler worker pops the next URL from the queue.', moves: [{ from: 'queue', to: 'fetch' }] },
		{ caption: 'Fetch: it downloads the page, after checking robots.txt and the per-site rate limit.', moves: [{ from: 'fetch', to: 'web' }] },
		{ caption: 'Parse: the page text goes to storage for the indexer, and its links are extracted.', moves: [{ from: 'web', to: 'parse' }, { from: 'parse', to: 'store' }] },
		{ caption: 'Dedupe: each link is checked against the set of URLs already seen.', moves: [{ from: 'parse', to: 'dedupe' }] },
		{ caption: 'New links go back into the queue; ones already seen are dropped.', moves: [{ from: 'dedupe', to: 'queue' }, { from: 'dedupe', to: 'dedupe', fail: true, label: 'seen' }] }
	];
</script>

<FlowWalkthrough
	title="Web crawler: the crawl loop"
	desc="A URL queue, a fetcher, a web page, a parser, a seen-URL check and a page store."
	viewBox="0 0 640 200"
	{boxes}
	{steps}
/>
