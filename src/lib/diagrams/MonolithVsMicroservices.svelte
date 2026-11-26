<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';

	const parts = ['Users', 'Catalog', 'Orders'];
</script>

<Diagram
	title="One box vs many services"
	desc="Left: a monolith, one deployable with users, catalog and orders inside, sharing one database. Right: microservices, a gateway in front of separate users, catalog and orders services, each with its own database."
	viewBox="0 0 580 250"
	caption="A monolith ships as one unit with one database; microservices ship separately and each owns its data."
>
	<text class="d-meta" x="110" y="18" text-anchor="middle">Monolith</text>
	<rect class="d-box" x="20" y="30" width="180" height="140" rx="8" />
	{#each parts as p, i (p)}
		<rect class="d-box-strong" x="40" y={46 + i * 40} width="140" height="30" rx="5" />
		<text class="d-on-strong" x="110" y={66 + i * 40} text-anchor="middle">{p}</text>
	{/each}
	<line class="d-line" x1="110" y1="170" x2="110" y2="200" />
	<rect class="d-box" x="50" y="200" width="120" height="36" rx="6" />
	<text class="d-text" x="110" y="223" text-anchor="middle">One database</text>

	<text class="d-meta" x="420" y="18" text-anchor="middle">Microservices</text>
	<rect class="d-box" x="360" y="30" width="120" height="30" rx="6" />
	<text class="d-text" x="420" y="50" text-anchor="middle">API gateway</text>
	{#each parts as svc, i (svc)}
		{@const x = 270 + i * 100}
		<line class="d-line" x1="420" y1="60" x2={x + 45} y2="100" />
		<rect class="d-box-strong" x={x} y="100" width="90" height="34" rx="5" />
		<text class="d-on-strong" x={x + 45} y="122" text-anchor="middle">{svc}</text>
		<line class="d-line" x1={x + 45} y1="134" x2={x + 45} y2="200" />
		<rect class="d-box" x={x + 5} y="200" width="80" height="36" rx="6" />
		<text class="d-meta" x={x + 45} y="223" text-anchor="middle">Its own DB</text>
	{/each}
</Diagram>
