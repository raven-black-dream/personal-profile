import { describe, it, expect } from 'vitest';
import { RUBRIC_VERSION } from './snapshot-content';

describe('RUBRIC_VERSION', () => {
	it('is the current rubric version string', () => {
		expect(RUBRIC_VERSION).toBe('v0.3');
	});
});
