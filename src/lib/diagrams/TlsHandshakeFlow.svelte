<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'c', label: 'Client', x: 20, y: 70, w: 120 },
		{ id: 's', label: 'Server', x: 400, y: 70, w: 120 }
	];
	const steps: FlowStep[] = [
		{ caption: 'A TCP connection is opened first.', moves: [{ from: 'c', to: 's', label: 'TCP' }] },
		{ caption: 'Hello: the client proposes ciphers and sends its key share.', moves: [{ from: 'c', to: 's', label: 'ClientHello' }] },
		{ caption: 'Certificate: the server picks a cipher and presents a certificate signed by a trusted authority.', moves: [{ from: 's', to: 'c', label: 'ServerHello + cert' }] },
		{ caption: 'Keys: both sides derive the same session keys. TLS 1.3 needs just this one round trip.', moves: [{ from: 'c', to: 'c' }, { from: 's', to: 's' }] },
		{ caption: 'The HTTP request is sent encrypted.', moves: [{ from: 'c', to: 's', label: 'encrypted GET' }] }
	];
</script>

<FlowWalkthrough
	title="HTTPS: TCP, the TLS handshake, then an encrypted request"
	desc="A client and a server open TCP, exchange hellos and a certificate, derive keys, and send an encrypted request."
	viewBox="0 0 540 180"
	{boxes}
	{steps}
/>
