import type { Branch } from './snapshot-content';
import type { Answers } from './scoring';

/**
 * Fire-and-forget POST of a completed snapshot. Never awaited by the caller and
 * never throws: a logging failure must never affect the result render.
 * `keepalive` lets the request survive a fast dialog close.
 */
export function postSnapshot(
	branch: Branch,
	answers: Answers,
	fetchImpl: typeof fetch = fetch
): void {
	try {
		void fetchImpl('/api/snapshot', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ branch, answers }),
			keepalive: true
		}).catch(() => {});
	} catch {
		// swallow — best-effort analytics only
	}
}
