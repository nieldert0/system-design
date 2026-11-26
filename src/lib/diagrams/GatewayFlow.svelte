<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client', x: 20, y: 90, w: 100 },
		{ id: 'gw', label: 'Gateway: TLS, auth, rate limit', x: 160, y: 90, w: 230 },
		{ id: 'u', label: '/users service', x: 440, y: 20, w: 150 },
		{ id: 'o', label: '/orders service', x: 440, y: 160, w: 150 },
		{ id: 'cache', label: 'Response cache', x: 200, y: 200, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A request for /users arrives at the gateway, the one endpoint clients know.', moves: [{ from: 'c', to: 'gw' }] },
		{ caption: 'The gateway terminates TLS, checks the caller\'s credentials and its rate limit.', moves: [{ from: 'gw', to: 'gw' }] },
		{ caption: 'It routes by path: /users goes to the users service.', moves: [{ from: 'gw', to: 'u', label: '/users' }] },
		{ caption: 'The response is cached and returned; the same request next time is served from the cache.', moves: [{ from: 'u', to: 'gw' }, { from: 'gw', to: 'cache' }, { from: 'gw', to: 'c' }] }
	];
</script>

<FlowWalkthrough
	title="API gateway: TLS, auth, routing and caching"
	desc="A client, a gateway, two services and a response cache."
	viewBox="0 0 610 260"
	{boxes}
	{steps}
/>
