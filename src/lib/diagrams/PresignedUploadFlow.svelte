<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client', x: 20, y: 100, w: 100 },
		{ id: 'api', label: 'Your API', x: 210, y: 20, w: 120 },
		{ id: 'db', label: 'Database', x: 420, y: 20, w: 120 },
		{ id: 's3', label: 'Object storage', x: 210, y: 180, w: 140 },
		{ id: 'cdn', label: 'CDN', x: 420, y: 180, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: '1. The client asks your API for permission to upload.', moves: [{ from: 'c', to: 'api' }] },
		{ caption: '2. The API returns a short-lived pre-signed URL for one key.', moves: [{ from: 'api', to: 'c', label: 'URL' }] },
		{ caption: '3. The client uploads the file directly to object storage.', moves: [{ from: 'c', to: 's3' }] },
		{ caption: '4. The API saves the key and metadata in the database.', moves: [{ from: 'api', to: 'db' }] },
		{ caption: '5. Reads go through a CDN with object storage as the origin.', moves: [{ from: 'cdn', to: 's3' }, { from: 'cdn', to: 'c' }] }
	];
</script>

<FlowWalkthrough
	title="Uploading with a pre-signed URL"
	desc="A client, your API, a database, object storage and a CDN."
	viewBox="0 0 560 240"
	{boxes}
	{steps}
/>
