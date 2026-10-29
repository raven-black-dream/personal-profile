import { describe, it, expect } from 'vitest';
import { RUBRIC_VERSION, QUESTIONS } from './snapshot-content';
import { questionsForBranch } from './scoring';

describe('RUBRIC_VERSION', () => {
	it('is the current rubric version string', () => {
		expect(RUBRIC_VERSION).toBe('v0.5');
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
