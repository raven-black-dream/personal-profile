/**
 * AI Readiness Snapshot — content & rubric.
 *
 * ⚠️ PLACEHOLDER CONTENT (v0, 2026-06-28). Drawn from
 * `Consultancy/brainstorms/ai-readiness-snapshot-content-DRAFT.md`.
 * Evan is refining the exact wording, scores, weights, band thresholds, and
 * the observation snippet bank. DO NOT treat these numbers/copy as final —
 * the structure is real; the content is a stand-in so the page can be built
 * and reviewed. The scoring engine (`scoring.ts`) reads everything from here,
 * so refining this file is all that's needed to finalise the tool.
 */

export type Branch = 'llm' | 'ml' | 'both';

export interface Option {
	label: string;
	/** 1–4 readiness score, or omitted for a gate option. */
	score?: number;
	/** If set, choosing this option hard-fails the snapshot on the given path. */
	gate?: 'llm-deterministic' | 'ml-no-data';
}

export interface Question {
	id: string;
	/** Which dimension this question scores. */
	dimension: DimensionId;
	prompt: string;
	options: Option[];
	/** Only ask on these branches (default: all). */
	branches?: Branch[];
}

export type DimensionId =
	| 'use-case-fit'
	| 'team-capability'
	| 'data-foundation'
	| 'tooling-infra'
	| 'governance-risk';

export interface Dimension {
	id: DimensionId;
	label: string;
	/** Relative weight by branch (0 = not counted on that branch). */
	weight: Record<Branch, number>;
}

/** Q0 — sets the branch and the dimension weighting. */
export const INTENT_QUESTION = {
	id: 'intent',
	prompt: 'What are you mainly hoping AI will do for you?',
	options: [
		{
			label: 'Help my people work faster — drafting, summarising, answering questions, research',
			branch: 'llm' as Branch
		},
		{
			label:
				'Predict, score, or flag things from our own data — forecasting, risk-scoring, spotting problems',
			branch: 'ml' as Branch
		},
		{ label: "Both, or I'm not sure yet", branch: 'both' as Branch }
	]
};

// PLACEHOLDER weights — Evan to calibrate. LLM leans on use-case + team;
// ML leans on data foundation; "both" is a blend.
export const DIMENSIONS: Dimension[] = [
	{ id: 'use-case-fit', label: 'Use-case fit', weight: { llm: 3, ml: 2, both: 3 } },
	{ id: 'team-capability', label: 'Team capability', weight: { llm: 3, ml: 1, both: 2 } },
	{ id: 'data-foundation', label: 'Data foundation', weight: { llm: 1, ml: 3, both: 2 } },
	{ id: 'tooling-infra', label: 'Tooling & infra', weight: { llm: 1, ml: 2, both: 1 } },
	{ id: 'governance-risk', label: 'Governance & risk', weight: { llm: 1, ml: 1, both: 1 } }
];

// PLACEHOLDER questions — Evan to refine wording/options/scores.
export const QUESTIONS: Question[] = [
	{
		id: 'uc1',
		dimension: 'use-case-fit',
		prompt:
			'For the task you have in mind, is there one exact answer that has to be right every single time — or a range of "good enough" answers a person can sanity-check?',
		branches: ['llm', 'both'],
		options: [
			{ label: 'One exact answer, must be right every time', gate: 'llm-deterministic' },
			{ label: 'Mostly needs to be right, but a person reviews it', score: 2 },
			{ label: 'A range of good-enough is fine', score: 4 }
		]
	},
	{
		id: 'uc2',
		dimension: 'use-case-fit',
		prompt: 'Which best describes the task?',
		options: [
			{ label: "I just want to 'use AI more'", score: 1 },
			{ label: "A general area (e.g. 'customer service', 'marketing')", score: 2 },
			{ label: 'A specific task, but it only comes up occasionally', score: 3 },
			{ label: 'A specific task people do over and over that eats hours every week', score: 4 }
		]
	},
	{
		id: 'uc3',
		dimension: 'use-case-fit',
		prompt: "Could someone on your team reliably tell whether the AI's output is good?",
		options: [
			{ label: 'No / not sure', score: 1 },
			{ label: 'Sometimes', score: 2 },
			{ label: "Yes — we know what 'good' looks like", score: 4 }
		]
	},
	{
		id: 'tc1',
		dimension: 'team-capability',
		prompt: 'In the last week, how many people on your team used an AI tool for real work?',
		options: [
			{ label: 'None', score: 1 },
			{ label: '1–2', score: 2 },
			{ label: 'A handful', score: 3 },
			{ label: 'Most of them', score: 4 }
		]
	},
	{
		id: 'tc2',
		dimension: 'team-capability',
		prompt:
			'When your team uses AI, can they usually get it to produce what they actually need — and catch it when it’s wrong?',
		options: [
			{ label: 'Rarely', score: 1 },
			{ label: 'Sometimes', score: 2 },
			{ label: 'Usually', score: 4 }
		]
	},
	{
		id: 'tc3',
		dimension: 'team-capability',
		prompt: 'Could your leadership name a task AI should NOT be trusted with?',
		options: [
			{ label: 'No', score: 1 },
			{ label: 'Maybe, vaguely', score: 2 },
			{ label: 'Yes, clearly', score: 4 }
		]
	},
	{
		id: 'df1',
		dimension: 'data-foundation',
		prompt:
			'The thing you want AI to predict or flag — do you already have records of it actually happening, going back a while, that someone could export from a system?',
		branches: ['ml', 'both'],
		options: [
			{ label: 'No records of it / no real history', gate: 'ml-no-data' },
			{ label: 'Some, but patchy or short', score: 2 },
			{ label: 'Yes — consistent records going back a while', score: 4 }
		]
	},
	{
		id: 'df2',
		dimension: 'data-foundation',
		prompt: 'Where does that data mostly live?',
		options: [
			{ label: "On paper / in people's heads", score: 1 },
			{ label: 'Scattered spreadsheets', score: 2 },
			{ label: 'A few systems', score: 3 },
			{ label: 'One clean system', score: 4 }
		]
	},
	{
		id: 'ti1',
		dimension: 'tooling-infra',
		prompt:
			'Can you get data in and out of your main systems easily (exports or integrations) — or is most of it locked in legacy tools, spreadsheets, or manual work?',
		options: [
			{ label: 'Locked in / manual', score: 1 },
			{ label: 'Some exports', score: 2 },
			{ label: 'Mostly yes', score: 3 },
			{ label: 'Yes — APIs / integrations', score: 4 }
		]
	},
	{
		id: 'gr1',
		dimension: 'governance-risk',
		prompt: 'If the AI gets one wrong and nobody catches it, what happens?',
		options: [
			{ label: 'Real damage — money, legal, safety, reputation', score: 1 },
			{ label: 'Some rework', score: 2 },
			{ label: 'Minor annoyance', score: 4 }
		]
	}
];

