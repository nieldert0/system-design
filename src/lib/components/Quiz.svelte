<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import type { Question } from '#lib/content.js';
	import { progress } from '#lib/progress-state.svelte.js';
	import { PASS_THRESHOLD } from '#lib/progress.js';

	let { slug, questions }: { slug: string; questions: Question[] } = $props();

	// Reset whenever the module (and so the question list) changes; also correct during prerender.
	let answers = $derived<(number | null)[]>(questions.map(() => null));
	let root: HTMLElement;

	const answered = $derived(answers.filter((a) => a !== null).length);
	const correct = $derived(answers.filter((a, i) => a === questions[i]?.correct).length);
	const done = $derived(questions.length > 0 && answered === questions.length);
	const best = $derived(progress.bestScore(slug));

	function choose(qi: number, oi: number) {
		if (answers[qi] !== null) return;
		answers = answers.with(qi, oi);
		if (answers.every((a) => a !== null)) progress.recordScore(slug, correct, questions.length);
	}

	async function retry() {
		answers = questions.map(() => null);
		await tick();
		root.querySelector<HTMLButtonElement>('button')?.focus();
	}
</script>

<section bind:this={root} aria-labelledby="quiz-title" class="mt-12">
	<div class="flex items-baseline gap-3">
		<h2 id="quiz-title" class="text-xl text-ink-12">Quiz</h2>
		{#if best !== undefined}
			<span class="text-xs text-ink-11">Best {Math.round(best * 100)}%{best >= PASS_THRESHOLD ? ' · passed' : ''}</span>
		{/if}
	</div>
	<p class="mt-1 text-sm text-ink-11">
		Pass with {Math.round(PASS_THRESHOLD * 100)}% or more. Your best score is saved in this browser.
	</p>

	<ol class="mt-6 flex flex-col gap-8">
		{#each questions as q, qi (qi)}
			{@const picked = answers[qi]}
			<li role="group" aria-labelledby="q{qi}">
				<p id="q{qi}" class="text-base text-ink-12">{qi + 1}. {q.prompt}</p>
				<div class="mt-3 flex flex-col gap-2">
					{#each q.options as option, oi (oi)}
						{@const isRight = picked !== null && oi === q.correct}
						{@const isWrong = picked === oi && oi !== q.correct}
						<button
							type="button"
							onclick={() => choose(qi, oi)}
							aria-disabled={picked !== null}
							aria-pressed={picked === oi}
							class={[
								'flex min-h-9 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-[background-color,color,transform] duration-150 ease-out max-md:min-h-11',
								picked === null && 'bg-raised text-ink-12 shadow-button active:scale-[.99]',
								picked !== null && !isRight && !isWrong && 'bg-raised text-ink-11 shadow-button',
								isRight && 'badge-green',
								isWrong && 'badge-red'
							]}
						>
							<span class="flex-1">{option}</span>
							{#if isRight}<Check class="size-4 shrink-0" aria-label="Correct answer" />{/if}
							{#if isWrong}<X class="size-4 shrink-0" aria-label="Your answer, wrong" />{/if}
						</button>
					{/each}
				</div>
				<p aria-live="polite" class="mt-2 text-sm text-ink-11">
					{#if picked !== null}
						<span class={picked === q.correct ? 'text-green-11' : 'text-red-11'}>{picked === q.correct ? 'Right.' : 'Not quite.'}</span>
						{q.explanation}
					{/if}
				</p>
			</li>
		{/each}
	</ol>

	{#if done}
		<div class="mt-8 flex flex-wrap items-center gap-4" aria-live="polite">
			<p class="text-base text-ink-12">
				You got {correct} of {questions.length}{correct / questions.length >= PASS_THRESHOLD ? ', passed.' : '.'}
			</p>
			<button
				type="button"
				onclick={retry}
				class="h-9 rounded-md bg-primary px-3.5 text-sm tracking-ui text-primary-foreground transition-transform duration-150 ease-out active:scale-[.97] max-md:h-11"
				>Try again</button
			>
		</div>
	{/if}
</section>
