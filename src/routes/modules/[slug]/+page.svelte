<script lang="ts">
	import { setContext } from 'svelte';
	import { resolve } from '$app/paths';
	import { findModule, neighbours, written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';
	import { sectionIcon } from '#lib/icons.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Quiz from '#lib/components/Quiz.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// Source chips read the module's sources from here.
	setContext('sources', () => data.meta.sources);
	setContext('module-slug', () => data.slug);
	// Glossary terms: the first <Term> per id in this module claims the underline.
	let seen = new Set<string>();
	let seenFor = '';
	setContext('glossary-claim', (id: string) => {
		if (seenFor !== data.slug) [seen, seenFor] = [new Set(), data.slug];
		const first = !seen.has(id);
		seen.add(id);
		return first;
	});
	const nav = $derived(neighbours(data.slug));
	const SectionIcon = $derived(sectionIcon(data.meta.section));
	const readFirst = $derived((data.meta.readFirst ?? []).map((s: string) => findModule(s)!));
</script>

<svelte:head><title>{data.meta.title} · {SITE_NAME}</title></svelte:head>

{#snippet modLink(mod: { slug: string; title: string }, soon = 'coming soon')}
	{#if written.has(mod.slug)}
		<a class="underline underline-offset-2" href={resolve('/modules/[slug]', { slug: mod.slug })}>{mod.title}</a>
	{:else}
		<span class="text-ink-11">{mod.title} <span class="text-xs">· {soon}</span></span>
	{/if}
{/snippet}

<article class="max-w-[68ch]">
	<p class="flex items-center gap-1.5 text-sm text-ink-11"><SectionIcon class="size-4" aria-hidden="true" />{data.sectionTitle}</p>
	<h1 class="mt-1 text-3xl tracking-tight text-ink-12">{data.meta.title}</h1>

	{#if readFirst.length}
		<p class="mt-4 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-11">
			<BookOpen class="size-4" aria-hidden="true" />Helps to read first:
			{#each readFirst as mod, i (mod.slug)}{#if i}, {/if}{@render modLink(mod)}{/each}
		</p>
	{/if}

	<div class="prose mt-8 max-w-none prose-h2:mt-10">
		<data.component />
	</div>

	<Quiz slug={data.slug} questions={data.meta.quiz} />

	<section class="mt-12">
		<h2 class="text-xl text-ink-12">Sources</h2>
		<ul class="mt-3 flex flex-col gap-2 text-sm">
			{#each data.meta.sources as s (s.id)}
				<li>
					<a class="underline underline-offset-2" href={s.url} rel="external noopener" target="_blank">{s.title}<ArrowUpRight class="ml-0.5 inline size-3.5 align-[-2px] text-ink-10" aria-hidden="true" /></a>
					<span class="text-ink-11">· {s.license} · {s.use}</span>
				</li>
			{/each}
		</ul>
	</section>

	<nav aria-label="Previous and next" class="mt-12 flex justify-between gap-4 text-sm">
		<div>{#if nav.prev}<span class="flex items-center gap-1 text-xs text-ink-11"><ArrowLeft class="size-3.5" aria-hidden="true" />Previous</span>{@render modLink(nav.prev, 'soon')}{/if}</div>
		<div class="text-right">{#if nav.next}<span class="flex items-center justify-end gap-1 text-xs text-ink-11">Next<ArrowRight class="size-3.5" aria-hidden="true" /></span>{@render modLink(nav.next, 'soon')}{/if}</div>
	</nav>
</article>
