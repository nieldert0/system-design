<script lang="ts">
	import { resolve } from '$app/paths';
	import { outline } from '#lib/outline.js';
	import { written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';
	import { sectionIcon } from '#lib/icons.js';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
</script>

<div class="max-w-3xl">
	<h1 class="text-3xl tracking-tight text-ink-12">{SITE_NAME}</h1>
	<p class="mt-2 text-base text-ink-11">
		Free notes on the system design topics interviewers ask about. Read the modules in any order.
	</p>

	<div class="mt-10 grid gap-4 sm:grid-cols-2">
		{#each outline as section (section.slug)}
			{@const Icon = sectionIcon(section.slug)}
			<section class="rounded-lg bg-raised p-4 shadow-card">
				<div class="flex items-center gap-3">
					<span class="grid size-8 shrink-0 place-items-center rounded-md bg-ink-3 text-ink-11"><Icon class="size-4" aria-hidden="true" /></span>
					<h2 class="text-base text-ink-12">{section.title}</h2>
					<span class="ml-auto text-xs text-ink-10">{section.modules.length}</span>
				</div>
				<ul class="mt-3 flex flex-col gap-1 text-sm">
					{#each section.modules as mod (mod.slug)}
						<li>
							{#if written.has(mod.slug)}
								<a class="group inline-flex items-center gap-1 underline underline-offset-2" href={resolve('/modules/[slug]', { slug: mod.slug })}>{mod.title}<ArrowRight class="size-3.5 text-ink-10 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" /></a>
							{:else}
								<span class="text-ink-11">{mod.title} <span class="text-xs">· coming soon</span></span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</div>
