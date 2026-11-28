<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'pt', label: 'Point 1.2834, 103.8607', x: 10, y: 20, w: 190 },
		{ id: 'lng', label: 'lng bits 1 1 0 0 1 …', x: 260, y: 0, w: 170 },
		{ id: 'lat', label: 'lat bits 1 0 0 0 0 …', x: 260, y: 70, w: 170 },
		{ id: 'bits', label: 'interleaved 11100 00010 …', x: 480, y: 35, w: 200 },
		{ id: 'hash', label: 'geohash w21z73', x: 520, y: 150, w: 140 },
		{ id: 'prefix', label: 'prefix w21z7 = bigger cell', x: 250, y: 150, w: 200 },
		{ id: 'edge', label: 'neighbour across edge: w21z6…', x: 10, y: 250, w: 220 },
		{ id: 'cover', label: 'query own cell + neighbours', x: 300, y: 250, w: 210 },
		{ id: 'filter', label: 'exact distance filter', x: 560, y: 250, w: 160 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Start with a latitude and longitude.', moves: [], visible: ['pt'] },
		{ caption: 'Halve each range again and again: 1 means the upper half, 0 the lower half. Longitude and latitude each get their own bit string.', moves: [{ from: 'pt', to: 'lng' }, { from: 'pt', to: 'lat' }], visible: ['pt', 'lng', 'lat'] },
		{ caption: 'Interleave the bits, longitude first, so one number describes both dimensions.', moves: [{ from: 'lng', to: 'bits' }, { from: 'lat', to: 'bits' }], visible: ['pt', 'lng', 'lat', 'bits'] },
		{ caption: 'Read the bits five at a time as base32 characters: 11100 is w, 00010 is 2. Six characters, 30 bits, is a cell about 1.2 km by 0.6 km.', moves: [{ from: 'bits', to: 'hash' }], visible: ['pt', 'lng', 'lat', 'bits', 'hash'] },
		{ caption: 'Dropping characters gives the enclosing, bigger cell, so a shared prefix means a shared cell and one B-tree range scan.', moves: [{ from: 'hash', to: 'prefix' }], visible: ['pt', 'bits', 'hash', 'prefix'] },
		{ caption: 'But two points a metre apart across a cell edge can share almost no prefix. So a search must also look in the neighbouring cells.', moves: [{ from: 'prefix', to: 'edge', fail: true }], visible: ['hash', 'prefix', 'edge'] },
		{ caption: 'Query the cells that cover the search circle, then compute the true distance to drop candidates in the corners.', moves: [{ from: 'edge', to: 'cover' }, { from: 'cover', to: 'filter' }], visible: ['hash', 'prefix', 'edge', 'cover', 'filter'], sequence: true }
	];
</script>

<FlowWalkthrough
	title="Encoding and searching with a geohash"
	desc="A point's latitude and longitude are bisected into bits, interleaved, and read as base32; a radius search scans the covering cells and then filters by exact distance."
	viewBox="0 0 730 300"
	{boxes}
	{steps}
/>
