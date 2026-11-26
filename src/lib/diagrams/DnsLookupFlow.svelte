<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'b', label: 'Browser', x: 20, y: 110, w: 110 },
		{ id: 'res', label: 'Resolver (cache)', x: 190, y: 110, w: 150 },
		{ id: 'root', label: 'Root', x: 420, y: 20, w: 150 },
		{ id: 'tld', label: 'TLD (.com)', x: 420, y: 110, w: 150 },
		{ id: 'auth', label: 'Authoritative', x: 420, y: 200, w: 150 }
	];
	const steps: FlowStep[] = [
		{ caption: 'The browser asks the resolver that its router or ISP points it to.', moves: [{ from: 'b', to: 'res' }] },
		{ caption: 'The resolver asks a root server, which points it to the servers for .com.', moves: [{ from: 'res', to: 'root' }] },
		{ caption: 'The TLD server points it to the authoritative server for the domain.', moves: [{ from: 'res', to: 'tld' }] },
		{ caption: 'The authoritative server returns the A record; the resolver caches it for its TTL and answers the browser.', moves: [{ from: 'res', to: 'auth' }, { from: 'res', to: 'b' }] },
		{ caption: 'A second lookup within the TTL stops at the resolver cache.', moves: [{ from: 'b', to: 'res' }, { from: 'res', to: 'b', label: 'cached' }] }
	];
</script>

<FlowWalkthrough
	title="A DNS lookup, then a cached one"
	desc="A browser, a caching resolver, and the root, TLD and authoritative name servers."
	viewBox="0 0 590 260"
	{boxes}
	{steps}
/>
