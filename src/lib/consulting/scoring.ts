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
 */

import {
	BANDS,
	DIMENSIONS,
	QUESTIONS,
	SNIPPETS,
	type Band,
	type Branch,
	type DimensionId,
	type Question
} from './snapshot-content';

/** answers: questionId -> chosen option index. */
export type Answers = Record<string, number>;

export interface DimensionScore {
	id: DimensionId;
	label: string;
	/** Normalised 0–100 for the dimension (null if no applicable answered question). */
	normalised: number | null;
	weight: number;
}

export interface SnapshotResult {
	branch: Branch;
	gate: 'llm-deterministic' | 'ml-no-data' | null;
	/** Overall normalised readiness 0–100 (0 when gated). */
	overall: number;
	band: Band;
	dimensions: DimensionScore[];
	/** Up to 3 observation strings (gate first, then weakest dimensions). */
	observations: string[];
}

export function questionsForBranch(branch: Branch): Question[] {
	return QUESTIONS.filter((q) => !q.branches || q.branches.includes(branch));
}

/** Map a raw 1–4 score to 0–100. */
function normalise(avg: number): number {
	return Math.round(((avg - 1) / 3) * 100);
}

export function scoreSnapshot(branch: Branch, answers: Answers): SnapshotResult {
	const applicable = questionsForBranch(branch);

	// 1. Gate check — a single gated answer overrides everything.
	let gate: SnapshotResult['gate'] = null;
	for (const q of applicable) {
		const idx = answers[q.id];
		const opt = idx != null ? q.options[idx] : undefined;
		if (opt?.gate) {
			gate = opt.gate;
			break;
		}
	}

	// 2. Per-dimension normalised scores (average of answered, scored questions).
	const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => {
		const weight = dim.weight[branch];
		const scores = applicable
			.filter((q) => q.dimension === dim.id)
			.map((q) => q.options[answers[q.id]]?.score)
			.filter((s): s is number => typeof s === 'number');
		const normalised =
			scores.length > 0 ? normalise(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
		return { id: dim.id, label: dim.label, normalised, weight };
	});

	// 3. Weighted overall (only dimensions with a score and non-zero weight on this branch).
	const weighted = dimensions.filter((d) => d.normalised != null && d.weight > 0);
	const totalWeight = weighted.reduce((a, d) => a + d.weight, 0);
	const overall =
		gate || totalWeight === 0
			? 0
			: Math.round(
					weighted.reduce((a, d) => a + (d.normalised as number) * d.weight, 0) / totalWeight
				);

	// 4. Band. A gate → the explicit "not a fit (yet)" band; else score-based.
	const band = gate
		? (BANDS.find((b) => b.id === 'not-a-fit') as Band)
		: pickBand(overall);

	// 5. Observations — gate first, else weakest dimensions; "strong" if high.
	const observations: string[] = [];
	if (gate) {
		observations.push(SNIPPETS[`gate:${gate}`]);
	} else {
		if (overall >= 75) observations.push(SNIPPETS.strong);
		const weakest = weighted
			.slice()
			.sort((a, b) => (a.normalised as number) - (b.normalised as number))
			.filter((d) => (d.normalised as number) < 75)
			.slice(0, overall >= 75 ? 2 : 3);
		for (const d of weakest) {
			const snippet = SNIPPETS[`low:${d.id}`];
			if (snippet && !observations.includes(snippet)) observations.push(snippet);
		}
	}

	return { branch, gate, overall, band, dimensions, observations: observations.slice(0, 3) };
}

function pickBand(overall: number): Band {
	// Score-based bands only (exclude 'not-a-fit', which is gate-only), high→low by `min`.
	const scored = BANDS.filter((b) => b.id !== 'not-a-fit');
	return scored.find((b) => overall >= b.min) ?? scored[scored.length - 1];
}

/** True once every applicable question has an answer. */
export function isComplete(branch: Branch, answers: Answers): boolean {
	return questionsForBranch(branch).every((q) => answers[q.id] != null);
}
