import { error } from '@sveltejs/kit';
import { findModule, loadModule, written } from '#lib/content.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => [...written].map((slug) => ({ slug }));

export const load: PageLoad = async ({ params }) => {
	const doc = await loadModule(params.slug);
	const mod = findModule(params.slug);
	if (!doc || !mod) error(404, 'Module not found');
	return { slug: params.slug, sectionTitle: mod.sectionTitle, component: doc.default, meta: doc.metadata };
};
