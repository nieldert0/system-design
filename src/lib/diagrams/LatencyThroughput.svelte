<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
</script>

<Diagram
	title="Latency and throughput"
	desc="A client sends a request to a server. Latency is the time one request takes from client to server and back. Throughput is how many requests the server finishes per second."
	viewBox="0 0 640 150"
	caption="Latency is measured per request. Throughput is measured per second, across all requests."
>
	<rect class="d-box" x="20" y="45" width="120" height="50" rx="6" />
	<text class="d-text" x="80" y="75" text-anchor="middle">Client</text>
	<rect class="d-box" x="300" y="45" width="120" height="50" rx="6" />
	<text class="d-text" x="360" y="75" text-anchor="middle">Server</text>

	<line class="d-line" x1="140" y1="62" x2="292" y2="62" />
	<path class="d-arrow" d="M300 62 l-9 -5 v10 z" />
	<line class="d-line" x1="300" y1="80" x2="148" y2="80" />
	<path class="d-arrow" d="M140 80 l9 -5 v10 z" />
	<text class="d-meta" x="220" y="30" text-anchor="middle">Latency</text>
	<text class="d-meta" x="220" y="120" text-anchor="middle">one request, there and back (ms)</text>

	<line class="d-line" x1="420" y1="70" x2="592" y2="70" />
	<path class="d-arrow" d="M600 70 l-9 -5 v10 z" />
	<text class="d-meta" x="510" y="30" text-anchor="middle">Throughput</text>
	<text class="d-meta" x="510" y="120" text-anchor="middle">finished requests per second</text>
</Diagram>
