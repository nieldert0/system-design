<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
	const dbs = [
		{ label: 'Users DB', x: 20 },
		{ label: 'Products DB', x: 220 },
		{ label: 'Forums DB', x: 420 }
	];
</script>

<Diagram
	title="Federation: one database split by function"
	desc="An app server connects to three separate databases: users, products and forums."
	viewBox="0 0 580 170"
	caption="Each function gets its own database, so each carries less traffic and fits more in memory."
>
	<rect class="d-box" x="215" y="16" width="150" height="44" rx="6" />
	<text class="d-text" x="290" y="42" text-anchor="middle">App server</text>
	{#each dbs as d (d.label)}
		<line class="d-line" x1="290" y1="60" x2={d.x + 70} y2="102" />
		<rect class="d-box" x={d.x} y="110" width="140" height="44" rx="6" />
		<text class="d-text" x={d.x + 70} y="136" text-anchor="middle">{d.label}</text>
	{/each}
</Diagram>
