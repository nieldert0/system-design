<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'client', label: 'Browser cache', x: 20, y: 60, w: 120 },
		{ id: 'cdn', label: 'CDN', x: 170, y: 60, w: 90 },
		{ id: 'web', label: 'Web server cache', x: 290, y: 60, w: 140 },
		{ id: 'app', label: 'App cache (Redis)', x: 460, y: 60, w: 150 },
		{ id: 'db', label: 'Database (+ its cache)', x: 640, y: 60, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Client caching: the browser checks its own cache first. Miss.', moves: [{ from: 'client', to: 'cdn', fail: true, label: 'miss' }] },
		{ caption: 'CDN caching: the nearest edge does not have it either.', moves: [{ from: 'cdn', to: 'web', fail: true, label: 'miss' }] },
		{ caption: 'Web server caching: a reverse proxy such as Varnish has no stored response.', moves: [{ from: 'web', to: 'app', fail: true, label: 'miss' }] },
		{ caption: 'Application caching: the in-memory cache has the object, so the database is never asked. Each layer that hits saves every layer behind it.', moves: [{ from: 'app', to: 'web', label: 'hit' }] }
	];
</script>

<FlowWalkthrough
	title="A request falls through the cache layers"
	desc="Five layers in a row: browser, CDN, web server, application cache and database."
	viewBox="0 0 830 160"
	{boxes}
	{steps}
/>
