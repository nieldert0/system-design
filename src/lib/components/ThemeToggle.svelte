<script lang="ts">
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import { Button } from '#lib/components/ui/button/index.js';

	let dark = $state(false);
	$effect(() => {
		dark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		try {
			localStorage.setItem('theme', dark ? 'dark' : 'light');
		} catch {
			// Storage blocked: the choice lasts for this page view only.
		}
	}
</script>

<Button variant="ghost" size="icon" onclick={toggle} aria-label={dark ? 'Use light theme' : 'Use dark theme'}>
	{#if dark}<Sun />{:else}<Moon />{/if}
</Button>
