<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'doc', label: 'Doc 9: "Running Shoes"', x: 10, y: 10, w: 190 },
		{ id: 'an', label: 'Analyzer', x: 250, y: 10, w: 110 },
		{ id: 'run', label: 'run → 1, 4, 9', x: 420, y: 10, w: 150 },
		{ id: 'shoe', label: 'shoe → 1, 9', x: 420, y: 90, w: 150 },
		{ id: 'q', label: 'Query: run AND shoe', x: 10, y: 170, w: 190 },
		{ id: 'hit', label: 'Match: 1, 9', x: 250, y: 170, w: 110 },
		{ id: 'seg', label: 'New segment (refresh)', x: 420, y: 250, w: 170 },
		{ id: 'top', label: 'Ranked by BM25', x: 250, y: 250, w: 130 }
	];
	const index = ['doc', 'an', 'run', 'shoe'];
	const steps: FlowStep[] = [
		{ caption: 'A document arrives. The analyzer lowercases, drops stop words and stems: "Running Shoes" becomes run, shoe.', moves: [{ from: 'doc', to: 'an' }], visible: ['doc', 'an'] },
		{ caption: 'Each term appends the document id (and positions) to its posting list, sorted by id.', moves: [{ from: 'an', to: 'run' }, { from: 'an', to: 'shoe' }], visible: index },
		{ caption: 'At the next refresh (about 1 s by default) the buffered postings become a new immutable segment and the document is searchable.', moves: [{ from: 'shoe', to: 'seg' }], visible: [...index, 'seg'], links: [{ from: 'an', to: 'run' }, { from: 'an', to: 'shoe' }] },
		{ caption: 'A query runs through the same analyzer, then intersects the posting lists, starting from the shorter one.', moves: [{ from: 'q', to: 'shoe' }, { from: 'q', to: 'run' }], visible: [...index, 'seg', 'q'] },
		{ caption: 'Documents in both lists match: 1 and 9. Positions confirm phrase matches.', moves: [{ from: 'shoe', to: 'hit' }, { from: 'run', to: 'hit' }], visible: [...index, 'seg', 'q', 'hit'] },
		{ caption: 'Matches are scored with BM25 (rare terms count more, long documents are normalised) and the top results return.', moves: [{ from: 'hit', to: 'top' }], visible: [...index, 'seg', 'q', 'hit', 'top'] }
	];
</script>

<FlowWalkthrough
	title="Indexing and querying an inverted index"
	desc="A document is analysed into terms, appended to posting lists, made searchable by refresh, then found by intersecting lists and ranked."
	viewBox="0 0 600 300"
	{boxes}
	{steps}
/>
