<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const bits = Array.from({ length: 8 }, (_, i) => ({ id: 'b' + i, label: `bit ${i}`, x: 10 + i * 72, y: 250, w: 60 }));
	const boxes: FlowBox[] = [
		{ id: 'x', label: '"apple"', x: 60, y: 20, w: 110 },
		{ id: 'y', label: '"pear"', x: 240, y: 20, w: 110 },
		{ id: 'q', label: '"plum"', x: 420, y: 20, w: 110 },
		{ id: 'h', label: 'k = 3 hashes', x: 220, y: 130, w: 150 },
		...bits
	];
	const all = boxes.map((b) => b.id);
	const steps: FlowStep[] = [
		{ caption: 'Start with an array of m bits, all 0, and k hash functions (here m = 8, k = 3).', moves: [], visible: ['h', ...bits.map((b) => b.id)] },
		{ caption: 'Insert "apple": its three hashes point at bits 1, 4 and 6, which are set to 1.', moves: [{ from: 'x', to: 'h' }, { from: 'h', to: 'b1' }, { from: 'h', to: 'b4' }, { from: 'h', to: 'b6' }], visible: ['x', 'h', ...bits.map((b) => b.id)] },
		{ caption: 'Insert "pear": bits 3, 4 and 6. Bits 4 and 6 were already 1 and are shared.', moves: [{ from: 'y', to: 'h' }, { from: 'h', to: 'b3' }, { from: 'h', to: 'b4' }, { from: 'h', to: 'b6' }], visible: ['x', 'y', 'h', ...bits.map((b) => b.id)] },
		{ caption: 'Query "plum": its hashes hit bits 0, 3 and 6. Bit 0 is 0, so "plum" is definitely not in the set; no disk read needed.', moves: [{ from: 'q', to: 'h' }, { from: 'h', to: 'b0', fail: true, label: '0' }, { from: 'h', to: 'b3' }, { from: 'h', to: 'b6' }], visible: all },
		{ caption: 'If "plum" had hit bits 1, 3 and 4, all 1 because of other items, the filter would say "maybe": a false positive, confirmed by checking the real store.', moves: [{ from: 'q', to: 'h' }, { from: 'h', to: 'b1' }, { from: 'h', to: 'b3' }, { from: 'h', to: 'b4' }], visible: all }
	];
</script>

<FlowWalkthrough
	title="Bloom filter insert and query"
	desc="Items set k bits in a bit array; a query that finds any 0 bit is definitely absent, and all 1 bits means maybe."
	viewBox="0 0 590 310"
	{boxes}
	{steps}
/>
