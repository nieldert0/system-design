<script lang="ts">
	import { resolve } from '$app/paths';
	import { glossary } from '#lib/glossary.js';
	import { findModule, written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';

	const terms = [...glossary].sort((a, b) => a.term.localeCompare(b.term));
</script>

<svelte:head><title>Glossary · {SITE_NAME}</title></svelte:head>

<div class="max-w-[68ch]">
	<h1 class="text-3xl tracking-tight text-ink-12">Glossary</h1>
	<p class="mt-2 text-base text-ink-11">Every term the modules define, with where the definition comes from.</p>

	<dl class="mt-10 flex flex-col gap-6">
		{#each terms as e (e.id)}
			{@const mod = findModule(e.module)}
			<div id={e.id} class="scroll-mt-16">
				<dt class="text-base text-ink-12">{e.term}</dt>
				<dd class="mt-1 text-sm text-ink-12">{e.definition}</dd>
				<dd class="mt-1 text-xs text-ink-11">
					Source: <a class="underline underline-offset-2" href={e.source.url} rel="external noopener" target="_blank"
						>{e.source.title}</a
					>
					· {e.source.license}
					{#if mod}
						· Taught in
						{#if written.has(mod.slug)}
							<a class="underline underline-offset-2" href={resolve('/modules/[slug]', { slug: mod.slug })}>{mod.title}</a>
						{:else}{mod.title} (planned){/if}
					{/if}
				</dd>
			</div>
		{/each}
	</dl>
</div>
