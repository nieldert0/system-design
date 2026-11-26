<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
	const groups = [
		{ who: 'Owner', bits: 'rwx', sum: '4+2+1 = 7', x: 20 },
		{ who: 'Group', bits: 'r-x', sum: '4+0+1 = 5', x: 220 },
		{ who: 'Others', bits: 'r-x', sum: '4+0+1 = 5', x: 420 }
	];
</script>

<Diagram
	title="Permission bits: rwxr-xr-x is 755"
	desc="Three groups of three bits, for owner, group and others. Read is 4, write 2, execute 1; each group's sum is one octal digit, giving 755."
	viewBox="0 0 620 150"
	caption="Each digit of chmod 755 is one group's read + write + execute."
>
	{#each groups as g (g.who)}
		<text class="d-meta" x={g.x + 90} y="24" text-anchor="middle">{g.who}</text>
		<rect class="d-box" x={g.x} y="36" width="180" height="50" rx="6" />
		<text class="d-text" x={g.x + 90} y="67" text-anchor="middle" font-family="monospace">{g.bits}</text>
		<text class="d-meta" x={g.x + 90} y="112" text-anchor="middle">{g.sum}</text>
	{/each}
	<text class="d-text" x="310" y="140" text-anchor="middle">r = 4 · w = 2 · x = 1</text>
</Diagram>
