<script lang="ts">
	import FlowWalkthrough, { type FlowBox, type FlowStep } from '#lib/components/FlowWalkthrough.svelte';

	const boxes: FlowBox[] = [
		{ id: 'client', label: 'Client', x: 10, y: 130, w: 100 },
		{ id: 'wal', label: 'WAL (disk)', x: 170, y: 20, w: 120 },
		{ id: 'mem', label: 'Memtable (RAM)', x: 170, y: 130, w: 140 },
		{ id: 'bloom', label: 'Bloom filters', x: 170, y: 240, w: 140 },
		{ id: 'l0', label: 'L0 SSTables', x: 380, y: 60, w: 130 },
		{ id: 'l1', label: 'L1 SSTables', x: 380, y: 160, w: 130 },
		{ id: 'l2', label: 'L2 SSTables', x: 380, y: 260, w: 130 }
	];
	const write = ['client', 'wal', 'mem', 'l0', 'l1', 'l2'];
	const steps: FlowStep[] = [
		{ caption: 'A write is first appended to the write-ahead log, a sequential write that survives a crash.', moves: [{ from: 'client', to: 'wal' }], visible: ['client', 'wal', 'mem'] },
		{ caption: 'Then it is inserted into the memtable, a sorted structure in memory. The write is now acknowledged.', moves: [{ from: 'client', to: 'mem' }], visible: ['client', 'wal', 'mem'], links: [{ from: 'client', to: 'wal' }] },
		{ caption: 'When the memtable fills (64 MB in RocksDB), it is flushed to disk as an immutable, sorted SSTable in L0, and the old WAL can be deleted.', moves: [{ from: 'mem', to: 'l0', label: 'flush' }], visible: write },
		{ caption: 'Compaction merges SSTables into the next level, keeping only the newest version of each key and dropping deleted ones.', moves: [{ from: 'l0', to: 'l1', label: 'merge' }, { from: 'l1', to: 'l2', label: 'merge' }], visible: write, sequence: true },
		{ caption: 'A read checks the memtable first, since it holds the newest data.', moves: [{ from: 'client', to: 'mem' }], visible: [...write, 'bloom'] },
		{ caption: 'On a miss, each SSTable\'s Bloom filter (in memory) says "definitely not here" or "maybe here". Only "maybe" files are read from disk.', moves: [{ from: 'client', to: 'bloom' }, { from: 'bloom', to: 'l0', fail: true, label: 'no' }, { from: 'bloom', to: 'l1', fail: true, label: 'no' }, { from: 'bloom', to: 'l2', label: 'maybe' }], visible: [...write, 'bloom'], sequence: true }
	];
</script>

<FlowWalkthrough
	title="An LSM-tree write and read"
	desc="A write goes to the WAL and memtable, is flushed to an SSTable and compacted down the levels; a read checks the memtable, then Bloom filters, then only the SSTables that may hold the key."
	viewBox="0 0 520 300"
	{boxes}
	{steps}
/>
