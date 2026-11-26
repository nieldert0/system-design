<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'a', label: 'Server A', x: 240, y: 10, w: 110 },
		{ id: 'b', label: 'Server B', x: 470, y: 150, w: 110 },
		{ id: 'c', label: 'Server C', x: 240, y: 290, w: 110 },
		{ id: 'd', label: 'Server D (new)', x: 10, y: 150, w: 130 },
		{ id: 'k1', label: 'key 1', x: 420, y: 60, w: 80 },
		{ id: 'k2', label: 'key 2', x: 90, y: 260, w: 80 }
	];
	const servers = ['a', 'b', 'c'];
	const steps: FlowStep[] = [
		{ caption: 'Hash each server\'s id to a point on the ring.', moves: [], visible: servers },
		{ caption: 'Hash each key to a point on the ring.', moves: [], visible: [...servers, 'k1', 'k2'] },
		{ caption: 'Walk clockwise from the key to the first server; that server owns the key. Key 1 belongs to B, key 2 to A.', moves: [{ from: 'k1', to: 'b' }, { from: 'k2', to: 'a' }], visible: [...servers, 'k1', 'k2'] },
		{ caption: 'Add server D between C and A: it takes over only key 2, the keys between it and its predecessor. Key 1 does not move.', moves: [{ from: 'k2', to: 'd' }, { from: 'k1', to: 'b' }], visible: [...servers, 'd', 'k1', 'k2'] }
	];
</script>

<FlowWalkthrough
	title="Consistent hashing on a ring"
	desc="Servers and keys placed clockwise around a ring; a new server takes over only its neighbour's keys."
	viewBox="0 0 590 340"
	{boxes}
	{steps}
/>
