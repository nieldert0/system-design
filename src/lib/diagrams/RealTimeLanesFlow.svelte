<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const lane = (id: string, label: string, y: number): FlowBox[] => [
		{ id: id + 'c', label: label + ': client', x: 20, y, w: 200, h: 40 },
		{ id: id + 's', label: 'Server', x: 440, y, w: 120, h: 40 }
	];
	const boxes: FlowBox[] = [...lane('p', 'Polling', 20), ...lane('l', 'Long polling', 90), ...lane('e', 'SSE', 160), ...lane('w', 'WebSocket', 230)];
	const steps: FlowStep[] = [
		{ caption: 'Open: polling asks; long polling asks and the server holds the request; SSE opens a stream; WebSocket upgrades the connection.', moves: [{ from: 'pc', to: 'ps', label: 'any news?' }, { from: 'lc', to: 'ls', label: 'wait…' }, { from: 'ec', to: 'es', label: 'event-stream' }, { from: 'wc', to: 'ws', label: 'Upgrade' }] },
		{ caption: 'Nothing new yet: polling gets an empty reply and must ask again; the others stay quiet.', moves: [{ from: 'ps', to: 'pc', fail: true, label: 'nothing' }] },
		{ caption: 'A message arrives: long polling answers the held request; SSE and WebSocket push it on their open connections. Polling only sees it at its next request.', moves: [{ from: 'ls', to: 'lc', label: 'message' }, { from: 'es', to: 'ec', label: 'event' }, { from: 'ws', to: 'wc', label: 'frame' }] },
		{ caption: 'Afterwards: long polling must send a new request with fresh headers; only the WebSocket can also send from client to server on the same connection.', moves: [{ from: 'pc', to: 'ps', label: 'any news?' }, { from: 'lc', to: 'ls', label: 'new request' }, { from: 'wc', to: 'ws', label: 'frame' }] }
	];
</script>

<FlowWalkthrough
	title="Polling, long polling, SSE and WebSocket side by side"
	desc="Four lanes, each a client and a server, showing how each technique delivers a new message over time."
	viewBox="0 0 580 290"
	{boxes}
	{steps}
/>
