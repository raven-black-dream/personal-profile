/**
 * AI Readiness Snapshot — scoring engine.
 *
 * Deterministic, rule-based — NO LLM. This is deliberate: a readiness verdict
 * has a defined-right answer, low tolerance for being wrong, and must be
 * verifiable — exactly the case where you should NOT use an LLM. The tool
 * practices what it preaches. (See the rubric brainstorm for the reasoning.)
 *
 * Reads all content/weights/thresholds from `snapshot-content.ts`, so the
 * (placeholder) rubric can be refined there without touching this logic.
 *
 * v0.2 (STORM validation pass): adds intent-sensitive weight overrides
 * (Option.weightMod), a TARGETED non-compensatory floor so a strong average
 * can't green-light a use case the brand exists to reject, and chosen-option
 * insight snippets (gate-split teaching moment, privacy flag).
 */

import {
	BANDS,
	DIMENSIONS,
	QUESTIONS,
	SNIPPETS,
	type Band,
	type Branch,
	type DimensionId,
	type Option,
	type Question
} from './snapshot-content';

/** answers: questionId -> chosen option index. */
export type Answers = Record<string, number>;

export interface DimensionScore {
	id: DimensionId;
	label: string;
	/** Normalised 0–100 for the dimension (null if no applicable answered question). */
	normalised: number | null;
	/** Effective weight on this run (may be overridden by an Option.weightMod). */
	weight: number;
	/** How many scored questions fed this dimension on this run. Single-item
	 *  dimensions are rendered as an ordinal band, not a 0–100 number (false
	 *  precision — see the rubric validation report). */
	items: number;
}

export interface SnapshotResult {
	branch: Branch;
	gate: 'llm-deterministic' | 'ml-no-data' | null;
	/** Overall normalised readiness 0–100 (0 when gated). */
	overall: number;
	band: Band;
	/** If the targeted floor capped the band, the SNIPPETS key explaining why. */
	capReason: string | null;
	dimensions: DimensionScore[];
	/** Up to 3 observation strings (gate/cap first, then insights, then weakest dimensions). */
	observations: string[];
}

/** Any single contributing dimension below this caps the use-case path (see floor). */
const FLOOR_T = 25;

export function questionsForBranch(branch: Branch): Question[] {
	return QUESTIONS.filter((q) => !q.branches || q.branches.includes(branch));
}

/** Map a raw 1–4 score to 0–100. */
function normalise(avg: number): number {
	return Math.round(((avg - 1) / 3) * 100);
}

function bandById(id: Band['id']): Band {
	return BANDS.find((b) => b.id === id) as Band;
}

export function scoreSnapshot(branch: Branch, answers: Answers): SnapshotResult {
	const applicable = questionsForBranch(branch);
	const chosen: Option[] = applicable
		.map((q) => (answers[q.id] != null ? q.options[answers[q.id]] : undefined))
		.filter((o): o is Option => o != null);

	// 1. Gate check — a single gated answer overrides everything.
	let gate: SnapshotResult['gate'] = null;
	for (const opt of chosen) {
		if (opt.gate) {
			gate = opt.gate;
			break;
		}
	}

	// 2. Effective weights — start from the branch weights, apply any Option.weightMod overrides.
	const effWeight = {} as Record<DimensionId, number>;
	for (const dim of DIMENSIONS) effWeight[dim.id] = dim.weight[branch];
	for (const opt of chosen) {
		if (opt.weightMod) {
			for (const key of Object.keys(opt.weightMod) as DimensionId[]) {
				const w = opt.weightMod[key];
				if (typeof w === 'number') effWeight[key] = w;
			}
		}
	}

	// 3. Per-dimension normalised scores (average of answered, scored questions).
	const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => {
		const weight = effWeight[dim.id];
		const scores = applicable
			.filter((q) => q.dimension === dim.id)
			.map((q) => q.options[answers[q.id]]?.score)
			.filter((s): s is number => typeof s === 'number');
		const normalised =
			scores.length > 0 ? normalise(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
		return { id: dim.id, label: dim.label, normalised, weight, items: scores.length };
	});

	// 4. Weighted overall (only dimensions with a score and non-zero weight on this branch).
	const weighted = dimensions.filter((d) => d.normalised != null && d.weight > 0);
	const totalWeight = weighted.reduce((a, d) => a + d.weight, 0);
	const overall =
		gate || totalWeight === 0
			? 0
			: Math.round(
					weighted.reduce((a, d) => a + (d.normalised as number) * d.weight, 0) / totalWeight
				);

	// 5. Band. A gate → "not a fit (yet)"; else score-based, then the targeted floor.
	let band: Band;
	let capReason: string | null = null;
	if (gate) {
		band = bandById('not-a-fit');
	} else {
		band = pickBand(overall);
		const ucf = dimensions.find((d) => d.id === 'use-case-fit');
		const realDamage = chosen.some((o) => o.cap === 'real-damage');
		const cannotVerify = chosen.some((o) => o.cap === 'cannot-verify');
		// R1 — an unfit use case can't be rescued by a strong stack.
		if (ucf && ucf.normalised != null && ucf.weight > 0 && ucf.normalised < FLOOR_T) {
			band = bandById('foundations-first');
			capReason = 'cap:use-case';
		}
		// R2 — costly errors AND no way to verify "good" = no safe loop.
		else if (realDamage && cannotVerify) {
			band = bandById('foundations-first');
			capReason = 'cap:risk-blind';
		}
		// R2 — costly errors alone: never a green light; cap at "prioritise".
		else if (realDamage && band.id === 'ready-to-build') {
			band = bandById('ready-to-prioritise');
			capReason = 'cap:real-damage';
		}
	}

	// 6. Observations — gate/cap first, then chosen-option insights, then weakest dimensions.
	const observations: string[] = [];
	const push = (s: string | undefined) => {
		if (s && !observations.includes(s)) observations.push(s);
	};

	if (gate) {
		push(SNIPPETS[`gate:${gate}`]);
	} else {
		if (capReason) push(SNIPPETS[capReason]);
		// Chosen-option insights (gate-split "front door" fit, privacy flag).
		for (const opt of chosen) if (opt.insight) push(SNIPPETS[opt.insight]);
		if (!capReason && overall >= 75) push(SNIPPETS.strong);
		// Weakest scored dimensions (below the "ready" line).
		const weakest = weighted
			.slice()
			.sort((a, b) => (a.normalised as number) - (b.normalised as number))
			.filter((d) => (d.normalised as number) < 75);
		for (const d of weakest) {
			if (observations.length >= 3) break;
			push(SNIPPETS[`low:${d.id}`]);
		}
	}

	return {
		branch,
		gate,
		overall,
		band,
		capReason,
		dimensions,
		observations: observations.slice(0, 3)
	};
}

function pickBand(overall: number): Band {
	// Score-based bands only (exclude 'not-a-fit', which is gate-only). Sorted
	// high→low by `min` here so band selection never depends on array order.
	const scored = BANDS.filter((b) => b.id !== 'not-a-fit').sort((a, b) => b.min - a.min);
	return scored.find((b) => overall >= b.min) ?? scored[scored.length - 1];
}

/** True once every applicable question has an answer. */
export function isComplete(branch: Branch, answers: Answers): boolean {
	return questionsForBranch(branch).every((q) => answers[q.id] != null);
}
