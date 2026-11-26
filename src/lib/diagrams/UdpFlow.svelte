<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Sender', x: 20, y: 70, w: 120 },
		{ id: 's', label: 'Receiver', x: 400, y: 70, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'No handshake: the sender just starts sending datagrams.', moves: [{ from: 'c', to: 's', label: 'datagram 1' }] },
		{ caption: 'A datagram is lost on the way.', moves: [{ from: 'c', to: 's', fail: true, label: 'datagram 2 lost' }] },
		{ caption: 'No acknowledgement, no resend: the next datagram goes out and the lost one is simply gone.', moves: [{ from: 'c', to: 's', label: 'datagram 3' }] }
	];
</script>

<FlowWalkthrough
	title="UDP: no handshake and no resend"
	desc="A sender and a receiver; datagrams go one way with no acknowledgements."
	viewBox="0 0 540 180"
	{boxes}
	{steps}
/>
