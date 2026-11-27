<script lang="ts">
	import { getContext } from 'svelte';
	import type { Source } from '#lib/content.js';

	// A numbered footnote marker after a copied, reworded or quoted passage; jumps to the Sources list.
	let { id }: { id: string } = $props();
	const sources = getContext<() => Source[]>('sources');
	const n = $derived((sources?.() ?? []).findIndex((s) => s.id === id));
	const src = $derived(n >= 0 ? sources!()[n] : undefined);
</script>

{#if src}
	<sup class="not-prose ml-0.5"><a
		href="#source-{src.id}"
		class="rounded px-0.5 text-xs font-medium text-ink-11 font-mono tabular-nums no-underline transition-colors duration-150 hover:text-ink-12"
		title="{src.use === 'copied' ? 'Copied from' : src.use === 'quoted' ? 'Quoted from' : 'Reworded from'} {src.title} ({src.license})"
		aria-label="Source {n + 1}: {src.title}">[{n + 1}]</a></sup>
{/if}
