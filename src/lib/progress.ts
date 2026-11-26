// Quiz progress and study-plan tier, kept in browser storage.
// Survives storage that is empty, corrupted, missing or throwing: it then lives in memory for the session.

export const PASS_THRESHOLD = 0.8;
export const TIERS = ['short', 'medium', 'long'] as const;
export type Tier = (typeof TIERS)[number];

type KV = { getItem(key: string): string | null; setItem(key: string, value: string): void };
type State = { scores: Record<string, number>; tier?: Tier };

const KEY = 'sdn-progress';

function parse(raw: string | null): State {
	try {
		const v = JSON.parse(raw ?? '');
		const scores: Record<string, number> = {};
		if (v && typeof v.scores === 'object' && !Array.isArray(v.scores))
			for (const [k, s] of Object.entries(v.scores)) if (typeof s === 'number' && s >= 0 && s <= 1) scores[k] = s;
		return { scores, tier: TIERS.includes(v?.tier) ? v.tier : undefined };
	} catch {
		return { scores: {} };
	}
}

export function createProgress(storage: KV | null) {
	let state: State;
	try {
		state = parse(storage?.getItem(KEY) ?? null);
	} catch {
		state = { scores: {} };
	}
	const save = () => {
		try {
			storage?.setItem(KEY, JSON.stringify(state));
		} catch {
			// Blocked or full: keep the in-memory state.
		}
	};
	const bestScore = (slug: string): number | undefined => state.scores[slug];
	const isPassed = (slug: string) => (bestScore(slug) ?? 0) >= PASS_THRESHOLD;

	return {
		recordScore(slug: string, correct: number, total: number) {
			const score = total > 0 ? correct / total : 0;
			if (score > (bestScore(slug) ?? -1)) {
				state.scores[slug] = score;
				save();
			}
		},
		bestScore,
		isPassed,
		getTier: () => state.tier,
		setTier(tier: Tier) {
			state.tier = tier;
			save();
		},
		/** First slug of the tier's list whose quiz isn't passed yet. */
		nextUnfinished: (tierSlugs: string[]) => tierSlugs.find((s) => !isPassed(s))
	};
}
