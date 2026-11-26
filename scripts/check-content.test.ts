import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGlossary, checkModule } from './check-content.ts';

const outline = [{ slug: 's', title: 'S', modules: [{ slug: 'a', title: 'A' }, { slug: 'b', title: 'B' }] }];
const good = () => ({
	file: 'a.md',
	slug: 'a',
	metadata: {
		slug: 'a', title: 'A', section: 's', readFirst: ['b'],
		sources: [{ id: 'p', title: 'Primer', url: 'https://x', license: 'CC BY 4.0', use: 'copied' }],
		quiz: Array(5).fill({ prompt: 'Q?', options: ['a', 'b'], correct: 0, explanation: 'E.' })
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

const q = (correct = 0) => ({ prompt: 'Q?', options: ['a', 'b', 'c'], correct, explanation: 'Because.' });
const withQuiz = (quiz: unknown) => { const mod = good(); mod.metadata.quiz = quiz; return errs(mod).join(); };

test('quiz must have 5 to 8 questions', () => {
	assert.match(withQuiz([q(), q(), q(), q()]), /5.8 questions/);
	assert.match(withQuiz(Array(9).fill(q())), /5.8 questions/);
	assert.match(withQuiz(undefined), /5.8 questions/);
	assert.equal(withQuiz(Array(5).fill(q())), '');
});
test('each question needs exactly one valid correct option', () => {
	assert.match(withQuiz([...Array(4).fill(q()), q(3)]), /question 5.*correct/);
	assert.match(withQuiz([...Array(4).fill(q()), { ...q(), correct: [0, 1] }]), /question 5.*correct/);
});
test('each question needs an explanation and a prompt', () => {
	assert.match(withQuiz([...Array(4).fill(q()), { ...q(), explanation: '' }]), /question 5.*explanation/);
	assert.match(withQuiz([...Array(4).fill(q()), { ...q(), prompt: '' }]), /question 5.*prompt/);
});

const entry = () => ({
	id: 'lat', term: 'Latency', definition: 'Time taken.', module: 'a',
	source: { title: 'Primer', url: 'https://x', license: 'CC BY 4.0' }
});
test('a valid glossary passes', () => assert.deepEqual(checkGlossary([entry()], outline), []));
test('glossary entry with unknown teaching module fails', () =>
	assert.match(checkGlossary([{ ...entry(), module: 'ghost' }], outline).join(), /ghost/));
test('glossary entry missing its source or license fails', () => {
	assert.match(checkGlossary([{ ...entry(), source: undefined as any }], outline).join(), /source/);
	assert.match(checkGlossary([{ ...entry(), source: { ...entry().source, license: '' } }], outline).join(), /license/);
});
test('glossary entry missing its definition or a duplicate id fails', () => {
	assert.match(checkGlossary([{ ...entry(), definition: '' }], outline).join(), /definition/);
	assert.match(checkGlossary([entry(), entry()], outline).join(), /duplicate/);
});
test('a term marker citing an unknown glossary id fails', () => {
	const mod = good(); mod.body += '<Term id="nope">x</Term>';
	assert.match(checkModule(mod, outline, new Set(['lat'])).join(), /nope/);
	mod.body = good().body + '<Term id="lat">x</Term>';
	assert.deepEqual(checkModule(mod, outline, new Set(['lat'])), []);
});
