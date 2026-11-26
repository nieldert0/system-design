<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Menu from '@lucide/svelte/icons/menu';
	import Layers from '@lucide/svelte/icons/layers';
	import { resolve } from '$app/paths';
	import * as Sheet from '#lib/components/ui/sheet/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import Sidebar from '#lib/components/Sidebar.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import Search from '#lib/components/Search.svelte';
	import { SITE_NAME } from '#lib/site.js';
	import { hydrateProgress } from '#lib/progress-state.svelte.js';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let menuOpen = $state(false);
	onMount(hydrateProgress);
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
			<nav aria-label="Pages" class="mb-6 flex flex-col gap-px text-sm">
				<a href={resolve('/study-plan')} onclick={() => (menuOpen = false)} class="flex min-h-11 items-center rounded-md px-2">Study plan</a>
				<a href={resolve('/glossary')} onclick={() => (menuOpen = false)} class="flex min-h-11 items-center rounded-md px-2">Glossary</a>
			</nav>
			<Sidebar onnavigate={() => (menuOpen = false)} />
		</Sheet.Content>
	</Sheet.Root>
	<a href={resolve('/')} class="flex items-center gap-2 text-sm text-ink-12"
		><span class="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground"><Layers class="size-3.5" aria-hidden="true" /></span>{SITE_NAME}</a
	>
	<nav class="ml-auto flex items-center gap-1">
		<Search />
		<a href={resolve('/study-plan')} class="rounded-md px-2.5 py-1.5 text-sm text-ink-11 transition-colors duration-150 hover:text-ink-12 max-md:hidden">Study plan</a>
		<a href={resolve('/glossary')} class="rounded-md px-2.5 py-1.5 text-sm text-ink-11 transition-colors duration-150 hover:text-ink-12 max-md:hidden">Glossary</a>
		<ThemeToggle />
	</nav>
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
