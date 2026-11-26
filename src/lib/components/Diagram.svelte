<script lang="ts">
	import type { Snippet } from 'svelte';

	// Inline SVG figure with an accessible title and description. Draw with the
	// diagram classes (.d-box, .d-line, .d-text, ...) so both themes stay readable.
	let {
		title,
		desc,
		viewBox,
		caption,
		children
	}: { title: string; desc: string; viewBox: string; caption?: string; children: Snippet } = $props();
	const uid = $props.id();
</script>

<figure class="not-prose my-8">
	<div class="rounded-lg bg-raised p-4 shadow-card">
		<svg {viewBox} role="img" aria-labelledby="{uid}-t {uid}-d" class="diagram block h-auto w-full">
			<title id="{uid}-t">{title}</title>
			<desc id="{uid}-d">{desc}</desc>
			{@render children()}
		</svg>
	</div>
	{#if caption}<figcaption class="mt-2 text-sm text-ink-11">{caption}</figcaption>{/if}
</figure>
