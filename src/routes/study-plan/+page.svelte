<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { resolve } from '$app/paths';
	import { studyPlan } from '#lib/study-plan.js';
	import { findModule, written } from '#lib/content.js';
	import { progress } from '#lib/progress-state.svelte.js';
	import { SITE_NAME } from '#lib/site.js';

	const tier = $derived(studyPlan.find((t) => t.id === (progress.getTier() ?? 'short'))!);
	const passed = $derived(tier.slugs.filter((s) => progress.isPassed(s)).length);
</script>

<svelte:head><title>Study plan · {SITE_NAME}</title></svelte:head>

<div class="max-w-[68ch]">
	<h1 class="text-3xl tracking-tight text-ink-12">Study plan</h1>
	<p class="mt-2 text-base text-ink-11">How long until your interview? Pick a timeline for a list that fits it.</p>

	<fieldset class="mt-8">
		<legend class="sr-only">Time until your interview</legend>
		<div class="inline-flex rounded-lg p-1 max-md:flex max-md:w-full" style="background: var(--ink-3)">
			{#each studyPlan as t (t.id)}
				<label
					class="relative flex h-8 cursor-pointer items-center rounded-md px-3.5 text-sm text-ink-11 transition-colors duration-150 has-checked:bg-raised has-checked:text-ink-12 has-checked:shadow-button has-focus-visible:outline-2 has-focus-visible:outline-ring max-md:h-11 max-md:flex-1 max-md:justify-center"
				>
					<input
						type="radio"
						name="tier"
						value={t.id}
						class="sr-only"
						checked={tier.id === t.id}
						onchange={() => progress.setTier(t.id)}
					/>
					{t.label}
				</label>
			{/each}
		</div>
	</fieldset>

	<p class="mt-4 text-sm text-ink-11">{tier.summary} {passed} of {tier.slugs.length} passed.</p>

	<ol class="mt-6 flex flex-col">
		{#each tier.slugs as slug, i (slug)}
			{@const mod = findModule(slug)!}
			{@const done = progress.isPassed(slug)}
			<li class="flex min-h-10 items-center gap-3 border-b border-[var(--ink-5)] py-2 text-sm [border-bottom-width:0.5px]">
				<span class="w-6 shrink-0 text-xs text-ink-11 tabular-nums">{i + 1}</span>
				<span class="flex-1">
					{#if written.has(slug)}
						<a class="underline underline-offset-2" href={resolve('/modules/[slug]', { slug })}>{mod.title}</a>
					{:else}
						<span class="text-ink-11">{mod.title} <span class="text-xs">· coming soon</span></span>
					{/if}
					<span class="block text-xs text-ink-11">{mod.sectionTitle}</span>
				</span>
				{#if done}<Check class="size-4 shrink-0 text-green-11" aria-label="Passed" />{/if}
			</li>
		{/each}
	</ol>
</div>
