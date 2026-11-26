<script lang="ts">
	import { resolve } from '$app/paths';
	import { outline } from '#lib/outline.js';
	import { written } from '#lib/content.js';
	import { SITE_NAME } from '#lib/site.js';
</script>

<div class="max-w-3xl">
	<h1 class="text-3xl tracking-tight text-ink-12">{SITE_NAME}</h1>
	<p class="mt-2 text-base text-ink-11">
		Free notes on the system design topics interviewers ask about. Read the modules in any order.
	</p>

	<div class="mt-10 grid gap-4 sm:grid-cols-2">
		{#each outline as section (section.slug)}
			<section class="rounded-lg bg-raised p-4 shadow-card">
				<h2 class="text-base text-ink-12">{section.title}</h2>
				<ul class="mt-2 flex flex-col gap-1 text-sm">
					{#each section.modules as mod (mod.slug)}
						<li>
							{#if written.has(mod.slug)}
								<a class="underline underline-offset-2" href={resolve('/modules/[slug]', { slug: mod.slug })}>{mod.title}</a>
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
