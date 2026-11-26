<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'app', label: 'Transfer: A → B, 100', x: 20, y: 90, w: 180 },
		{ id: 'a', label: 'Account A: 500', x: 280, y: 20, w: 160 },
		{ id: 'a2', label: 'Account A: 400', x: 280, y: 20, w: 160 },
		{ id: 'b', label: 'Account B: 200', x: 280, y: 160, w: 160 },
		{ id: 'log', label: 'Write-ahead log', x: 490, y: 90, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'BEGIN: the transfer starts a transaction. Each change is written to the log first.', moves: [{ from: 'app', to: 'log' }], visible: ['app', 'a', 'b', 'log'] },
		{ caption: 'Debit A by 100.', moves: [{ from: 'app', to: 'a2' }], visible: ['app', 'a2', 'b', 'log'] },
		{ caption: 'The server crashes before B is credited and before COMMIT.', moves: [{ from: 'app', to: 'b', fail: true, label: 'crash' }], visible: ['app', 'a2', 'b', 'log'] },
		{ caption: 'On restart, the log shows an uncommitted transaction, so it is rolled back: A is 500 again and no money vanished.', moves: [{ from: 'log', to: 'a', label: 'undo' }], visible: ['app', 'a', 'b', 'log'] }
	];
</script>

<FlowWalkthrough
	title="A transfer crashes halfway and is rolled back"
	desc="A transfer between two accounts, with a write-ahead log, interrupted by a crash."
	viewBox="0 0 660 220"
	{boxes}
	{steps}
/>
