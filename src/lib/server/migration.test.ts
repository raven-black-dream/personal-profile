import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sql = readFileSync(resolve('migrations/0001_snapshot_responses.sql'), 'utf8');

describe('snapshot_responses migration', () => {
	it('creates the table with every stored column', () => {
		const cols = [
			'id',
			'created_at',
			'rubric_version',
			'branch',
			'answers_json',
			'overall',
			'band_id',
			'gate',
			'cap_reason',
			'dimensions_json',
			'source',
			'device_class'
		];
		expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS snapshot_responses/i);
		for (const c of cols) expect(sql).toContain(c);
	});

	it('creates an index on created_at for the prune scan', () => {
		expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS .*ON snapshot_responses ?\(created_at\)/i);
	});
});
