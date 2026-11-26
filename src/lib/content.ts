import type { Component } from 'svelte';
import { allModules } from './outline.js';

export type Source = { id: string; title: string; url: string; license: string; use: 'copied' | 'reworded' | 'quoted' };
export type ModuleMeta = { slug: string; title: string; section: string; readFirst?: string[]; sources: Source[] };

const docs = import.meta.glob<{ default: Component; metadata: ModuleMeta }>('/src/content/modules/*.md');
const path = (slug: string) => `/src/content/modules/${slug}.md`;

/** Slugs of modules that have been written. Unwritten ones render as "coming soon", never as links. */
export const written = new Set(Object.keys(docs).map((p) => p.slice(p.lastIndexOf('/') + 1, -3)));

export const loadModule = async (slug: string) => {
	const load = docs[path(slug)];
	return load ? load() : undefined;
};

export const findModule = (slug: string) => allModules.find((m) => m.slug === slug);

/** Previous and next module in outline order, across sections. */
export const neighbours = (slug: string) => {
	const i = allModules.findIndex((m) => m.slug === slug);
	return { prev: allModules[i - 1], next: allModules[i + 1] };
};
