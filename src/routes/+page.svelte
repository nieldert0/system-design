<script lang="ts">
	import { resolve } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { outline, allModules } from '#lib/outline.js';
	import { written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';
	import { sectionIcon } from '#lib/icons.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { studyPlan } from '#lib/study-plan.js';
	import { findModule } from '#lib/content.js';
	import { progress } from '#lib/progress-state.svelte.js';

	// Continue: the next unfinished, written module in the remembered tier.
	const tier = $derived(studyPlan.find((t) => t.id === progress.getTier()));
	const next = $derived(tier && progress.nextUnfinished(tier.slugs.filter((s) => written.has(s))));
	const nextMod = $derived(next ? findModule(next) : undefined);
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	// Written modules in reading order, each with the section it belongs to.
	const ready = outline.flatMap((s) => s.modules.filter((m) => written.has(m.slug)).map((m) => ({ ...m, section: s })));
	const planned = allModules.length - ready.length;
	// Opened by default when linked to as #roadmap.
	let roadmapOpen = $state(false);
	afterNavigate(() => {
		if (location.hash === '#roadmap') roadmapOpen = true;
	});
	const href = (slug: string) => resolve('/modules/[slug]', { slug });
</script>

<div class="max-w-3xl">
	<h1 class="text-3xl tracking-tight text-ink-12">{SITE_NAME}</h1>
	<p class="mt-2 text-base text-ink-11">
		Free, sourced notes on the system design topics interviewers ask about.
	</p>

	{#if ready.length}
		{@const [first, ...rest] = ready}
		{@const Icon = sectionIcon(first.section.slug)}
		<a
			href={href(first.slug)}
			class="group mt-10 flex items-center gap-4 rounded-lg bg-raised p-5 shadow-card transition-transform duration-150 ease-[cubic-bezier(.23,1,.32,1)] active:scale-[.99] motion-reduce:transition-none motion-reduce:active:scale-100"
		>
			<span class="grid size-10 shrink-0 place-items-center rounded-md bg-ink-3 text-ink-11"><Icon class="size-5" aria-hidden="true" /></span>
			<span class="min-w-0 flex-1">
				<span class="block text-sm text-ink-11">Start reading · {first.section.title}</span>
				<span class="block text-xl text-ink-12">{first.title}</span>
			</span>
			<span class="hidden h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm tracking-[-0.01em] text-primary-foreground sm:inline-flex"
				>Read<ArrowRight class="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" /></span
			>
		</a>

		{#if rest.length}
			<ul class="mt-4 flex flex-col gap-1 text-sm">
				{#each rest as mod (mod.slug)}
					<li><a class="underline underline-offset-2" href={href(mod.slug)}>{mod.title}</a> <span class="text-ink-10">· {mod.section.title}</span></li>
				{/each}
			</ul>
		{/if}
	{/if}

	{#if planned}
		<details id="roadmap" class="group/roadmap mt-12 scroll-mt-16" bind:open={roadmapOpen}>
			<summary class="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm text-ink-11 hover:text-ink-12 [&::-webkit-details-marker]:hidden">
				<ChevronDown class="size-4 transition-transform duration-150 group-open/roadmap:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
				{planned} more planned
			</summary>
			<div class="mt-4 grid gap-4 sm:grid-cols-2">
				{#each outline as section (section.slug)}
					{@const Icon = sectionIcon(section.slug)}
					{@const done = section.modules.filter((m) => written.has(m.slug)).length}
					<section class="rounded-lg bg-raised p-4 shadow-card">
						<div class="flex items-center gap-2">
							<Icon class="size-4 text-ink-10" aria-hidden="true" />
							<h2 class="text-base text-ink-12">{section.title}</h2>
							<span class="ml-auto text-xs text-ink-10 tabular-nums">{done}/{section.modules.length}</span>
						</div>
						<ul class="mt-3 flex flex-col gap-1 text-sm">
							{#each section.modules as mod (mod.slug)}
								<li>
									{#if written.has(mod.slug)}
										<a class="text-ink-12 underline underline-offset-2" href={href(mod.slug)}>{mod.title}</a>
									{:else}
										<span class="text-ink-10">{mod.title}<span class="sr-only"> (planned)</span></span>
									{/if}
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		</details>
	{/if}
</div>
