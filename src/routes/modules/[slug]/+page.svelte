<script lang="ts">
	import { setContext } from 'svelte';
	import { resolve } from '$app/paths';
	import { findModule, neighbours, written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// Source chips read the module's sources from here.
	setContext('sources', () => data.meta.sources);
	const nav = $derived(neighbours(data.slug));
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
	<p class="text-sm text-ink-11">{data.sectionTitle}</p>
	<h1 class="mt-1 text-3xl tracking-tight text-ink-12">{data.meta.title}</h1>

	{#if readFirst.length}
		<p class="mt-4 text-sm text-ink-11">
			Helps to read first:
			{#each readFirst as mod, i (mod.slug)}{#if i}, {/if}{@render modLink(mod)}{/each}
		</p>
	{/if}

	<div class="prose mt-8 max-w-none prose-h2:mt-10">
		<data.component />
	</div>

	<section class="mt-12">
		<h2 class="text-xl text-ink-12">Sources</h2>
		<ul class="mt-3 flex flex-col gap-2 text-sm">
			{#each data.meta.sources as s (s.id)}
				<li>
					<a class="underline underline-offset-2" href={s.url} rel="external noopener" target="_blank">{s.title}</a>
					<span class="text-ink-11">· {s.license} · {s.use}</span>
				</li>
			{/each}
		</ul>
	</section>

	<nav aria-label="Previous and next" class="mt-12 flex justify-between gap-4 text-sm">
		<div>{#if nav.prev}<span class="block text-xs text-ink-11">Previous</span>{@render modLink(nav.prev, 'soon')}{/if}</div>
		<div class="text-right">{#if nav.next}<span class="block text-xs text-ink-11">Next</span>{@render modLink(nav.next, 'soon')}{/if}</div>
	</nav>
</article>
