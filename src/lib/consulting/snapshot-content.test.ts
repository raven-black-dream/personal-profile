import { describe, it, expect } from 'vitest';
import { RUBRIC_VERSION, QUESTIONS, SNIPPETS } from './snapshot-content';
import { questionsForBranch } from './scoring';

describe('RUBRIC_VERSION', () => {
	it('is the current rubric version string', () => {
		expect(RUBRIC_VERSION).toBe('v0.6');
	});
});

describe('ag1 (agentic adoption, unscored)', () => {
	const PROMPT =
		'Does any AI tool act on your behalf today: sending, booking or updating something without someone doing each step?';
	it.each(['llm', 'ml', 'both'] as const)('appears once, directly after tc1, on %s', (branch) => {
		const ids = questionsForBranch(branch).map((q) => q.id);
		expect(ids.filter((id) => id === 'ag1')).toHaveLength(1);
		expect(ids.indexOf('ag1')).toBe(ids.indexOf('tc1') + 1);
	});
	it('has the exact prompt, three plain options, no branches field', () => {
		const q = QUESTIONS.find((q) => q.id === 'ag1')!;
		expect(q.prompt).toBe(PROMPT);
		expect(q.dimension).toBe('tooling-infra');
		expect(q.branches).toBeUndefined();
		expect(q.options.map((o) => o.label)).toEqual(['No', 'Not sure', 'Yes']);
		for (const o of q.options) expect(Object.keys(o)).toEqual(['label']);
	});
});

const LOW_COPY: Record<string, string> = {
	'low:uc1':
		'A person checking every answer is a sound setup, but the check is where the time goes. Before automating, time how long a review takes: if checking is nearly as slow as doing the work, the gain is small.',
	'low:uc2':
		'This isn’t yet one specific task that comes up often. The teams that get value name a single job that costs real hours every week and point AI at exactly that. Pick your most repetitive time-sink and start there.',
	'low:uc3':
		'There’s no written, agreed description yet of what a good result looks like. Without one, nobody can tell whether the AI got it right. Writing it down is usually an hour’s work, and it comes before building anything.',
	'low:uc4':
		'This task is missing a named owner, a business number it would move, or both. Without them a pilot drifts: nobody is accountable for it and nobody can show it paid off. Settle both before you start.',
	'low:tc1':
		'AI use on your team is still limited to a few people, or none yet. A short, practical session to get more of them productive will move you further than any strategy document.',
	'low:tc2':
		'Your team doesn’t always catch it when AI gets something wrong. That’s the skill that makes everything else safe, and it can be taught: practice at checking AI output pays off before any automation does.',
	'low:tc3':
		'Leadership doesn’t yet have a clear line on what AI shouldn’t be trusted with. Drawing that line is quick, and it’s what lets people use AI with confidence everywhere else.',
	'low:pc1':
		'If the person doing your most repetitive job were away, the work would depend on asking around rather than on a written process. An AI can only follow what’s written down, so documenting that job comes first, and it’s worth doing whether or not you automate it.',
	'low:pc2':
		'The rules behind your recurring decisions aren’t fully written down and current. Those rules are what an AI needs to act on your behalf. Capturing them is cheap, and it protects the business whether or not you automate.',
	'low:df1':
		'Your records of this happening are patchy or short. A model learns from past examples, so a few months of clean, consistent records will do more for you right now than any model.',
	'low:df2':
		'Your data isn’t in one central place yet. Models need it accessible and consistent, so pulling the data this task depends on into one place is the step to take before building on top of it.',
	'low:ti1':
		'Moving data between your systems still involves some manual steps. That’s a solvable plumbing problem, and worth solving before you automate on top of it.',
	'low:gr1':
		'Mistakes here cost you something: rework at least, and possibly more. Keep a person checking every output until you’ve seen how often the AI gets your own work wrong, and put guardrails in place before anything runs on its own.',
	'low:gr2':
		'Sensitive or confidential data is involved, and keeping it inside controlled tools is the right setup. The next step is a written rule on what may go where, so that stays true as more people start using AI.',
};

describe('per-question weakness messages (v0.6)', () => {
	it('has exactly the 14 low:<qid> keys with the approved copy', () => {
		const lowKeys = Object.keys(SNIPPETS).filter((k) => k.startsWith('low:')).sort();
		expect(lowKeys).toEqual(Object.keys(LOW_COPY).sort());
		for (const [k, v] of Object.entries(LOW_COPY)) expect(SNIPPETS[k]).toBe(v);
	});
	it('every question with a non-top scored option has its low:<qid> key (AC5)', () => {
		for (const q of QUESTIONS) {
			const scores = q.options.map((o) => o.score).filter((s): s is number => typeof s === 'number');
			if (scores.some((s) => s < Math.max(...scores))) expect(SNIPPETS[`low:${q.id}`]).toBeDefined();
		}
	});
	it('the six dimension-level keys are gone (FR3)', () => {
		for (const d of [
			'use-case-fit',
			'team-capability',
			'data-foundation',
			'tooling-infra',
			'process-clarity',
			'governance-risk'
		])
			expect(SNIPPETS[`low:${d}`]).toBeUndefined();
	});
	it('new copy uses the curly apostrophe and never an ASCII one (D2)', () => {
		const vals = Object.values(LOW_COPY);
		expect(vals.some((v) => v.includes('\u2019'))).toBe(true);
		for (const v of vals) expect(v).not.toContain("'");
	});
});

describe('privacy cap, strong copy (v0.6)', () => {
	it('strong is the new copy verbatim', () => {
		expect(SNIPPETS.strong).toBe(
			'Before anything gets built, agree the one number this should move and record where it stands today. Then the result is visible when it lands, not a matter of opinion.'
		);
	});
	it('gr2 option 0 carries cap privacy and keeps the flag:privacy insight', () => {
		const o = QUESTIONS.find((q) => q.id === 'gr2')!.options[0];
		expect(o.cap).toBe('privacy');
		expect(o.insight).toBe('flag:privacy');
	});
});
