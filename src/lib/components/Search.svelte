<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import FileText from '@lucide/svelte/icons/file-text';
	import Hash from '@lucide/svelte/icons/hash';
	import BookA from '@lucide/svelte/icons/book-a';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Command from '#lib/components/ui/command/index.js';
	import type { SearchEntry } from '../../routes/search.json/+server.js';

	let open = $state(false);
	let entries = $state<SearchEntry[]>([]);
	const icons = { module: FileText, heading: Hash, term: BookA };
	const groups = [
		['module', 'Modules'],
		['heading', 'Sections'],
		['term', 'Glossary']
	] as const;

	// Load the index the first time search opens.
	$effect(() => {
		if (!open || entries.length) return;
		fetch(resolve('/search.json'))
			.then((r) => r.json())
			.then((e) => (entries = e))
			.catch(() => {});
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}

	function select(href: string) {
		open = false;
		goto(href);
	}
</script>

<svelte:window {onkeydown} />

<button
	type="button"
	onclick={() => (open = true)}
	class="inline-flex h-8 items-center gap-2 rounded-md bg-raised px-2.5 text-sm text-ink-11 shadow-button transition-transform duration-150 ease-out active:scale-[.97] max-md:size-11 max-md:justify-center max-md:px-0"
	aria-label="Search"
>
	<SearchIcon class="size-4" aria-hidden="true" />
	<span class="max-md:hidden">Search</span>
	<kbd class="text-xs text-ink-11 max-md:hidden">⌘K</kbd>
</button>

<Command.Dialog bind:open title="Search" description="Search modules, sections and glossary terms">
	<Command.Input placeholder="Search modules, sections and terms…" />
	<Command.List>
		<Command.Empty>No results.</Command.Empty>
		{#each groups as [kind, heading] (kind)}
			{@const items = entries.filter((e) => e.kind === kind)}
			{#if items.length}
				<Command.Group {heading}>
					{#each items as e (e.href)}
						{@const Icon = icons[kind]}
						<Command.Item value="{e.label} {e.context} {e.href}" onSelect={() => select(e.href)}>
							<Icon aria-hidden="true" />
							<span>{e.label}</span>
							<span class="ml-auto truncate text-xs text-ink-11">{e.context}</span>
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		{/each}
	</Command.List>
</Command.Dialog>
