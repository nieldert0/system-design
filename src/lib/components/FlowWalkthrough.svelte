<script lang="ts" module>
	export type FlowBox = { id: string; label: string; x: number; y: number; w?: number; h?: number };
	// A dot travels from one box to another. `fail` draws it in the warning colour (e.g. denied);
	// `label` is drawn at the arrow's midpoint (e.g. "5%").
	export type FlowMove = { from: string; to: string; fail?: boolean; label?: string };
	// `visible` omitted = every box is shown. `links` are standing connections drawn without a dot, so
	// earlier steps stay readable. `sequence` plays moves one after another (a request's path) instead of
	// together (a fan-out).
	export type FlowStep = { caption: string; moves: FlowMove[]; visible?: string[]; links?: FlowMove[]; sequence?: boolean };
	const HOP = 750; // ms between sequenced moves: one dot arrives before the next leaves
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
	// Arrow endpoints: the centre-to-centre line, trimmed to each box's edge (plus a gap for the arrowhead).
	const arrow = (from: string, to: string) => {
		const a = box(from), b = box(to);
		const [x1, y1] = center(from), [x2, y2] = center(to);
		const dx = x2 - x1, dy = y2 - y1;
		const tFrom = Math.min(Math.abs(a.w / 2 / (dx || 1e-9)), Math.abs(a.h / 2 / (dy || 1e-9)));
		const tTo = Math.min(Math.abs(b.w / 2 / (dx || 1e-9)), Math.abs(b.h / 2 / (dy || 1e-9))) + 4 / Math.hypot(dx, dy);
		return { x1: x1 + dx * tFrom, y1: y1 + dy * tFrom, x2: x2 - dx * tTo, y2: y2 - dy * tTo, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
	};
	const uid = $props.id();
	const delay = (s: FlowStep, i: number) => i * (s.sequence ? HOP : 90);
	// Sequenced steps stay on screen long enough for every hop to finish.
	const dwell = (i: number) => 2600 + (steps[i].sequence ? (steps[i].moves.length - 1) * HOP : 0);
	const isNew = (i: number, id: string) =>
		i > 0 && (!steps[i].visible || steps[i].visible!.includes(id)) && !!steps[i - 1].visible && !steps[i - 1].visible!.includes(id);
</script>

<Walkthrough {title} {desc} {viewBox} steps={steps.map((s) => s.caption)} {dwell}>
	{#snippet children(step: number)}
		{@const s = steps[step]}
		<defs>
			<marker id="{uid}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
				<path class="d-arrow" d="M0,0 L10,5 L0,10 z" />
			</marker>
		</defs>
		<!-- A move to the same box just highlights it, so it gets no arrow. Each arrow is trimmed to the box edges along the line between centres. -->
		{#each s.links ?? [] as m, i (i)}
			{@const l = arrow(m.from, m.to)}
			<line class="d-line d-link" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} marker-end="url(#{uid}-arrow)" />
		{/each}
		{#key step}
			{#each s.moves.filter((m) => m.from !== m.to) as m, i (i)}
				{@const l = arrow(m.from, m.to)}
				<g class="flow-arrow" style="animation-delay: {delay(s, i)}ms">
					<line class="d-line" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} marker-end="url(#{uid}-arrow)" />
					{#if m.label}
						<text class="d-meta" x={l.mx} y={l.my - 8} text-anchor="middle">{m.label}</text>
					{/if}
				</g>
			{/each}
		{/key}
		{#each boxes as bx (bx.id)}
			{@const b = box(bx.id)}
			{@const shown = !s.visible || s.visible.includes(b.id)}
			<g style="opacity: {shown ? 1 : 0}" aria-hidden={!shown || undefined}>
				<rect class="d-box" class:d-new={isNew(step, b.id)} x={b.x} y={b.y} width={b.w} height={b.h} rx="6" />
				<text class="d-text" x={b.x + b.w / 2} y={b.y + b.h / 2 + 4} text-anchor="middle">{b.label}</text>
			</g>
		{/each}
		<!-- Fresh dots each step. A dot rides its own arrow, from the source edge to the arrowhead;
		     a move to the same box pulses on that box's top edge instead. -->
		{#key step}
			{#each s.moves as m, i (i)}
				{#if m.from === m.to}
					{@const [cx] = center(m.to)}
					<g class="flow-dot flow-dot-here" style="transform: translate({cx}px, {box(m.to).y}px); animation-delay: {delay(s, i)}ms">
						<circle r="7" class={m.fail ? 'd-wait' : 'd-token'} />
					</g>
				{:else}
					{@const l = arrow(m.from, m.to)}
					<g class="flow-dot" style="--fx: {l.x1}px; --fy: {l.y1}px; transform: translate({l.x2}px, {l.y2}px); animation-delay: {delay(s, i)}ms">
						<circle r="7" class={m.fail ? 'd-wait' : 'd-token'} />
					</g>
				{/if}
			{/each}
		{/key}
	{/snippet}
</Walkthrough>
