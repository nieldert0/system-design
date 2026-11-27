<script lang="ts">
	import { getContext, untrack, type Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { glossary } from '#lib/glossary.js';
	import { findModule, written } from '#lib/content.js';

	// A glossary term in module prose. Only the first occurrence per module is marked.
	let { id, children }: { id: string; children: Snippet } = $props();
	const claim = getContext<((id: string) => boolean) | undefined>('glossary-claim');
	const first = claim ? claim(untrack(() => id)) : true; // claimed once, at mount
	const entry = $derived(glossary.find((e) => e.id === id));
	const teacher = $derived(entry && written.has(entry.module) ? findModule(entry.module) : undefined);
	const here = getContext<(() => string) | undefined>('module-slug');

	let open = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	// Hover opens on a fine pointer only; touch and keyboard use the trigger's own tap/Enter.
	const hover = (next: boolean) => (e: PointerEvent) => {
		if (e.pointerType !== 'mouse') return;
		clearTimeout(timer);
		timer = setTimeout(() => (open = next), next ? 150 : 200);
	};
</script>

{#if first && entry}
	<Popover.Root bind:open>
		<Popover.Trigger
			onpointerenter={hover(true)}
			onpointerleave={hover(false)}
			class="cursor-help rounded-xs underline decoration-ink-9 decoration-dotted underline-offset-4 hover:decoration-ink-12"
			>{@render children()}</Popover.Trigger
		>
		<Popover.Content
			onpointerenter={hover(true)}
			onpointerleave={hover(false)}
			class="w-80 gap-2 bg-raised p-3 ring-0 shadow-popover"
		>
			<p class="text-base text-ink-12">{entry.term}</p>
			<p class="text-sm text-ink-12">{entry.definition}</p>
			<p class="text-xs text-ink-11">
				Source: <a class="underline underline-offset-2" href={entry.source.url} rel="external noopener" target="_blank"
					>{entry.source.title}</a
				> · {entry.source.license}
			</p>
			{#if teacher && teacher.slug !== here?.()}
				<a class="text-sm underline underline-offset-2" href={resolve('/modules/[slug]', { slug: teacher.slug })}
					>Learn more in {teacher.title}</a
				>
			{/if}
		</Popover.Content>
	</Popover.Root>
{:else}
	{@render children()}
{/if}
