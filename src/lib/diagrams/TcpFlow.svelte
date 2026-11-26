<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client', x: 20, y: 70, w: 120 },
		{ id: 's', label: 'Server', x: 400, y: 70, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Handshake: the client sends SYN to open a connection.', moves: [{ from: 'c', to: 's', label: 'SYN' }] },
		{ caption: 'The server answers SYN-ACK, and the client replies ACK. The connection is open.', moves: [{ from: 's', to: 'c', label: 'SYN-ACK' }] },
		{ caption: 'Data goes out with sequence numbers, but a packet is lost on the way.', moves: [{ from: 'c', to: 's', fail: true, label: 'seq 2 lost' }] },
		{ caption: 'No acknowledgement arrives before the timeout, so the sender resends the packet.', moves: [{ from: 'c', to: 's', label: 'resend seq 2' }] },
		{ caption: 'The receiver acknowledges it, and the data arrives complete and in order.', moves: [{ from: 's', to: 'c', label: 'ACK' }] }
	];
</script>

<FlowWalkthrough
	title="TCP: handshake, then a lost packet is resent"
	desc="A client and a server exchange a handshake, then data with acknowledgements."
	viewBox="0 0 540 180"
	{boxes}
	{steps}
/>
