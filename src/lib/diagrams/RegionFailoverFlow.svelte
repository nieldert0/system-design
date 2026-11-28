<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'dns', label: 'DNS / global LB', x: 230, y: 10, w: 160 },
		{ id: 'a', label: 'us-east-1 (primary)', x: 40, y: 110, w: 170 },
		{ id: 'b', label: 'us-west-2 (standby)', x: 410, y: 110, w: 170 },
		{ id: 'dba', label: 'Primary DB', x: 40, y: 200, w: 170 },
		{ id: 'dbb', label: 'Replica DB', x: 410, y: 200, w: 170 }
	];
	const steps: FlowStep[] = [
		{ caption: 'Normal: all traffic goes to the primary region, and the database ships changes to the other region asynchronously, about 1 s behind.', moves: [{ from: 'dns', to: 'a' }, { from: 'dba', to: 'dbb', label: 'async, ~1 s lag' }], visible: ['dns', 'a', 'b', 'dba', 'dbb'] },
		{ caption: 'The primary region fails. Health checks from three locations fail for 3 minutes in a row, so the on-call declares a regional failover.', moves: [{ from: 'dns', to: 'a', fail: true }], visible: ['dns', 'a', 'b', 'dba', 'dbb'] },
		{ caption: 'Promote the replica: writes from its last second of lag are lost. That loss is the RPO.', moves: [{ from: 'dbb', to: 'b', label: 'promoted' }], visible: ['dns', 'a', 'b', 'dba', 'dbb'] },
		{ caption: 'Repoint DNS (60 s TTL) and scale up the standby. The time from failure until users are served again is the RTO.', moves: [{ from: 'dns', to: 'b', label: 'TTL 60 s' }], visible: ['dns', 'a', 'b', 'dba', 'dbb'] }
	];
</script>

<FlowWalkthrough
	title="An active-passive regional failover"
	desc="Traffic moves from a failed primary region to a warm standby; the replication lag sets data loss and the steps set downtime."
	viewBox="0 0 620 260"
	{boxes}
	{steps}
/>
