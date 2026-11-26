<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
</script>

<Diagram
	title="Encryption in transit vs at rest"
	desc="A client talks to an app server over TLS, and the app server talks to the database over TLS: that is encryption in transit. The database's disk and backups are encrypted with keys from a key management service: that is encryption at rest."
	viewBox="0 0 560 200"
	caption="In transit protects data on the wire; at rest protects data on disk. You need both."
>
	<rect class="d-box" x="20" y="40" width="110" height="44" rx="6" />
	<text class="d-text" x="75" y="66" text-anchor="middle">Client</text>
	<rect class="d-box" x="225" y="40" width="110" height="44" rx="6" />
	<text class="d-text" x="280" y="66" text-anchor="middle">App server</text>
	<rect class="d-box" x="430" y="40" width="110" height="44" rx="6" />
	<text class="d-text" x="485" y="66" text-anchor="middle">Database</text>
	<line class="d-line" x1="130" y1="62" x2="225" y2="62" />
	<line class="d-line" x1="335" y1="62" x2="430" y2="62" />
	<text class="d-meta" x="177" y="54" text-anchor="middle">TLS</text>
	<text class="d-meta" x="382" y="54" text-anchor="middle">TLS</text>
	<text class="d-meta" x="280" y="22" text-anchor="middle">In transit</text>

	<line class="d-line" x1="485" y1="84" x2="485" y2="120" />
	<rect class="d-box-strong" x="420" y="120" width="130" height="40" rx="6" />
	<text class="d-on-strong" x="485" y="145" text-anchor="middle">Encrypted disk</text>
	<rect class="d-box" x="230" y="120" width="140" height="40" rx="6" />
	<text class="d-text" x="300" y="145" text-anchor="middle">Key service (KMS)</text>
	<line class="d-line" x1="370" y1="140" x2="420" y2="140" />
	<text class="d-meta" x="485" y="185" text-anchor="middle">At rest</text>
</Diagram>
