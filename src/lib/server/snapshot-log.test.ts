import { describe, it, expect } from 'vitest';
import {
	validateSnapshotPayload,
	deriveDeviceClass,
	deriveSource,
	snapshotPruneCutoff
} from './snapshot-log';
import { questionsForBranch } from '../consulting/scoring';
import type { Branch } from '../consulting/snapshot-content';

/** Build a fully-answered answer map for a branch (option index 0 for every question). */
function completeAnswers(branch: Branch): Record<string, number> {
	return Object.fromEntries(questionsForBranch(branch).map((q) => [q.id, 0]));
}

describe('validateSnapshotPayload', () => {
	it('accepts a complete, in-range payload', () => {
		const r = validateSnapshotPayload({ branch: 'llm', answers: completeAnswers('llm') });
		expect(r.ok).toBe(true);
	});

	it('rejects a non-object body', () => {
		expect(validateSnapshotPayload(null).ok).toBe(false);
		expect(validateSnapshotPayload('nope').ok).toBe(false);
	});

	it('rejects an unknown branch', () => {
		const r = validateSnapshotPayload({ branch: 'wat', answers: {} });
		expect(r.ok).toBe(false);
	});

	it('rejects an unknown question id', () => {
		const answers = { ...completeAnswers('llm'), bogus: 0 };
		expect(validateSnapshotPayload({ branch: 'llm', answers }).ok).toBe(false);
	});

	it('rejects an out-of-range option index', () => {
		const answers = completeAnswers('llm');
		const firstId = questionsForBranch('llm')[0].id;
		answers[firstId] = 999;
		expect(validateSnapshotPayload({ branch: 'llm', answers }).ok).toBe(false);
	});

	it('rejects a non-integer / negative option index', () => {
		const answers = completeAnswers('llm');
		const firstId = questionsForBranch('llm')[0].id;
		answers[firstId] = -1;
		expect(validateSnapshotPayload({ branch: 'llm', answers }).ok).toBe(false);
	});

	it('rejects an incomplete answer set', () => {
		const answers = completeAnswers('llm');
		delete answers[questionsForBranch('llm')[0].id];
		expect(validateSnapshotPayload({ branch: 'llm', answers }).ok).toBe(false);
	});
});

describe('deriveDeviceClass', () => {
	it('classifies mobile user-agents', () => {
		expect(deriveDeviceClass('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)')).toBe('mobile');
		expect(deriveDeviceClass('Mozilla/5.0 (Linux; Android 14)')).toBe('mobile');
	});
	it('classifies desktop and null as desktop', () => {
		expect(deriveDeviceClass('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('desktop');
		expect(deriveDeviceClass(null)).toBe('desktop');
	});
});

describe('deriveSource', () => {
	it('treats a campaign/utm/ref referer as a deeplink', () => {
		expect(deriveSource('https://evanharley.ca/consulting?utm_source=li')).toBe('deeplink');
		expect(deriveSource('https://evanharley.ca/consulting?ref=newsletter')).toBe('deeplink');
	});
	it('treats a plain or missing referer as organic', () => {
		expect(deriveSource('https://evanharley.ca/consulting')).toBe('organic');
		expect(deriveSource(null)).toBe('organic');
		expect(deriveSource('not a url')).toBe('organic');
	});
});

describe('snapshotPruneCutoff', () => {
	it('returns the epoch ms 24 calendar months before now', () => {
		const now = Date.UTC(2026, 5, 29); // 2026-06-29
		const cutoff = snapshotPruneCutoff(now);
		expect(cutoff).toBe(Date.UTC(2024, 5, 29)); // 2024-06-29
	});
	it('a row one ms older than the cutoff is prunable; one ms newer is kept', () => {
		const now = Date.UTC(2026, 5, 29);
		const cutoff = snapshotPruneCutoff(now);
		expect(cutoff - 1 < cutoff).toBe(true);
		expect(cutoff + 1 < cutoff).toBe(false);
	});
});
