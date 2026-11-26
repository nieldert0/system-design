<script lang="ts">
	import Walkthrough from '#lib/components/Walkthrough.svelte';

	const steps = [
		'Light load: two requests arrive and the server works on both at once. Each takes 100 ms.',
		'Traffic doubles: two more requests arrive, but both slots are busy, so they wait in a queue.',
		'Requests arrive faster than the server finishes them. The queue grows, so latency is now the wait plus 100 ms.',
		'Add a second server: twice the slots, so throughput doubles and the queue drains.'
	];

	type Pos = [number, number] | null; // null = not on screen
	const A1: Pos = [350, 50], A2: Pos = [410, 50], B1: Pos = [350, 120], B2: Pos = [410, 120];
	const Q = (i: number): Pos => [260 - i * 34, 85];
	// Where each of the seven requests is at each step.
	const at: Pos[][] = [
		[A1, A2, null, null, null, null, null],
		[A1, A2, Q(0), Q(1), null, null, null],
		[A1, A2, Q(0), Q(1), Q(2), Q(3), Q(4)],
		[null, null, A1, A2, B1, B2, Q(0)]
	];
	const queued = (p: Pos) => !!p && p[0] < 300;
	// Off-screen requests wait at the left edge; finished ones leave to the right.
	const place = (p: Pos, i: number, step: number) => p ?? (step === 3 && i < 2 ? [500, 50] : [20, 85]);
</script>

<Walkthrough
	title="How a queue makes latency grow"
	desc="Requests, drawn as dots, arrive at a server with two slots. Extra requests wait in a queue on the left."
	viewBox="0 0 530 160"
	{steps}
>
	{#snippet children(step: number)}
		<text class="d-meta" x="160" y="30" text-anchor="middle">Queue</text>
		<line class="d-line" x1="40" y1="105" x2="290" y2="105" />
		<rect class="d-box" x="320" y="25" width="120" height="50" rx="6" />
		<text class="d-meta" x="452" y="54">Server A</text>
		<g style="opacity: {step === 3 ? 1 : 0}">
			<rect class="d-box" x="320" y="95" width="120" height="50" rx="6" />
			<text class="d-meta" x="452" y="124">Server B</text>
		</g>
		{#each at[step] as p, i (i)}
			{@const [x, y] = place(p, i, step)}
			<g style="transform: translate({x}px, {y}px); opacity: {p ? 1 : 0}">
				<circle r="10" class={queued(p) ? 'd-wait' : 'd-token'} />
			</g>
		{/each}
	{/snippet}
</Walkthrough>
