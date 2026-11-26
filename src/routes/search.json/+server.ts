// Build-time search index: module titles, their headings, and glossary terms.
import { json } from '@sveltejs/kit';
import { allModules } from '#lib/outline.js';
import { glossary } from '#lib/glossary.js';
import type { DocumentText } from 'mdsvex';

export const prerender = true;

export type SearchEntry = { kind: 'module' | 'heading' | 'term'; label: string; context: string; href: string };

const texts = import.meta.glob<DocumentText>('/src/content/modules/*.md', { query: '?text', import: 'default', eager: true });

export function GET() {
	const entries: SearchEntry[] = [];
	for (const m of allModules) {
		const text = texts[`/src/content/modules/${m.slug}.md`];
		if (!text) continue; // unwritten modules have no page to link to
		const href = `/modules/${m.slug}`;
		entries.push({ kind: 'module', label: m.title, context: m.sectionTitle, href });
		for (const s of text.sections)
			if (s.id && s.depth >= 2) entries.push({ kind: 'heading', label: s.heading, context: m.title, href: `${href}#${s.id}` });
	}
	for (const g of glossary) entries.push({ kind: 'term', label: g.term, context: 'Glossary', href: `/glossary#${g.id}` });
	return json(entries);
}
