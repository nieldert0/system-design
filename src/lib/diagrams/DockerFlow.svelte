<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'dev', label: 'Dockerfile + code', x: 20, y: 20, w: 160 },
		{ id: 'image', label: 'Image', x: 20, y: 140, w: 160 },
		{ id: 'reg', label: 'Registry', x: 210, y: 80, w: 140 },
		{ id: 'host', label: 'Server', x: 390, y: 20, w: 160 },
		{ id: 'ctr', label: 'Running container', x: 390, y: 140, w: 160 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Build: docker build reads the Dockerfile and produces an image, layer by layer.', moves: [{ from: 'dev', to: 'image' }] },
		{ caption: 'Push: the image is tagged and pushed to a registry such as Docker Hub.', moves: [{ from: 'image', to: 'reg' }] },
		{ caption: 'Pull: any server pulls the same image from the registry.', moves: [{ from: 'reg', to: 'host' }] },
		{ caption: 'Run: the server starts a container from the image, an isolated process with its own filesystem.', moves: [{ from: 'host', to: 'ctr' }] }
	];
</script>

<FlowWalkthrough
	title="Docker: build, push, pull, run"
	desc="Source code and a Dockerfile, the image built from them, a registry, a server, and a container running on it."
	viewBox="0 0 570 200"
	{boxes}
	{steps}
/>
