/**
 * AI Readiness Snapshot — content & rubric.
 *
 * ⚠️ PLACEHOLDER CONTENT (v0.4, 2026-07-13). Wording/scores/thresholds are still
 * Evan's to finalise. What changed in v0.4 (new dimension — see decision R13 in
 * `Consultancy/brainstorms/ai-readiness-index-rubric.md`, ticket T-0135):
 *   - New dimension `process-clarity`: does how the business runs and decides exist
 *     outside people's heads? An agent can only act on what is written down, so an
 *     undocumented process is not an automation candidate. Two behavioural items
 *     (pc1 two-week-absence test, pc2 decision capture) — asking "are you documented?"
 *     directly would invite the same self-flattery the tc/uc items are shaped to avoid.
 *   - Weights llm 2 / ml 1 / both 2: on the LLM path it is the ceiling on anything past
 *     individual copilot use; on the ML path data foundation already carries the load.
 *   - NOT a gate (coachable, and it is exactly what the build offer produces). A low
 *     score routes to the Audit as a sequencing constraint.
 *   - The paid Audit scorecard gains the same dimension, so free and paid stay parallel.
 * What changed in v0.3 (post-audit fixes — see
 * `Consultancy/docs/2026-07-02-snapshot-as-built-spec.md`):
 *   - df1's scored middle rescored 2 → 2.5 (the v0.2 rescale convention: a
 *     middle answer normalises to 50, not 33).
 *   - Bands gained an optional `href` so the result CTA routes where its label
 *     says (audit anchor, workshops anchor), falling back to the fit call.
 *   - Em-dash sweep of all user-facing strings (voice rule applies to every
 *     public-facing surface, not just posts — see 03-voice.md).
 * What changed in v0.2 (from the STORM validation pass — see
 * `Consultancy/brainstorms/ai-readiness-rubric-validation-STORM.md`):
 *   - Scaling fix: 3-option {1,2,4} items rescored to {1,2.5,4} so a "middle"
 *     answer normalises to 50, not 33.
 *   - Gate split: the LLM-deterministic gate now distinguishes "the AI must WRITE
 *     the exact answer" (hard gate) from "a computer could look it up" (a fit —
 *     LLM as the front door to a deterministic tool; teaching moment).
 *   - Targeted non-compensatory floor (in scoring.ts): a critically-low use-case
 *     fit, or a "real damage" risk answer, caps the band regardless of the average.
 *   - New items: business-outcome/owner (uc4), data-privacy (gr2), RAG-vs-general
 *     intent (rag1, which makes data-foundation weight intent-sensitive on LLM).
 *   - tc2 de-double-barrelled (verification half only); uc3 → artifact form;
 *     df2/ti1 de-collinearised and de-jargoned; df1 gains an example parenthetical.
 * The scoring engine reads everything from here, so refining this file finalises
 * the tool.
 */

export type Branch = 'llm' | 'ml' | 'both';

/**
 * Rubric version stamped on every logged snapshot response, so calibration can
 * segment answer distributions by rubric. Bump this whenever QUESTIONS,
 * DIMENSIONS, BANDS, or the scoring rules change in a way that affects results.
 */
export const RUBRIC_VERSION = 'v0.4';

