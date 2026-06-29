import { describe, it, expect } from 'vitest';
import { POST } from './+server';
import { questionsForBranch, type Answers } from '$lib/consulting/scoring';
import type { Branch } from '$lib/consulting/snapshot-content';

function completeAnswers(branch: Branch): Answers {
	return Object.fromEntries(questionsForBranch(branch).map((q) => [q.id, 0]));
}

function fakeD1(opts: { throwOnRun?: boolean } = {}) {
	const calls: { sql: string; args: unknown[] }[] = [];
	const db = {
		prepare(sql: string) {
			return {
				bind(...args: unknown[]) {
					return {
						async run() {
							if (opts.throwOnRun) throw new Error('D1 down');
							calls.push({ sql, args });
							return { success: true, meta: { changes: 0 } };
						}
					};
				}
			};
		}
	};
	return { db, calls };
}

/** Build a RequestEvent-shaped object good enough for the handler. */
function event(body: string, platform: unknown, headers: Record<string, string> = {}) {
	const request = new Request('http://localhost/api/snapshot', {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body
	});
	return { request, platform, url: new URL(request.url) } as never;
}

describe('POST /api/snapshot', () => {
	it('inserts exactly one row for a valid payload (204)', async () => {
		const { db, calls } = fakeD1();
		const body = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm') });
		const res = await POST(event(body, { env: { DB: db } }));
		expect(res.status).toBe(204);
		expect(calls).toHaveLength(1);
	});

	it('rejects malformed JSON with 400 and writes nothing', async () => {
		const { db, calls } = fakeD1();
		const res = await POST(event('{not json', { env: { DB: db } }));
		expect(res.status).toBe(400);
		expect(calls).toHaveLength(0);
	});

	it('rejects an invalid payload with 400 and writes nothing', async () => {
		const { db, calls } = fakeD1();
		const body = JSON.stringify({ branch: 'nope', answers: {} });
		const res = await POST(event(body, { env: { DB: db } }));
		expect(res.status).toBe(400);
		expect(calls).toHaveLength(0);
	});

	it('rejects an oversized body with 413 and writes nothing', async () => {
		const { db, calls } = fakeD1();
		const big = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm'), pad: 'x'.repeat(5000) });
		const res = await POST(event(big, { env: { DB: db } }));
		expect(res.status).toBe(413);
		expect(calls).toHaveLength(0);
	});

	it('rejects via a declared Content-Length over the cap, before reading the body', async () => {
		const { db, calls } = fakeD1();
		const small = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm') });
		const res = await POST(event(small, { env: { DB: db } }, { 'content-length': '999999' }));
		expect(res.status).toBe(413);
		expect(calls).toHaveLength(0);
	});

	it('no-ops gracefully (204) when the DB binding is absent', async () => {
		const body = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm') });
		const res = await POST(event(body, { env: {} }));
		expect(res.status).toBe(204);
	});

	it('degrades gracefully (204, no throw) when D1 throws', async () => {
		const { db } = fakeD1({ throwOnRun: true });
		const body = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm') });
		const res = await POST(event(body, { env: { DB: db } }));
		expect(res.status).toBe(204);
	});

	it('derives device_class/source server-side from headers', async () => {
		const { db, calls } = fakeD1();
		const body = JSON.stringify({ branch: 'llm', answers: completeAnswers('llm') });
		await POST(
			event(body, { env: { DB: db } }, {
				'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
				referer: 'https://evanharley.ca/consulting?utm_source=li'
			})
		);
		// args order: ... source (idx 10), device_class (idx 11)
		expect(calls[0].args[11]).toBe('mobile');
		expect(calls[0].args[10]).toBe('deeplink');
	});
});