export interface Band {
	id: 'not-a-fit' | 'foundations-first' | 'ready-to-prioritise' | 'ready-to-build';
	label: string;
	/** Normalised score (0–100) lower bound; ignored for the gate band. */
	min: number;
	blurb: string;
	/** The honest next step (routed copy). */
	cta: string;
}

// PLACEHOLDER bands & thresholds — Evan to calibrate the numbers.
// Note: 'not-a-fit' is selected only when a gate triggers (not by score).
export const BANDS: Band[] = [
	{
		id: 'not-a-fit',
		label: 'Not a fit (yet)',
		min: 0,
		blurb:
			'Based on what you described, AI isn’t the right next step here — at least not yet. That’s a useful answer: it saves you from spending on the wrong thing. Here’s what would change that.',
		cta: 'Read why (or ask me directly)'
	},
	{
		id: 'ready-to-build',
		label: 'Ready to build',
		min: 75,
		blurb:
			"You've got a specific, well-understood use case, a team already working with these tools, and a sensible read on the risks. You're past “should we?” and into “which one first, and how.”",
		cta: 'Apply for a no-pitch fit call'
	},
	{
		id: 'ready-to-prioritise',
		label: 'Ready to prioritise',
		min: 50,
		blurb:
			'The pieces are mostly here, but they need sequencing — which bet first, what to skip, and a plan you can hand your team. That is exactly what the AI Readiness Audit produces.',
		cta: 'See the AI Readiness Audit'
	},
	{
		id: 'foundations-first',
		label: 'Foundations first',
		min: 0,
		blurb:
			'There is a real opportunity here, but a foundation needs to come first before an Audit would pay off. The most useful next step is closing that gap — often a short, practical session.',
		cta: 'See how a workshop could help'
	}
];

/**
 * Observation snippet bank — PLACEHOLDER copy, in Evan's draft voice.
 * Keyed by trigger; the engine assembles up to 3 (gate first, then the
 * lowest-scoring dimensions). Evan to finalise wording.
 */
export const SNIPPETS: Record<string, string> = {
	'gate:llm-deterministic':
		'The task you described needs the same exact answer every time. Today’s LLMs are probabilistic — brilliant at “good enough, a human checks it,” and the wrong tool when “correct every time” is the whole point. A rules-based automation will serve you better here than AI.',
	'gate:ml-no-data':
		'To predict or flag something, a model has to learn from past examples of it happening — and you don’t yet have those records with enough history. The highest-value first step isn’t AI; it’s starting to capture that data cleanly. Do that for a few months and this becomes possible.',
	'low:use-case-fit':
		'Right now this reads more like “use AI more” than a specific job. The teams that get value name one task — done often, costing real hours — and point AI at exactly that. Pick the single most repetitive time-sink and start there.',
	'low:team-capability':
		'The biggest predictor isn’t the tech — it’s whether your people (and leadership) are actually working with these tools and know their limits. A short, practical session to get a few people productive will move you further than any strategy doc.',
	'low:data-foundation':
		'Your data is spread across spreadsheets and manual steps. Models need it accessible and consistent — so the highest-leverage move is tidying how it’s captured before building anything on top.',
	'low:tooling-infra':
		'Getting data in and out of your systems is still mostly manual. That’s a solvable plumbing problem, and worth solving before you automate on top of it.',
	'low:governance-risk':
		'A wrong answer here causes real damage, so this needs a human firmly in the loop and clear guardrails before any automation. Worth doing — carefully, not quickly.',
	strong:
		'You’ve got a specific, well-understood use case, a team that’s already working with these tools, and a sensible read on the risks. The question now is sequencing — which one first, and how.'
};
