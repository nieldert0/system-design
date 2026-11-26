<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client page', x: 20, y: 100, w: 120 },
		{ id: 'p', label: 'GET /persons/1', x: 260, y: 20, w: 160 },
		{ id: 'i', label: 'GET /persons/1/items', x: 260, y: 100, w: 190 },
		{ id: 'r', label: 'GET /items/9/reviews', x: 260, y: 180, w: 190 },
		{ id: 'g', label: 'POST /graphql', x: 260, y: 100, w: 190 }
	];
	const rest = ['c', 'p', 'i', 'r'];
	const steps: FlowStep[] = [
		{ caption: 'REST: the page needs a person, their items and reviews. First, fetch the person.', moves: [{ from: 'c', to: 'p' }], visible: rest },
		{ caption: 'Second round trip: fetch their items.', moves: [{ from: 'c', to: 'i' }], visible: rest },
		{ caption: 'Third round trip: fetch the reviews, each response carrying fields the page may not use.', moves: [{ from: 'c', to: 'r' }], visible: rest },
		{ caption: 'GraphQL: one query names exactly the fields wanted across all three, and the server returns that shape in one round trip.', moves: [{ from: 'c', to: 'g' }, { from: 'g', to: 'c', label: '1 response' }], visible: ['c', 'g'] }
	];
</script>

<FlowWalkthrough
	title="REST in three round trips vs GraphQL in one"
	desc="A client page fetching related data, first with three REST calls, then with one GraphQL query."
	viewBox="0 0 470 240"
	{boxes}
	{steps}
/>
