import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkModule } from './check-content.ts';

const outline = [{ slug: 's', title: 'S', modules: [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }] }];
const good = () => ({
	file: 'a.md',
	slug: 'a',
	metadata: {
		slug: 'a', title: 'A', section: 's', readFirst: ['b'],
		sources: [{ id: 'p', title: 'Primer', url: 'https://x', license: 'CC BY 4.0', use: 'copied' }]
	} as Record<string, any>,
	body: '## What it is\nx <Src id="p" />\n## How it works\n## Trade-offs\n## Interview tips\n'
});
const errs = (mod = good()) => checkModule(mod, outline);

test('a valid module passes', () => assert.deepEqual(errs(), []));
test('missing required section fails', () => {
	const mod = good(); mod.body = mod.body.replace('## Trade-offs\n', '');
	assert.match(errs(mod).join(), /Trade-offs/);
});
test('source without license fails', () => {
	const mod = good(); delete mod.metadata.sources[0].license;
	assert.match(errs(mod).join(), /license/);
});
test('no sources fails', () => {
	const mod = good(); mod.metadata.sources = [];
	assert.match(errs(mod).join(), /source/);
});
test('chip pointing at an undeclared source fails', () => {
	const mod = good(); mod.body += '<Src id="nope" />';
	assert.match(errs(mod).join(), /nope/);
});
test('unknown read-first slug fails', () => {
	const mod = good(); mod.metadata.readFirst = ['ghost'];
	assert.match(errs(mod).join(), /ghost/);
});
test('module not in the outline fails', () => {
	const mod = good(); mod.slug = 'zzz'; mod.metadata.slug = 'zzz';
	assert.match(errs(mod).join(), /zzz/);
});
test('frontmatter disagreeing with outline fails', () => {
	const mod = good(); mod.metadata.title = 'Wrong';
	assert.match(errs(mod).join(), /title/);
});
