import { describe, it, expect } from 'vitest';
import { buildSnapshotRow, insertSnapshot, pruneOldSnapshots } from './snapshot-log';
import { scoreSnapshot } from '../consulting/scoring';
import { questionsForBranch, type Answers } from '../consulting/scoring';
import { RUBRIC_VERSION, type Branch } from '../consulting/snapshot-content';

function completeAnswers(branch: Branch): Answers {
	return Object.fromEntries(questionsForBranch(branch).map((q) => [q.id, 0]));
}

/** Minimal D1 mock: records every bound statement; run() returns configurable meta. */
function fakeD1(opts: { throwOnRun?: boolean; changes?: number } = {}) {
	const calls: { sql: string; args: unknown[] }[] = [];
	const db = {
		prepare(sql: string) {
			return {
				bind(...args: unknown[]) {
					return {
						async run() {
							if (opts.throwOnRun) throw new Error('D1 down');
							calls.push({ sql, args });
							return { success: true, meta: { changes: opts.changes ?? 0 } };
						}
					};
				}
			};
		}
	};
	return { db, calls };
}

const ctx = { deviceClass: 'desktop' as const, source: 'organic' as const, now: 1_700_000_000_000 };

describe('buildSnapshotRow', () => {
	it('stamps server-recomputed score, rubric version, and uuid', () => {
		const branch: Branch = 'llm';
		const answers = completeAnswers(branch);
		const row = buildSnapshotRow(branch, answers, ctx);
		const expected = scoreSnapshot(branch, answers);

		expect(row.overall).toBe(expected.overall);
		expect(row.band_id).toBe(expected.band.id);
		expect(row.gate).toBe(expected.gate);
		expect(row.cap_reason).toBe(expected.capReason);
		expect(JSON.parse(row.dimensions_json)).toEqual(expected.dimensions);
		expect(JSON.parse(row.answers_json)).toEqual(answers);
		expect(row.rubric_version).toBe(RUBRIC_VERSION);
		expect(row.created_at).toBe(ctx.now);
		expect(row.device_class).toBe('desktop');
		expect(row.source).toBe('organic');
		expect(row.id).toMatch(/^[0-9a-f-]{36}$/i);
	});
});

describe('insertSnapshot', () => {
	it('inserts exactly one bound-parameter row with all 12 columns', async () => {
		const { db, calls } = fakeD1();
		const row = buildSnapshotRow('llm', completeAnswers('llm'), ctx);
		await insertSnapshot(db as never, row);

		expect(calls).toHaveLength(1);
		expect(calls[0].sql).toMatch(/^INSERT INTO snapshot_responses/);
		expect(calls[0].sql).not.toContain(String(row.overall)); // value is bound, not interpolated
		expect(calls[0].args).toHaveLength(12);
		expect(calls[0].args[0]).toBe(row.id);
	});
});

describe('pruneOldSnapshots', () => {
	it('issues one bound DELETE at the 24-month cutoff and returns rows removed', async () => {
		const { db, calls } = fakeD1({ changes: 7 });
		const now = Date.UTC(2026, 5, 29);
		const removed = await pruneOldSnapshots(db as never, now);

		expect(removed).toBe(7);
		expect(calls).toHaveLength(1);
		expect(calls[0].sql).toMatch(/DELETE FROM snapshot_responses WHERE created_at < \?/);
		expect(calls[0].args).toEqual([Date.UTC(2024, 5, 29)]);
	});
});
