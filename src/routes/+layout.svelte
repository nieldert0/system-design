<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Menu from '@lucide/svelte/icons/menu';
	import { resolve } from '$app/paths';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { SITE_NAME } from '#lib/site.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let menuOpen = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{SITE_NAME}</title>
</svelte:head>

<header class="sticky top-0 z-40 flex h-13 items-center gap-2 bg-background/90 px-4 backdrop-blur md:px-6">
	<Sheet.Root bind:open={menuOpen}>
		<Sheet.Trigger>
			{#snippet child({ props }: { props: Record<string, unknown> })}
				<Button {...props} variant="ghost" size="icon" class="md:hidden" aria-label="Open menu"><Menu /></Button>
			{/snippet}
		</Sheet.Trigger>
		<Sheet.Content side="left" class="overflow-y-auto bg-background p-4 pt-12">
			<Sheet.Title class="sr-only">Modules</Sheet.Title>
			<Sidebar onnavigate={() => (menuOpen = false)} />
		</Sheet.Content>
	</Sheet.Root>
	<a href={resolve('/')} class="text-sm text-ink-12">{SITE_NAME}</a>
	<div class="ml-auto"><ThemeToggle /></div>
</header>

<div class="mx-auto flex max-w-6xl gap-10 px-4 md:px-6">
	<aside class="sticky top-13 hidden h-[calc(100dvh-3.25rem)] w-60 shrink-0 overflow-y-auto pt-4 pb-10 md:block">
		<Sidebar />
	</aside>
	<main class="min-w-0 flex-1 pt-6 pb-16">
		{@render children()}
	</main>
</div>

<footer class="px-4 py-8 text-center text-xs text-ink-11 md:px-6">
	Content is licensed <a class="underline" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
	Passages from other sources are credited where they appear; we claim no rights to the original sources.
</footer>
