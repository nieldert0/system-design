<script lang="ts">
	import { getContext } from 'svelte';
	import type { Source } from '#lib/content.js';

	// A credit chip after a copied, reworded or quoted passage.
	let { id }: { id: string } = $props();
	const sources = getContext<() => Source[]>('sources');
	const src = $derived((sources?.() ?? []).find((s) => s.id === id));
</script>

{#if src}
	<a
		href={src.url}
		class="not-prose ml-1 inline-flex h-5 items-center rounded-full bg-raised px-2 align-[1px] text-xs font-normal text-ink-11 no-underline shadow-button transition-colors duration-150 hover:text-ink-12"
		title="{src.use === 'copied' ? 'Copied from' : src.use === 'quoted' ? 'Quoted from' : 'Reworded from'} {src.title} ({src.license})"
		rel="external noopener"
		target="_blank">{src.title}</a
	>
{/if}
