<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { outline } from '#lib/outline.js';
	import { written } from '#lib/content.js';
	import { sectionIcon } from '#lib/icons.js';
	import Check from '@lucide/svelte/icons/check';
	import { progress } from '#lib/progress-state.svelte.js';

	let { onnavigate }: { onnavigate?: () => void } = $props();
</script>

<nav aria-label="Modules" class="flex flex-col gap-6 text-sm">
	{#each outline as section (section.slug)}
		{@const Icon = sectionIcon(section.slug)}
		<div>
			<h2 class="mb-1 flex items-center gap-1.5 px-2 text-xs text-ink-11"><Icon class="size-3.5" aria-hidden="true" />{section.title}</h2>
			<ul class="flex flex-col gap-px">
				{#each section.modules as mod (mod.slug)}
					<li>
						{#if written.has(mod.slug)}
							{@const current = page.params.slug === mod.slug}
							<a
								href={resolve('/modules/[slug]', { slug: mod.slug })}
								onclick={onnavigate}
								aria-current={current ? 'page' : undefined}
								class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-accent aria-[current=page]:bg-raised aria-[current=page]:shadow-button"
								><span class="flex-1">{mod.title}</span
								>{#if progress.isPassed(mod.slug)}<Check class="size-3.5 shrink-0 text-green-11" aria-label="Passed" />{/if}</a
							>
						{:else}
							<span class="block px-2 py-1.5 text-ink-11">{mod.title} <span class="text-xs">· soon</span></span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</nav>
