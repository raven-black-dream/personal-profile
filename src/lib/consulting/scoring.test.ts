import { describe, it, expect } from 'vitest';
import { questionsForBranch, scoreSnapshot, type Answers } from './scoring';
import { BANDS, SNIPPETS, type Branch } from './snapshot-content';

function answerSet(branch: Branch, pick: 'first' | 'mid' | 'last'): Answers {
	const a: Answers = {};
	for (const q of questionsForBranch(branch))
		a[q.id] =
			pick === 'first' ? 0 : pick === 'mid' ? Math.floor(q.options.length / 2) : q.options.length - 1;
	return a;
}

// Case A from the spec (llm). Cases below are written as spreads of A.
const A: Answers = { uc1: 3, uc2: 3, uc3: 2, uc4: 2, rag1: 0, tc1: 3, ag1: 0, tc2: 2, tc3: 2,
	pc1: 2, pc2: 2, df2: 2, ti1: 2, gr1: 2, gr2: 2 };
const B: Answers = { ...A, df2: 3, ti1: 3, gr1: 2, gr2: 0 };
const C2: Answers = { ...A, uc2: 0, uc3: 0, uc4: 0 };
const S = (k: string) => SNIPPETS[k];

function withoutAg1(a: Answers): Answers {
	const copy = { ...a };
	delete copy.ag1;
	return copy;
}

