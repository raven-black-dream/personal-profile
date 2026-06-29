import { questionsForBranch, isComplete, type Answers } from '../consulting/scoring';
import type { Branch } from '../consulting/snapshot-content';

const BRANCHES: readonly Branch[] = ['llm', 'ml', 'both'];

export type ValidationResult =
	| { ok: true; branch: Branch; answers: Answers }
	| { ok: false; message: string };

/**
 * Validate the client payload against the CURRENT rubric. Rejects unknown
 * branches/questions, out-of-range indices, and incomplete answer sets so that
 * only clean, fully-answered submissions are logged.
 */
export function validateSnapshotPayload(body: unknown): ValidationResult {
	if (typeof body !== 'object' || body === null) {
		return { ok: false, message: 'body must be an object' };
	}
	const { branch, answers } = body as Record<string, unknown>;

	if (typeof branch !== 'string' || !BRANCHES.includes(branch as Branch)) {
		return { ok: false, message: 'invalid branch' };
	}
	if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
		return { ok: false, message: 'answers must be an object' };
	}

	const applicable = questionsForBranch(branch as Branch);
	const byId = new Map(applicable.map((q) => [q.id, q]));

	for (const [qid, idx] of Object.entries(answers as Record<string, unknown>)) {
		const q = byId.get(qid);
		if (!q) return { ok: false, message: `unknown question: ${qid}` };
		if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
			return { ok: false, message: `invalid option index for ${qid}` };
		}
	}

	if (!isComplete(branch as Branch, answers as Answers)) {
		return { ok: false, message: 'incomplete answers' };
	}
	return { ok: true, branch: branch as Branch, answers: answers as Answers };
}

/** Coarse device bucket from the User-Agent. The UA itself is never stored. */
export function deriveDeviceClass(userAgent: string | null): 'mobile' | 'desktop' {
	if (!userAgent) return 'desktop';
	return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? 'mobile' : 'desktop';
}

/**
 * Coarse traffic source from the Referer. A referer carrying a campaign marker
 * (utm_source / utm_campaign / ref) counts as a deeplink; anything else is
 * organic. Placeholder heuristic — Evan can refine the markers later.
 */
export function deriveSource(referer: string | null): 'deeplink' | 'organic' {
	if (!referer) return 'organic';
	try {
		const u = new URL(referer);
		const deeplink =
			u.searchParams.has('utm_source') ||
			u.searchParams.has('utm_campaign') ||
			u.searchParams.has('ref');
		return deeplink ? 'deeplink' : 'organic';
	} catch {
		return 'organic';
	}
}

/** Epoch ms boundary: rows with created_at strictly below this are prunable. */
export function snapshotPruneCutoff(nowMs: number, months = 24): number {
	const d = new Date(nowMs);
	d.setUTCMonth(d.getUTCMonth() - months);
	return d.getTime();
}
