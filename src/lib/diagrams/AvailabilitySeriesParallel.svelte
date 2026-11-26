<script lang="ts">
	import Diagram from '#lib/components/Diagram.svelte';
</script>

<Diagram
	title="Availability in sequence vs in parallel"
	desc="Left: Foo and Bar in a chain, both must work, total 99.8%. Right: Foo and Bar side by side, either can serve, total 99.9999%."
	viewBox="0 0 640 190"
	caption="Each component is 99.9% available. Chaining them lowers the total; running them in parallel raises it."
>
	<text class="d-meta" x="150" y="24" text-anchor="middle">In sequence: 99.9% × 99.9% ≈ 99.8%</text>
	<rect class="d-box" x="20" y="70" width="110" height="44" rx="6" />
	<text class="d-text" x="75" y="96" text-anchor="middle">Foo</text>
	<line class="d-line" x1="130" y1="92" x2="162" y2="92" />
	<path class="d-arrow" d="M170 92 l-9 -5 v10 z" />
	<rect class="d-box" x="170" y="70" width="110" height="44" rx="6" />
	<text class="d-text" x="225" y="96" text-anchor="middle">Bar</text>

	<text class="d-meta" x="490" y="24" text-anchor="middle">In parallel: 1 − 0.1% × 0.1% ≈ 99.9999%</text>
	<rect class="d-box" x="360" y="70" width="80" height="44" rx="6" />
	<text class="d-text" x="400" y="96" text-anchor="middle">In</text>
	<line class="d-line" x1="440" y1="85" x2="492" y2="58" />
	<line class="d-line" x1="440" y1="99" x2="492" y2="126" />
	<rect class="d-box" x="500" y="36" width="110" height="44" rx="6" />
	<text class="d-text" x="555" y="62" text-anchor="middle">Foo</text>
	<rect class="d-box" x="500" y="106" width="110" height="44" rx="6" />
	<text class="d-text" x="555" y="132" text-anchor="middle">Bar</text>
</Diagram>
