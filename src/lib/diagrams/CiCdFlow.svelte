<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'commit', label: 'Commit', x: 10, y: 40, w: 110 },
		{ id: 'test', label: 'Test', x: 155, y: 40, w: 110 },
		{ id: 'build', label: 'Build', x: 300, y: 40, w: 110 },
		{ id: 'deploy', label: 'Deploy', x: 445, y: 40, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Commit: a developer merges a small change to the main branch, which triggers the pipeline.', moves: [{ from: 'commit', to: 'test' }] },
		{ caption: 'Test: the CI server runs the automated tests. A failure stops the pipeline here.', moves: [{ from: 'test', to: 'build' }] },
		{ caption: 'Build: the pipeline builds one versioned artifact, such as a container image.', moves: [{ from: 'build', to: 'deploy' }] },
		{ caption: 'Deploy: the same artifact goes to staging and then production.', moves: [{ from: 'deploy', to: 'deploy' }] }
	];
</script>

<FlowWalkthrough
	title="A CI/CD pipeline: commit, test, build, deploy"
	desc="Four pipeline stages from left to right."
	viewBox="0 0 570 110"
	{boxes}
	{steps}
/>
