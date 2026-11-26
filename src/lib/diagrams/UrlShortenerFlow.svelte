<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'client', label: 'Client', x: 20, y: 80, w: 110 },
		{ id: 'api', label: 'Web server', x: 170, y: 80, w: 130 },
		{ id: 'id', label: 'ID generator', x: 340, y: 20, w: 140 },
		{ id: 'cache', label: 'Cache', x: 340, y: 140, w: 140 },
		{ id: 'db', label: 'Database', x: 510, y: 80, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Create: the client posts a long URL to the web server.', moves: [{ from: 'client', to: 'api' }] },
		{ caption: 'Generate ID: the server gets a unique short key, such as a counter encoded in base62.', moves: [{ from: 'api', to: 'id' }] },
		{ caption: 'Store: the server saves short key → long URL in the database and returns the short link.', moves: [{ from: 'api', to: 'db' }, { from: 'api', to: 'client' }] },
		{ caption: 'Redirect: a visitor opens the short link, and the server looks the key up in the cache first.', moves: [{ from: 'client', to: 'api' }, { from: 'api', to: 'cache' }] },
		{ caption: 'On a cache miss, the server reads the database and fills the cache for next time.', moves: [{ from: 'cache', to: 'db', fail: true, label: 'miss' }, { from: 'db', to: 'cache' }] },
		{ caption: 'The server replies 301 with the long URL in the Location header, and the browser follows it.', moves: [{ from: 'api', to: 'client', label: '301' }] }
	];
</script>

<FlowWalkthrough
	title="URL shortener: create a link, then follow it"
	desc="A client, a web server, an ID generator, a cache and a database."
	viewBox="0 0 650 200"
	{boxes}
	{steps}
/>
