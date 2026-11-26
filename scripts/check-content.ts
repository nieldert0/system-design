// Build-time content check: fails the build when a module is malformed.
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { outline as siteOutline, type OutlineSection } from '../src/lib/outline.ts';

export const REQUIRED_SECTIONS = ['What it is', 'How it works', 'Trade-offs', 'Interview tips'];
const USES = ['copied', 'reworded', 'quoted'];

type Mod = { file: string; slug: string; metadata: Record<string, any>; body: string };

export function checkModule({ file, slug, metadata: md, body }: Mod, outline: OutlineSection[]): string[] {
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
	for (const h of REQUIRED_SECTIONS)
		if (!new RegExp(`^## ${h}\\s*$`, 'm').test(body)) err(`missing section "## ${h}"`);
	for (const ref of md.readFirst ?? []) if (!slugs.has(ref)) err(`readFirst "${ref}" is an unknown slug`);

	const sources: any[] = Array.isArray(md.sources) ? md.sources : [];
	if (!sources.length) err('no sources listed');
	for (const [i, s] of sources.entries())
		for (const key of ['id', 'title', 'url', 'license'])
			if (!s?.[key]) err(`source ${i + 1} is missing its ${key}`);
	for (const s of sources) if (s && !USES.includes(s.use)) err(`source "${s.id}" use must be one of ${USES.join('/')}`);
	const ids = new Set(sources.map((s) => s?.id));
	for (const [, id] of body.matchAll(/<Src\s+id="([^"]*)"/g)) if (!ids.has(id)) err(`chip cites undeclared source "${id}"`);
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

export function readModules(dir = 'src/content/modules'): Mod[] {
	return readdirSync(dir).filter((f) => f.endsWith('.md')).map((file) => {
		const raw = readFileSync(`${dir}/${file}`, 'utf8');
		const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
		return { file, slug: file.slice(0, -3), metadata: fm ? parse(fm[1]) ?? {} : {}, body: fm ? raw.slice(fm[0].length) : raw };
	});
}

if (import.meta.main) {
	const errors = readModules().flatMap((mod) => checkModule(mod, siteOutline));
	if (errors.length) {
		console.error(`Content check failed:\n  ${errors.join('\n  ')}`);
		process.exit(1);
	}
	console.log('Content check passed');
}
