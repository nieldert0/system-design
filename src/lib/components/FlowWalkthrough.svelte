<script lang="ts" module>
	export type FlowBox = { id: string; label: string; x: number; y: number; w?: number; h?: number };
	// A dot travels from one box to another. `fail` draws it in the warning colour (e.g. denied);
	// `label` is drawn at the arrow's midpoint (e.g. "5%").
	export type FlowMove = { from: string; to: string; fail?: boolean; label?: string };
	// `visible` omitted = every box is shown.
	export type FlowStep = { caption: string; moves: FlowMove[]; visible?: string[] };
</script>

<script lang="ts">
	import Walkthrough from './Walkthrough.svelte';

	// Data-driven walkthrough: boxes, arrows, and dots moving between them.
	let {
		title,
		desc,
		viewBox,
		boxes,
		steps
	}: { title: string; desc: string; viewBox: string; boxes: FlowBox[]; steps: FlowStep[] } = $props();

	const byId = $derived(new Map(boxes.map((b) => [b.id, { w: 120, h: 44, ...b }])));
	const box = (id: string) => {
		const b = byId.get(id);
		if (!b) throw new Error(`FlowWalkthrough: unknown box "${id}"`);
		return b;
	};
	const center = (id: string) => {
		const b = box(id);
		return [b.x + b.w / 2, b.y + b.h / 2] as const;
	};
	// Dots ride along the top edge of the box they reach, clear of its label.
	const dotAt = (id: string) => [center(id)[0], box(id).y] as const;
	const uid = $props.id();
</script>

<Walkthrough {title} {desc} {viewBox} steps={steps.map((s) => s.caption)}>
	{#snippet children(step: number)}
		{@const s = steps[step]}
		<defs>
			<marker id="{uid}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
				<path class="d-arrow" d="M0,0 L10,5 L0,10 z" />
			</marker>
		</defs>
		<!-- A move to the same box just highlights it, so it gets no arrow. Each arrow is trimmed to the box edges along the line between centres. -->
		{#each s.moves.filter((m) => m.from !== m.to) as m, i (i)}
			{@const a = box(m.from)}
			{@const b = box(m.to)}
			{@const [x1, y1] = center(m.from)}
			{@const [x2, y2] = center(m.to)}
			{@const dx = x2 - x1}
			{@const dy = y2 - y1}
			{@const tFrom = Math.min(Math.abs(a.w / 2 / (dx || 1e-9)), Math.abs(a.h / 2 / (dy || 1e-9)))}
			{@const gap = 4 / Math.hypot(dx, dy)}
			{@const tTo = Math.min(Math.abs(b.w / 2 / (dx || 1e-9)), Math.abs(b.h / 2 / (dy || 1e-9))) + gap}
			<line
				class="d-line"
				x1={x1 + dx * tFrom}
				y1={y1 + dy * tFrom}
				x2={x2 - dx * tTo}
				y2={y2 - dy * tTo}
				marker-end="url(#{uid}-arrow)"
			/>
			{#if m.label}
				<text class="d-meta" x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} text-anchor="middle">{m.label}</text>
			{/if}
		{/each}
		{#each boxes as bx (bx.id)}
			{@const b = box(bx.id)}
			{@const shown = !s.visible || s.visible.includes(b.id)}
			<g style="opacity: {shown ? 1 : 0}" aria-hidden={!shown || undefined}>
				<rect class="d-box" x={b.x} y={b.y} width={b.w} height={b.h} rx="6" />
				<text class="d-text" x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} text-anchor="middle">{b.label}</text>
			</g>
		{/each}
		<!-- Fresh dots each step, so every dot travels from its own `from` box to `to`. -->
		{#key step}
			{#each s.moves as m, i (i)}
				{@const [fx, fy] = dotAt(m.from)}
				{@const [tx, ty] = dotAt(m.to)}
				<g
					class="flow-dot"
					style="--fx: {fx}px; --fy: {fy}px; transform: translate({tx}px, {ty}px)"
				>
					<circle r="7" class={m.fail ? 'd-wait' : 'd-token'} />
				</g>
			{/each}
		{/key}
	{/snippet}
</Walkthrough>
