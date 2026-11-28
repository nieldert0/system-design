<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'a', label: 'A leader t1', x: 155, y: 10, w: 110 },
		{ id: 'ax', label: 'A ✕', x: 155, y: 10, w: 110 },
		{ id: 'b', label: 'B', x: 20, y: 95, w: 120 },
		{ id: 'bc', label: 'B candidate t2', x: 20, y: 95, w: 120 },
		{ id: 'bl', label: 'B leader t2', x: 20, y: 95, w: 120 },
		{ id: 'c', label: 'C', x: 290, y: 95, w: 110 },
		{ id: 'd', label: 'D', x: 60, y: 185, w: 100 },
		{ id: 'e', label: 'E', x: 260, y: 185, w: 100 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Leader A (term 1) sends heartbeats every 50 ms. Each follower resets its election timer, a random 150 to 300 ms.', moves: [{ from: 'a', to: 'b' }, { from: 'a', to: 'c' }, { from: 'a', to: 'd' }, { from: 'a', to: 'e' }], visible: ['a', 'b', 'c', 'd', 'e'] },
		{ caption: 'A crashes. B\'s timer expires first, so B becomes a candidate for term 2 and votes for itself.', moves: [{ from: 'ax', to: 'bc', fail: true, label: 'silence' }], visible: ['ax', 'bc', 'c', 'd', 'e'] },
		{ caption: 'B asks for votes. C, D and E have not voted in term 2 and B\'s log is up to date, so they grant: 4 of 5 votes, and 3 is a majority.', moves: [{ from: 'c', to: 'bc', label: 'vote' }, { from: 'd', to: 'bc', label: 'vote' }, { from: 'e', to: 'bc', label: 'vote' }], visible: ['ax', 'bc', 'c', 'd', 'e'] },
		{ caption: 'B leads term 2. A client write goes into B\'s log and out to followers; once 2 followers store it (3 of 5 with B), it is committed.', moves: [{ from: 'bl', to: 'c', label: 'append' }, { from: 'bl', to: 'd', label: 'append' }, { from: 'bl', to: 'e' }], visible: ['ax', 'bl', 'c', 'd', 'e'] }
	];
</script>

<FlowWalkthrough
	title="Raft leader election and replication"
	desc="Five Raft nodes: the leader fails, a follower wins an election with a majority, then replicates a write."
	viewBox="0 0 420 240"
	{boxes}
	{steps}
/>
