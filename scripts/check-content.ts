// Build-time content check: fails the build when a module is malformed.
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { outline as siteOutline, type OutlineSection, type Visual } from '../src/lib/outline.ts';
import { glossary as siteGlossary, type GlossaryEntry } from '../src/lib/glossary.ts';
import { studyPlan as siteStudyPlan } from '../src/lib/study-plan.ts';

export const REQUIRED_SECTIONS = ['What it is', 'How it works', 'Trade-offs', 'Interview tips'];
const USES = ['copied', 'reworded', 'quoted'];
export const DEPTH_SECTIONS = ['Worked example', 'In the real world', 'Common follow-up questions', 'Go deeper'];
export const CASE_STUDY_SECTIONS = [
	'Requirements',
	'Capacity estimates',
	'API',
	'Data model',
	'High-level design',
	'Deep dives',
	'Bottlenecks and scaling',
	'Common follow-up questions',
	'Go deeper'
];
export const MIN_WORDS = { concept: 1500, caseStudy: 2000 };

function sectionBody(body: string, heading: string): string {
	const start = body.search(new RegExp(`^## ${heading}\\s*$`, 'm'));
	if (start < 0) return '';
	const rest = body.slice(start).replace(/^.*\n/, '');
	const end = rest.search(/^## /m);
	return end < 0 ? rest : rest.slice(0, end);
}

export function wordCount(body: string): number {
	const text = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
	return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

type Mod = { file: string; slug: string; metadata: Record<string, any>; body: string };

export function checkModule(
	{ file, slug, metadata: md, body }: Mod,
	outline: OutlineSection[],
	glossaryIds?: Set<string>,
	visualKinds?: Record<string, Visual>
): string[] {
	const errors: string[] = [];
	const err = (msg: string) => errors.push(`${file}: ${msg}`);
	const slugs = new Set(outline.flatMap((s) => s.modules.map((m) => m.slug)));
	const section = outline.find((s) => s.modules.some((m) => m.slug === slug));
	const entry = section?.modules.find((m) => m.slug === slug);

	if (!section || !entry) err(`slug "${slug}" is not in the outline`);
	else {
		if (md.slug !== slug) err(`frontmatter slug "${md.slug}" does not match file name "${slug}"`);
		if (md.title !== entry.title) err(`title "${md.title}" does not match outline "${entry.title}"`);
		if (md.section !== section.slug) err(`section "${md.section}" does not match outline "${section.slug}"`);
	}
	if (entry && visualKinds && entry.visual !== 'none') {
		const used = [...body.matchAll(/<([A-Z]\w*)/g)].map(([, name]) => visualKinds[name]);
		if (!used.includes(entry.visual)) err(`marked visual "${entry.visual}" in the outline but uses no ${entry.visual} component`);
	}
	for (const h of REQUIRED_SECTIONS)
		if (!new RegExp(`^## ${h}\\s*$`, 'm').test(body)) err(`missing section "## ${h}"`);
	const caseStudy = section?.slug === 'case-studies';
	for (const h of caseStudy ? CASE_STUDY_SECTIONS : DEPTH_SECTIONS)
		if (!new RegExp(`^## ${h}\\s*$`, 'm').test(body)) err(`missing section "## ${h}"`);
	const links = sectionBody(body, 'Go deeper').match(/\]\(https?:\/\//g) ?? [];
	if (links.length < 2) err('"Go deeper" needs at least 2 links');
	const questions = sectionBody(body, 'Common follow-up questions').match(/^### /gm) ?? [];
	if (questions.length < 3) err('"Common follow-up questions" needs at least 3 questions (### headings)');
	const min = caseStudy ? MIN_WORDS.caseStudy : MIN_WORDS.concept;
	const words = wordCount(body);
	if (words < min) err(`body has ${words} words, below the ${min}-word floor`);
	for (const ref of md.readFirst ?? []) if (!slugs.has(ref)) err(`readFirst "${ref}" is an unknown slug`);

	const sources: any[] = Array.isArray(md.sources) ? md.sources : [];
	if (!sources.length) err('no sources listed');
	for (const [i, s] of sources.entries())
		for (const key of ['id', 'title', 'url', 'license'])
			if (!s?.[key]) err(`source ${i + 1} is missing its ${key}`);
	for (const s of sources) if (s && !USES.includes(s.use)) err(`source "${s.id}" use must be one of ${USES.join('/')}`);
	const ids = new Set(sources.map((s) => s?.id));
	for (const [, id] of body.matchAll(/<Src\s+id="([^"]*)"/g)) if (!ids.has(id)) err(`chip cites undeclared source "${id}"`);
	if (glossaryIds)
		for (const [, id] of body.matchAll(/<Term\s+id="([^"]*)"/g))
			if (!glossaryIds.has(id)) err(`term "${id}" is not in the glossary`);

	const quiz = md.quiz;
	if (!Array.isArray(quiz) || quiz.length < 5 || quiz.length > 8) err('quiz must have 5-8 questions');
	else
		quiz.forEach((q: any, i: number) => {
			const n = `quiz question ${i + 1}`;
			if (!q?.prompt) err(`${n} is missing its prompt`);
			if (!Array.isArray(q?.options) || q.options.length < 2) err(`${n} needs at least 2 options`);
			else if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length)
				err(`${n} needs exactly one correct option (an index into options)`);
			if (!q?.explanation) err(`${n} is missing its explanation`);
		});
	return errors;
}

export function checkGlossary(entries: GlossaryEntry[], outline: OutlineSection[]): string[] {
	const errors: string[] = [];
	const slugs = new Set(outline.flatMap((s) => s.modules.map((m) => m.slug)));
	const seen = new Set<string>();
	for (const e of entries) {
		const err = (msg: string) => errors.push(`glossary "${e.id}": ${msg}`);
		if (seen.has(e.id)) err('duplicate id');
		seen.add(e.id);
		if (!e.term) err('missing term');
		if (!e.definition) err('missing definition');
		if (!slugs.has(e.module)) err(`teaching module "${e.module}" is an unknown slug`);
		if (!e.source) err('missing source');
		else for (const key of ['title', 'url', 'license'] as const) if (!e.source[key]) err(`source is missing its ${key}`);
	}
	return errors;
}

export function checkStudyPlan(tiers: { id: string; slugs: string[] }[], outline: OutlineSection[]): string[] {
	const slugs = new Set(outline.flatMap((s) => s.modules.map((m) => m.slug)));
	return tiers.flatMap((t) => [
		...(t.slugs.length ? [] : [`study plan "${t.id}" is empty`]),
		...t.slugs.filter((s) => !slugs.has(s)).map((s) => `study plan "${t.id}" lists unknown slug "${s}"`)
	]);
}

// Classifies each diagram component by what it wraps: a walkthrough player or a static Diagram.
export function readVisualKinds(dir = 'src/lib/diagrams'): Record<string, Visual> {
	const kinds: Record<string, Visual> = {};
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.svelte'))) {
		const src = readFileSync(`${dir}/${file}`, 'utf8');
		if (/Walkthrough\.svelte/.test(src)) kinds[file.slice(0, -7)] = 'walkthrough';
		else if (/Diagram\.svelte/.test(src)) kinds[file.slice(0, -7)] = 'diagram';
	}
	return kinds;
}

export function readModules(dir = 'src/content/modules'): Mod[] {
	return readdirSync(dir).filter((f) => f.endsWith('.md')).map((file) => {
		const raw = readFileSync(`${dir}/${file}`, 'utf8');
		const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
		return { file, slug: file.slice(0, -3), metadata: fm ? parse(fm[1]) ?? {} : {}, body: fm ? raw.slice(fm[0].length) : raw };
	});
}

if (import.meta.main) {
	const ids = new Set(siteGlossary.map((e) => e.id));
	const visualKinds = readVisualKinds();
	const errors = [
		...checkGlossary(siteGlossary, siteOutline),
		...checkStudyPlan(siteStudyPlan, siteOutline),
		...readModules().flatMap((mod) => checkModule(mod, siteOutline, ids, visualKinds))
	];
	if (errors.length) {
		console.error(`Content check failed:\n  ${errors.join('\n  ')}`);
		process.exit(1);
	}
	console.log('Content check passed');
}
