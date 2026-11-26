<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'inst', label: 'Orders instance', x: 20, y: 130, w: 140 },
		{ id: 'reg', label: 'Registry', x: 210, y: 24, w: 140 },
		{ id: 'caller', label: 'Cart service', x: 400, y: 130, w: 140 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Register: a new orders instance starts and registers its name, address and port.', moves: [{ from: 'inst', to: 'reg' }] },
		{ caption: 'Stay healthy: the registry calls its health endpoint. Instances that miss checks are removed.', moves: [{ from: 'reg', to: 'inst' }] },
		{ caption: 'Look up: the cart service asks the registry for healthy instances of "orders".', moves: [{ from: 'caller', to: 'reg' }] },
		{ caption: 'The registry answers with the addresses of live instances.', moves: [{ from: 'reg', to: 'caller' }] },
		{ caption: 'Call: with client-side discovery, the cart service picks one instance itself and calls it directly.', moves: [{ from: 'caller', to: 'inst' }] }
	];
</script>

<FlowWalkthrough
	title="Service discovery: register, check, look up, call"
	desc="An orders instance, a service registry and a cart service that needs to call orders."
	viewBox="0 0 560 190"
	{boxes}
	{steps}
/>