export interface Option {
	label: string;
	/** 1–4 readiness score (halves allowed), or omitted for a gate / pure-router option. */
	score?: number;
	/** If set, choosing this option hard-fails the snapshot on the given path. */
	gate?: 'llm-deterministic' | 'ml-no-data';
	/** A SNIPPETS key surfaced as an observation whenever this option is chosen,
	 *  regardless of score (teaching moments, risk flags). */
	insight?: string;
	/** Override a dimension's branch weight for this run (intent-sensitive weighting). */
	weightMod?: Partial<Record<DimensionId, number>>;
	/** Triggers the targeted non-compensatory floor (see scoring.ts). */
	cap?: 'real-damage' | 'cannot-verify';
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
	| 'governance-risk'
	| 'process-clarity';

export interface Dimension {
	id: DimensionId;
	label: string;
	/** Relative weight by branch (0 = not counted on that branch). May be overridden
	 *  at runtime by an Option.weightMod. */
	weight: Record<Branch, number>;
}

/** Q0 — sets the branch and the dimension weighting. */
export const INTENT_QUESTION = {
	id: 'intent',
	prompt: 'What are you mainly hoping AI will do for you?',
	options: [
		{
			label: 'Help my people work faster: drafting, summarising, answering questions, research',
			branch: 'llm' as Branch
		},
		{
			label:
				'Predict, score, or flag things from our own data: forecasting, risk-scoring, spotting problems',
			branch: 'ml' as Branch
		},
		{ label: "Both, or I'm not sure yet", branch: 'both' as Branch }
	]
};

// PLACEHOLDER weights — Evan to calibrate. LLM leans on use-case + team;
// ML leans on data foundation; "both" is a blend. Data-foundation weight on the
// LLM branch is the DEFAULT (general-knowledge use); rag1 raises it for RAG.
export const DIMENSIONS: Dimension[] = [
	{ id: 'use-case-fit', label: 'Use-case fit', weight: { llm: 3, ml: 2, both: 3 } },
	{ id: 'team-capability', label: 'Team capability', weight: { llm: 3, ml: 1, both: 2 } },
	{ id: 'data-foundation', label: 'Data foundation', weight: { llm: 1, ml: 3, both: 2 } },
	{ id: 'tooling-infra', label: 'Tooling & infra', weight: { llm: 1, ml: 2, both: 1 } },
	{ id: 'governance-risk', label: 'Governance & risk', weight: { llm: 1, ml: 1, both: 1 } },
	{ id: 'process-clarity', label: 'Process clarity', weight: { llm: 2, ml: 1, both: 2 } }
];

// PLACEHOLDER questions — Evan to refine wording/options/scores.
export const QUESTIONS: Question[] = [
	{
		id: 'uc1',
		dimension: 'use-case-fit',
		prompt: 'For the task you have in mind, how exact does the answer have to be?',
		branches: ['llm', 'both'],
		options: [
			{
				// Hard gate: the model itself must author a verbatim-correct answer with no system behind it.
				label:
					"The AI's own written answer has to be exactly right every time, with no system behind it to look it up",
				gate: 'llm-deterministic'
			},
			{
				// The gate-split "fit" case: the exact answer is computed by a system; the LLM is the interface.
				label:
					'It needs an exact answer, but a computer system could look it up or calculate it (an order status, a price, a balance, a record)',
				score: 4,
				insight: 'insight:tool-front-door'
			},
			{ label: 'Mostly needs to be right, but a person reviews it', score: 2.5 },
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
		// Artifact form (was a self-appraisal): asks for an existing written definition,
		// which resists over-rating better than "could someone tell?".
		prompt:
			"Do you have a written, agreed definition of what a 'good' output looks like for this task?",
		options: [
			{ label: 'No', score: 1, cap: 'cannot-verify' },
			{ label: 'Roughly, but not written down', score: 2.5 },
			{ label: 'Yes, written down and agreed', score: 4 }
		]
	},
	{
		id: 'uc4',
		dimension: 'use-case-fit',
		// Business-outcome / ownership — closes the strategy/value gap (RAND #1 failure).
		prompt:
			'Is there a named person who owns getting this done, and a business number it would move?',
		options: [
			{ label: 'No / not really', score: 1 },
			{ label: 'One of those, not both', score: 2.5 },
			{ label: 'Yes, a named owner and a number it would move', score: 4 }
		]
	},
	{
		id: 'rag1',
		dimension: 'data-foundation',
		// Pure weight-router (no score): makes data-foundation weight intent-sensitive on LLM/both.
		// "Our own documents" = RAG, where corpus quality is load-bearing → raise the weight.
		prompt:
			'Does the AI need to work from your own documents and data to answer, or just general knowledge plus whatever someone pastes in each time?',
		branches: ['llm', 'both'],
		options: [
			{ label: 'Just general knowledge + what we paste in' },
			{
				label: 'It needs to use our own documents / data',
				weightMod: { 'data-foundation': 3 }
			}
		]
	},
	{
		id: 'tc1',
		dimension: 'team-capability',
		prompt: 'In the last week, how many people on your team used an AI tool for real work?',
		options: [
			{ label: 'None', score: 1 },
			{ label: '1–2', score: 2 },
			{ label: 'About 3–5 (or roughly half)', score: 3 },
			{ label: 'Most of them', score: 4 }
		]
	},
	{
		id: 'tc2',
		dimension: 'team-capability',
		// De-double-barrelled: verification literacy only (the safety-relevant half).
		prompt: 'When your team uses AI, can they reliably catch it when the output is wrong?',
		options: [
			{ label: 'Rarely', score: 1 },
			{ label: 'Sometimes', score: 2.5 },
			{ label: 'Usually', score: 4 }
		]
	},
	{
		id: 'tc3',
		dimension: 'team-capability',
		prompt: 'Could your leadership name a task AI should NOT be trusted with?',
		options: [
			{ label: 'No', score: 1 },
			{ label: 'Maybe, vaguely', score: 2.5 },
			{ label: 'Yes, clearly', score: 4 }
		]
	},
	{
		id: 'pc1',
		dimension: 'process-clarity',
		// Behavioural (the two-week absence test), not "are you documented?" — an artifact/
		// consequence question resists over-rating the way uc3 and tc1 do.
		prompt:
			'If the person who does your most repetitive job were out for two weeks, could someone else pick it up from something written down?',
		options: [
			{ label: 'No, they would have to ask someone', score: 1 },
			{ label: 'Partly, there are some notes', score: 2.5 },
			{ label: 'Yes, a current written process they could follow', score: 4 }
		]
	},
	{
		id: 'pc2',
		dimension: 'process-clarity',
		// Decision capture — the harder half, and the one agents actually need.
		prompt:
			'The rules behind your recurring decisions (how you price, who you turn down, when something gets escalated): are those written down anywhere?',
		options: [
			{ label: 'No, that is my judgement', score: 1 },
			{ label: 'Written down, but stale or partial', score: 2.5 },
			{ label: 'Written down and current', score: 4 }
		]
	},
	{
		id: 'df1',
		dimension: 'data-foundation',
		prompt:
			'The thing you want AI to predict or flag: do you already have records of it actually happening (e.g. past sales, orders, tickets, claims), going back a while, that someone could export from a system?',
		branches: ['ml', 'both'],
		options: [
			{ label: 'No records of it / no real history', gate: 'ml-no-data' },
			{ label: 'Some, but patchy or short', score: 2.5 },
			{ label: 'Yes, consistent records going back a while', score: 4 }
		]
	},
	{
		id: 'df2',
		dimension: 'data-foundation',
		// Strictly WHERE data lives (storage state) — movability now lives only in ti1.
		prompt: 'Where does that data mostly live?',
		options: [
			{ label: "On paper / in people's heads", score: 1 },
			{ label: 'Scattered spreadsheets', score: 2 },
			{ label: 'A few different systems', score: 3 },
			{ label: 'One central system', score: 4 }
		]
	},
	{
		id: 'ti1',
		dimension: 'tooling-infra',
		// Strictly MOVABILITY (system-to-system), de-jargoned. No longer overlaps df2.
		prompt:
			'When you need to move data between your systems, does it happen automatically, or does someone export and copy-paste it by hand?',
		options: [
			{ label: 'All by hand / copy-paste', score: 1 },
			{ label: 'Some manual exports', score: 2 },
			{ label: 'Mostly automatic', score: 3 },
			{ label: 'Our systems already pass data to each other automatically', score: 4 }
		]
	},
	{
		id: 'gr1',
		dimension: 'governance-risk',
		prompt: 'If the AI gets one wrong and nobody catches it, what happens?',
		options: [
			{ label: 'Real damage: money, legal, safety, reputation', score: 1, cap: 'real-damage' },
			{ label: 'Some rework', score: 2.5 },
			{ label: 'Minor annoyance', score: 4 }
		]
	},
	{
		id: 'gr2',
		dimension: 'governance-risk',
		// Data-privacy / confidential-data — the most common real-world SMB governance failure.
		prompt:
			'Does this involve customer personal info, regulated, or confidential data, and is any of it going into public AI tools?',
		options: [
			{
				label: 'Yes, and people are pasting it into public AI tools',
				score: 1,
				insight: 'flag:privacy'
			},
			{ label: 'Yes, but we keep it inside controlled tools', score: 2.5 },
			{ label: 'No sensitive or confidential data involved', score: 4 }
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
	/** Where the result CTA points. Same-page anchors close the dialog and scroll;
	 *  omitted = fall back to the fit-call link. */
	href?: string;
}

// PLACEHOLDER bands & thresholds — Evan to calibrate. 75/50 held pending live
// calibration against ~20 known businesses (validation report §4). 'not-a-fit'
// is gate-only (not score-based).
export const BANDS: Band[] = [
	{
		id: 'not-a-fit',
		label: 'Not a fit (yet)',
		min: 0,
		blurb:
			'Based on what you described, AI isn’t the right next step here, at least not yet. That’s a useful answer: it saves you from spending on the wrong thing. Here’s what would change that.',
		cta: 'Ask me about it directly'
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
			'The pieces are mostly here, but they need sequencing: which bet first, what to skip, and a plan you can hand your team. That is exactly what the AI Readiness Audit produces.',
		cta: 'See the AI Readiness Audit',
		href: '#audit'
	},
	{
		id: 'foundations-first',
		label: 'Foundations first',
		min: 0,
		blurb:
			'There is a real opportunity here, but a foundation needs to come first before an Audit would pay off. The most useful next step is closing that gap, often with a short, practical session.',
		cta: 'See how a workshop could help',
		href: '#workshops'
	}
];

/**
 * Observation snippet bank — PLACEHOLDER copy, in Evan's draft voice.
 * The engine assembles: cap reason (if floored) → gate / chosen-option insights →
 * the lowest-scoring dimensions, capped at 3. Evan to finalise wording.
 */
export const SNIPPETS: Record<string, string> = {
	'gate:llm-deterministic':
		'You said the AI’s own written answer has to be exactly right every time, with no system behind it to look it up. Today’s LLMs are probabilistic: they’re strong when “good enough, a human checks it” is acceptable, and the wrong tool when a written answer must be verbatim-correct on its own. A rules-based automation will serve you better here. (Note the distinction: an LLM can guarantee an exact *format*, but not an exact *fact* on its own. That’s what makes this case a poor fit.)',
	'gate:ml-no-data':
		'To predict or flag something, a model has to learn from past examples of it happening, and you don’t yet have those records with enough history. The highest-value first step isn’t AI; it’s starting to capture that data cleanly. Do that for a few months and this becomes possible.',
	// Gate-split teaching moment — surfaced when the "a computer could look it up" option is chosen.
	'insight:tool-front-door':
		'Good news: your “exact answer” is something a computer can look up or calculate, so this *is* a fit, just not the way most people picture it. The pattern is the LLM as a friendly front door (you ask in plain language; it calls the system that holds the real answer), not the LLM as the source of truth. You get exactness from the system and ease-of-use from the AI.',
	// Privacy flag — surfaced when sensitive data is going into public tools.
	'flag:privacy':
		'One thing to handle first: sensitive or confidential data is going into public AI tools. That’s the most common avoidable AI risk for a business your size (and a PIPEDA exposure). The fix is cheap (a clear rule on what may be pasted where, plus tools that keep that data inside your walls) and it should come before you automate anything on top.',
	// Targeted-floor cap explanations.
	'cap:use-case':
		'Before readiness, the use case itself needs sharpening. Right now it reads more like a direction than a specific, ownable job. That’s the single biggest predictor of whether AI pays off, so it’s worth nailing down first, no matter how strong everything else is.',
	'cap:real-damage':
		'You flagged that a wrong answer here causes real damage: money, legal, safety, or reputation. That doesn’t rule AI out, but it does mean you don’t get a green light on the strength of the rest: this needs a human firmly in the loop and clear guardrails *before* anything ships, not after.',
	'cap:risk-blind':
		'This is the combination to be most careful with: a wrong answer causes real damage, *and* there’s no agreed way yet to tell a good answer from a bad one. Until you can reliably catch the bad ones, there’s no safe way to let AI run here. Defining and verifying “good” is the first piece of work, before anything else.',
	'low:use-case-fit':
		'Right now this reads more like “use AI more” than a specific job. The teams that get value name one task (done often, costing real hours) and point AI at exactly that. Pick the single most repetitive time-sink and start there.',
	'low:team-capability':
		'The biggest predictor isn’t the tech. It’s whether your people (and leadership) are actually working with these tools and know their limits. A short, practical session to get a few people productive will move you further than any strategy doc.',
	'low:data-foundation':
		'Your data is spread across spreadsheets and manual steps. Models need it accessible and consistent, so the highest-leverage move is tidying how it’s captured before building anything on top.',
	'low:tooling-infra':
		'Moving data between your systems is still mostly manual. That’s a solvable plumbing problem, and worth solving before you automate on top of it.',
	'low:process-clarity':
		'Most of how your business runs lives in people’s heads. That matters more than which tool you pick, because an AI can only act on what is written down: an undocumented process isn’t an automation candidate yet, it’s a discovery project. The useful part is that writing it down is cheap, and it’s work you’d want done anyway, whether or not you ever automate it.',
	'low:governance-risk':
		'A wrong answer here causes real damage, so this needs a human firmly in the loop and clear guardrails before any automation. Worth doing: carefully, not quickly.',
	strong:
		'You’ve got a specific, well-understood use case, a team that’s already working with these tools, and a sensible read on the risks. The question now is sequencing: which one first, and how.'
};
