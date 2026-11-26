<script lang="ts">
	import type { Snippet } from 'svelte';
	import Diagram from './Diagram.svelte';

	// Step-by-step animated diagram. Play, Step and Reset; CSS transitions only.
	// Under reduced motion there is no Play and no movement: Step swaps states at once.
	let {
		title,
		desc,
		viewBox,
		steps,
		dwell = () => 2600,
		children
	}: {
		title: string;
		desc: string;
		viewBox: string;
		steps: string[];
		dwell?: (step: number) => number; // ms each step stays up while playing; long enough to read the caption
		children: Snippet<[number]>;
	} = $props();

	let step = $state(0);
	let playing = $state(false);
	let reduced = $state(false);
	const last = $derived(step === steps.length - 1);

	$effect(() => {
		const mq = matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		const on = () => (reduced = mq.matches);
		mq.addEventListener('change', on);
		return () => mq.removeEventListener('change', on);
	});

	$effect(() => {
		if (!playing || reduced) return;
		const t = setTimeout(() => {
			if (step < steps.length - 1) step++;
			else playing = false;
		}, dwell(step));
		return () => clearTimeout(t);
	});

	const btn =
		'h-8 rounded-md px-3 text-sm tracking-[-0.01em] transition-transform duration-150 ease-out active:scale-[.97] disabled:opacity-60 max-md:h-11';
</script>

<div class="walkthrough not-prose my-8" class:reduced>
	<Diagram {title} desc="{desc} Step {step + 1} of {steps.length}: {steps[step]}" {viewBox} fit>
		{@render children(step)}
	</Diagram>
	<div class="mt-3 flex flex-wrap items-center gap-2">
		{#if !reduced}
			<button
				type="button"
				class="{btn} bg-primary text-primary-foreground"
				onclick={() => {
					if (last) step = 0;
					playing = !playing;
				}}>{playing ? 'Pause' : 'Play'}</button
			>
		{/if}
		<button
			type="button"
			class="{btn} bg-raised text-ink-12 shadow-button"
			disabled={last}
			onclick={() => {
				playing = false;
				step++;
			}}>Step</button
		>
		<button
			type="button"
			class="{btn} bg-raised text-ink-12 shadow-button"
			disabled={step === 0 && !playing}
			onclick={() => {
				playing = false;
				step = 0;
			}}>Reset</button
		>
		<span class="text-xs text-ink-11">Step {step + 1} of {steps.length}</span>
	</div>
	<p aria-live="polite" class="mt-2 min-h-[3lh] text-sm text-ink-12">{steps[step]}</p>
</div>
