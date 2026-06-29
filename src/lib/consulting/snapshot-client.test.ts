import { describe, it, expect, vi } from 'vitest';
import { postSnapshot } from './snapshot-client';

describe('postSnapshot', () => {
	it('POSTs branch + answers to /api/snapshot as JSON', () => {
		const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
		postSnapshot('llm', { uc1: 0 }, fetchImpl as unknown as typeof fetch);

		expect(fetchImpl).toHaveBeenCalledTimes(1);
		const [url, init] = fetchImpl.mock.calls[0];
		expect(url).toBe('/api/snapshot');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body)).toEqual({ branch: 'llm', answers: { uc1: 0 } });
	});

	it('does not throw when fetch rejects (swallowed)', async () => {
		const fetchImpl = vi.fn().mockRejectedValue(new Error('network'));
		expect(() => postSnapshot('llm', { uc1: 0 }, fetchImpl as unknown as typeof fetch)).not.toThrow();
		// allow the rejected promise to settle without an unhandled rejection
		await Promise.resolve();
	});

	it('does not throw when fetch itself throws synchronously', () => {
		const fetchImpl = vi.fn(() => {
			throw new Error('boom');
		});
		expect(() => postSnapshot('llm', { uc1: 0 }, fetchImpl as unknown as typeof fetch)).not.toThrow();
	});
});
