// Reactive, browser-only view of the progress module. On the server (prerender) nothing is passed;
// the layout calls hydrateProgress() after mount so stored progress appears without a hydration mismatch.
import { createProgress, type Tier } from './progress.js';

const noop = createProgress(null);
let real: typeof noop | undefined;
let version = $state(0);

const get = () => {
	void version; // read so callers re-run when progress changes
	return real ?? noop;
};

export function hydrateProgress() {
	let storage: Storage | null = null;
	try {
		storage = window.localStorage;
	} catch {
		// Storage blocked: progress lasts for this visit only.
	}
	real = createProgress(storage);
	version++;
}

export const progress = {
	isPassed: (slug: string) => get().isPassed(slug),
	bestScore: (slug: string) => get().bestScore(slug),
	getTier: () => get().getTier(),
	nextUnfinished: (slugs: string[]) => get().nextUnfinished(slugs),
	recordScore(slug: string, correct: number, total: number) {
		(real ?? noop).recordScore(slug, correct, total);
		version++;
	},
	setTier(tier: Tier) {
		(real ?? noop).setTier(tier);
		version++;
	}
};