describe.each(['llm', 'ml', 'both'] as const)('ag1 has no effect on scoring (%s)', (branch) => {
	it.each(['first', 'mid', 'last'] as const)('%s-option base set', (pick) => {
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

describe('ag1 has no effect on a mixed answer set (Case A)', () => {
	it('deep-equals with and without ag1', () => {
		const expected = scoreSnapshot('llm', withoutAg1(A));
		for (const idx of [0, 1, 2]) expect(scoreSnapshot('llm', { ...A, ag1: idx })).toEqual(expected);
	});
});

describe('per-question weakness messages (v0.6)', () => {
	const obs = (a: Answers) => scoreSnapshot('llm', a).observations;

	it('Case A: messages match the answers (AC1)', () => {
		const o = obs(A);
		expect(o).toEqual([S('strong'), S('low:df2'), S('low:ti1')]);
		const text = o.join(' ');
		expect(text).not.toContain('spread across spreadsheets');
		expect(text).not.toContain('mostly manual');
	});
	it('lowest-scoring question wins', () => {
		expect(obs({ ...A, tc1: 1, tc2: 0 })).toEqual([S('strong'), S('low:tc2'), S('low:df2')]);
	});
	it('uc3 "No" is eligible when no cap applied', () => {
		expect(obs({ ...A, uc3: 0, uc4: 0 })).toEqual([S('strong'), S('low:uc3'), S('low:df2')]);
	});
	it('question that produced the cap is skipped; top answer never chosen (E1)', () => {
		const r = scoreSnapshot('llm', { ...A, uc3: 0, uc4: 0, gr1: 0 });
		expect(r.capReason).toBe('cap:risk-blind');
		expect(r.observations).toEqual([S('cap:risk-blind'), S('low:uc4'), S('low:df2')]);
	});
	it.each([
		['llm', ['low:gr1', 'low:pc1', 'low:uc1']],
		['ml', ['low:gr1', 'low:pc1', 'low:uc3']],
		['both', ['low:gr1', 'low:pc1', 'low:uc1']]
	] as const)('mid sets: ties go to QUESTIONS order (E3) (%s)', (branch, keys) => {
		expect(scoreSnapshot(branch, answerSet(branch, 'mid')).observations).toEqual(keys.map(S));
	});

	it('D1: under cap:use-case, uc2 adds no message but uc3 stays eligible', () => {
		const r = scoreSnapshot('llm', { ...A, uc1: 2, uc2: 0, uc3: 0, uc4: 0 });
		expect(r.band.id).toBe('foundations-first');
		expect(r.overall).toBe(70);
		expect(r.capReason).toBe('cap:use-case');
		expect(r.observations).toEqual([S('cap:use-case'), S('low:uc3'), S('low:df2')]);
		expect(r.observations).not.toContain(S('low:uc2'));
	});
	it('D1: under cap:use-case, uc4 is chosen when it is the lowest eligible answer', () => {
		const r = scoreSnapshot('llm', { ...A, uc1: 2, uc2: 0, uc3: 1, uc4: 0 });
		expect(r.band.id).toBe('foundations-first');
		expect(r.overall).toBe(74);
		expect(r.capReason).toBe('cap:use-case');
		expect(r.observations).toEqual([S('cap:use-case'), S('low:uc4'), S('low:df2')]);
	});
	it('R1: cap:use-case with a risk cap option does not crash and tells gr1 normally', () => {
		const r = scoreSnapshot('llm', { ...A, uc1: 2, uc2: 0, uc3: 0, uc4: 0, gr1: 0 });
		expect(r.band.id).toBe('foundations-first');
		expect(r.overall).toBe(66);
		expect(r.capReason).toBe('cap:use-case');
		expect(r.observations).toEqual([S('cap:use-case'), S('low:uc3'), S('low:gr1')]);
	});
	it('R2: unanswered questions are skipped, not thrown on', () => {
		const partial = { ...A };
		delete partial.tc2;
		delete partial.df2;
		expect(() => scoreSnapshot('llm', partial)).not.toThrow();
	});
	it('R6: gated all-first sets show exactly the gate message', () => {
		const gates = { llm: 'gate:llm-deterministic', ml: 'gate:ml-no-data', both: 'gate:llm-deterministic' } as const;
		for (const b of ['llm', 'ml', 'both'] as const) {
			const r = scoreSnapshot(b, answerSet(b, 'first'));
			expect(r.observations).toEqual([S(r.gate ? `gate:${r.gate}` : gates[b])]);
			expect(r.observations).toHaveLength(1);
		}
	});
	it.each(['llm', 'ml', 'both'] as const)(
		'unaffected answer sets keep band, overall, capReason (AC6) (%s)',
		(b) => {
			const pin = (p: 'first' | 'mid' | 'last') => {
				const r = scoreSnapshot(b, answerSet(b, p));
				return { band: r.band.id, overall: r.overall, capReason: r.capReason };
			};
			expect(pin('first')).toEqual({ band: 'not-a-fit', overall: 0, capReason: null });
			expect(pin('mid')).toEqual({
				band: 'ready-to-prioritise',
				overall: b === 'both' ? 55 : 58,
				capReason: null
			});
			expect(pin('last')).toEqual({ band: 'ready-to-build', overall: 100, capReason: null });
		}
	);
});

describe('privacy cap, floor at 25, strong copy (v0.6)', () => {
	const run = (a: Answers) => scoreSnapshot('llm', a);
	const shape = (a: Answers) => {
		const r = run(a);
		return { band: r.band.id, overall: r.overall, capReason: r.capReason };
	};

	it('Case B: privacy caps Ready to build (AC2)', () => {
		const r = run(B);
		expect(shape(B)).toEqual({ band: 'ready-to-prioritise', overall: 95, capReason: 'cap:privacy' });
		expect(r.observations).toEqual([S('flag:privacy')]);
		expect(r.observations.filter((o) => o === S('flag:privacy'))).toHaveLength(1);
		expect(r.observations.join(' ')).not.toContain('real damage');
	});
	it('Case C: floor triggers at 25 (AC4)', () => {
		const a = { ...C2, tc1: 0, tc2: 0, tc3: 0 };
		expect(shape(a)).toEqual({ band: 'foundations-first', overall: 46, capReason: 'cap:use-case' });
		expect(run(a).observations).toEqual([S('cap:use-case'), S('low:tc1'), S('low:uc3')]);
	});
	it('Case C2: strong team no longer escapes the floor', () => {
		expect(shape(C2)).toEqual({ band: 'foundations-first', overall: 74, capReason: 'cap:use-case' });
		expect(run(C2).observations).toEqual([S('cap:use-case'), S('low:uc3'), S('low:df2')]);
	});
	it('R1 at 25: cap:use-case with a risk cap option does not crash', () => {
		const a = { ...C2, gr1: 0 };
		expect(shape(a)).toEqual({ band: 'foundations-first', overall: 69, capReason: 'cap:use-case' });
		expect(run(a).observations).toEqual([S('cap:use-case'), S('low:uc3'), S('low:gr1')]);
	});
	it('R6: privacy under the use-case floor still shows flag:privacy', () => {
		const a = { ...C2, gr2: 0 };
		expect(shape(a)).toEqual({ band: 'foundations-first', overall: 69, capReason: 'cap:use-case' });
		expect(run(a).observations).toEqual([S('cap:use-case'), S('flag:privacy'), S('low:uc3')]);
	});
	it('tool-front-door insight is not shown under cap:use-case', () => {
		const a = { ...C2, uc1: 1 };
		const r = run(a);
		expect(r.capReason).toBe('cap:use-case');
		expect(r.observations).not.toContain(S('insight:tool-front-door'));
		expect(r.observations).toEqual([S('cap:use-case'), S('low:uc3'), S('low:df2')]);
	});
	it('E4: real-damage outranks privacy', () => {
		const a = { ...B, gr1: 0 };
		expect(shape(a)).toEqual({ band: 'ready-to-prioritise', overall: 91, capReason: 'cap:real-damage' });
		expect(run(a).observations).toEqual([S('cap:real-damage'), S('flag:privacy')]);
	});
	it('E5: privacy below Ready to build is a no-op on band', () => {
		const a = { ...B, tc1: 0, tc2: 0, tc3: 0 };
		expect(shape(a)).toEqual({ band: 'ready-to-prioritise', overall: 68, capReason: null });
		expect(run(a).observations).toEqual([S('flag:privacy'), S('low:tc1')]);
	});
	it.each([
		['llm', A],
		['llm', answerSet('llm', 'last')],
		['ml', answerSet('ml', 'last')],
		['both', answerSet('both', 'last')]
	] as const)('AC3: Ready to build never repeats the blurb (%s)', (branch, a) => {
		const r = scoreSnapshot(branch, a);
		expect(r.band.id).toBe('ready-to-build');
		const blurb = BANDS.find((b) => b.id === 'ready-to-build')!.blurb;
		for (const o of r.observations) {
			expect(o).not.toBe(blurb);
			expect(o).not.toContain('sensible read on the risks');
		}
	});
});
