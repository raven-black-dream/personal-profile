import { describe, it, expect } from 'vitest';
import { questionsForBranch, scoreSnapshot, type Answers } from './scoring';
import type { Branch } from './snapshot-content';

function answerSet(branch: Branch, pick: 'first' | 'last'): Answers {
	const a: Answers = {};
	for (const q of questionsForBranch(branch)) a[q.id] = pick === 'first' ? 0 : q.options.length - 1;
	return a;
}

function withoutAg1(a: Answers): Answers {
	const copy = { ...a };
	delete copy.ag1;
	return copy;
}

describe.each(['llm', 'ml', 'both'] as const)('ag1 has no effect on scoring (%s)', (branch) => {
	it.each(['first', 'last'] as const)('%s-option base set', (pick) => {
		const base = answerSet(branch, pick);
		expect(base).toHaveProperty('ag1'); // fixture includes ag1, so Task 1 content must exist
		const expected = scoreSnapshot(branch, withoutAg1(base));
		for (const idx of [0, 1, 2]) {
			expect(scoreSnapshot(branch, { ...base, ag1: idx })).toEqual(expected);
		}
	});
});

describe('fixture sanity: all-first sets are gated', () => {
	it.each(['llm', 'ml', 'both'] as const)('%s scores not-a-fit', (branch) => {
		const r = scoreSnapshot(branch, { ...answerSet(branch, 'first'), ag1: 2 });
		expect(r.gate).not.toBeNull();
		expect(r.band.id).toBe('not-a-fit');
		expect(r.overall).toBe(0);
	});
});
