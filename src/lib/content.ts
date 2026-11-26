import type { Component } from 'svelte';
import { allModules } from './outline.js';

export type Source = { id: string; title: string; url: string; license: string; use: 'copied' | 'reworded' | 'quoted' };
export type Question = { prompt: string; options: string[]; correct: number; explanation: string };
export type ModuleMeta = {
	slug: string;
	title: string;
	section: string;
	readFirst?: string[];
	sources: Source[];
	quiz: Question[];
};

const docs = import.meta.glob<{ default: Component; metadata: ModuleMeta }>('/src/content/modules/*.md');
const path = (slug: string) => `/src/content/modules/${slug}.md`;

/** Slugs of modules that have been written. Unwritten ones render as planned text, never as links. */
export const written = new Set(Object.keys(docs).map((p) => p.slice(p.lastIndexOf('/') + 1, -3)));

export const loadModule = async (slug: string) => {
	const load = docs[path(slug)];
	return load ? load() : undefined;
};

export const findModule = (slug: string) => allModules.find((m) => m.slug === slug);

/** Nearest written module before and after this one in outline order, skipping unwritten ones. */
export const neighbours = (slug: string) => {
	const ready = allModules.filter((m) => written.has(m.slug) || m.slug === slug);
	const i = ready.findIndex((m) => m.slug === slug);
	return { prev: ready[i - 1], next: ready[i + 1] };
};
