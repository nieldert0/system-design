import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProgress, PASS_THRESHOLD } from '../src/lib/progress.ts';

const memory = (init: Record<string, string> = {}) => {
	const data = { ...init };
	return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
};
const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

test('best score is kept across attempts', () => {
	const p = createProgress(memory());
	p.recordScore('a', 4, 5);
	p.recordScore('a', 2, 5);
	assert.equal(p.bestScore('a'), 0.8);
	p.recordScore('a', 5, 5);
	assert.equal(p.bestScore('a'), 1);
});

test('passed means best score at or above the threshold', () => {
	assert.equal(PASS_THRESHOLD, 0.8);
	const p = createProgress(memory());
	p.recordScore('a', 3, 5);
	assert.equal(p.isPassed('a'), false);
	p.recordScore('a', 4, 5);
	assert.equal(p.isPassed('a'), true);
	assert.equal(p.isPassed('never'), false);
});

test('progress survives a new session on the same storage', () => {
	const store = memory();
	createProgress(store).recordScore('a', 5, 5);
	createProgress(store).setTier('medium');
	const again = createProgress(store);
	assert.equal(again.isPassed('a'), true);
	assert.equal(again.getTier(), 'medium');
});

test('next unfinished module in a tier skips passed ones', () => {
	const p = createProgress(memory());
	p.recordScore('a', 5, 5);
	p.recordScore('b', 1, 5);
	assert.equal(p.nextUnfinished(['a', 'b', 'c']), 'b');
	p.recordScore('b', 5, 5);
	assert.equal(p.nextUnfinished(['a', 'b', 'c']), 'c');
	p.recordScore('c', 5, 5);
	assert.equal(p.nextUnfinished(['a', 'b', 'c']), undefined);
});

test('empty storage gives defaults', () => {
	const p = createProgress(memory());
	assert.equal(p.bestScore('a'), undefined);
	assert.equal(p.getTier(), undefined);
});

test('corrupted storage is treated as empty and can be written again', () => {
	for (const bad of ['{not json', '[]', '"x"', '{"scores":5,"tier":"weird"}']) {
		const p = createProgress(memory({ 'sdn-progress': bad }));
		assert.equal(p.bestScore('a'), undefined);
		assert.equal(p.getTier(), undefined);
		p.recordScore('a', 5, 5);
		assert.equal(p.isPassed('a'), true);
	}
});

test('throwing or missing storage still works for the session', () => {
	for (const store of [throwing, null]) {
		const p = createProgress(store);
		p.recordScore('a', 5, 5);
		p.setTier('short');
		assert.equal(p.isPassed('a'), true);
		assert.equal(p.getTier(), 'short');
	}
});
