<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
	const shapes = [
		{ title: 'Key-value', lines: ['user:42 → \"Ana\"', 'cart:7 → [3, 9]'] },
		{ title: 'Document', lines: ['{ id: 42, name: \"Ana\",', '  tags: [\"pro\"] }'] },
		{ title: 'Wide column', lines: ['row 42 │ name │ city', '       │ Ana  │ Oslo'] },
		{ title: 'Graph', lines: ['(Ana) —follows→ (Bo)', '(Bo) —likes→ (Post 7)'] }
	];
</script>

<Diagram
	title="The four NoSQL data shapes"
	desc="Four panels: key-value pairs, a JSON document, a wide-column row with column families, and a graph of nodes and relationships."
	viewBox="0 0 680 150"
	caption="Same data, four shapes: a hash table, a document, a nested map, and a graph."
>
	{#each shapes as s, i (s.title)}
		<rect class="d-box" x={10 + i * 168} y="16" width="156" height="118" rx="6" />
		<text class="d-text" x={88 + i * 168} y="42" text-anchor="middle">{s.title}</text>
		{#each s.lines as line, j (j)}
			<text class="d-meta" x={20 + i * 168} y={78 + j * 22} font-family="monospace">{line}</text>
		{/each}
	{/each}
</Diagram>
