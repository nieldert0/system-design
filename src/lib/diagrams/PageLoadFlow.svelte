<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'browser', label: 'Browser', x: 20, y: 100, w: 110 },
		{ id: 'dns', label: 'DNS', x: 200, y: 20, w: 110 },
		{ id: 'r1', label: 'Router', x: 200, y: 180, w: 100 },
		{ id: 'r2', label: 'Router', x: 360, y: 180, w: 100 },
		{ id: 'server', label: 'Server', x: 510, y: 100, w: 110 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The browser asks DNS for the IP address of the name.', moves: [{ from: 'browser', to: 'dns' }, { from: 'dns', to: 'browser' }] },
		{ caption: 'It opens a TCP connection to that address (and a TLS session for HTTPS).', moves: [{ from: 'browser', to: 'server', label: 'TCP' }] },
		{ caption: 'It sends an HTTP request; routers forward the packets hop by hop.', moves: [{ from: 'browser', to: 'r1' }, { from: 'r1', to: 'r2' }, { from: 'r2', to: 'server' }] },
		{ caption: 'The server replies, and the packets travel back the same way.', moves: [{ from: 'server', to: 'r2' }, { from: 'r2', to: 'r1' }, { from: 'r1', to: 'browser' }] }
	];
</script>

<FlowWalkthrough
	title="A page load across the internet"
	desc="A browser, a DNS server, two routers and a web server."
	viewBox="0 0 640 240"
	{boxes}
	{steps}
/>
