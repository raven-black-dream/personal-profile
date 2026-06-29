# Snapshot Response Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every completed AI Readiness Snapshot as one anonymous row in a Cloudflare D1 table, written from a fire-and-forget `POST /api/snapshot` endpoint that server-recomputes the score.

**Architecture:** The Svelte wizard POSTs only `{ branch, answers }`. A SvelteKit `+server.ts` endpoint validates the payload against the *current* rubric, re-runs `scoreSnapshot` server-side (client scores are never trusted), derives coarse `device_class`/`source` from request headers, and inserts a single bound-parameter row into D1. Pure logic (validation, header derivation, row building, prune cutoff) lives in `src/lib/server/snapshot-log.ts` so it is unit-testable without a live binding; the endpoint only orchestrates. Tests use vitest with a hand-rolled D1 mock — never a real binding.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes), `@sveltejs/adapter-cloudflare`, Cloudflare D1, vitest + jsdom + `@testing-library/svelte`, `wrangler`.

## Global Constraints

- **Server recompute is authoritative** — the endpoint MUST import and re-run `scoreSnapshot(branch, answers)`; client-supplied scores are never stored.
- **Anonymous only** — never persist IP, full User-Agent, email, name, or fingerprint. Only `created_at`, coarse `device_class` (`mobile`|`desktop`), coarse `source` (`deeplink`|`organic`).
- **Bound parameters only** — every D1 write uses `.prepare(...).bind(...)`; never string-concatenate values into SQL. Hard requirement.
- **Graceful degradation** — if `platform?.env?.DB` is absent or D1 throws, the endpoint never throws and the result screen always renders fully.
- **Fire-and-forget** — the component must not `await` the POST; failures are swallowed.
- **`RUBRIC_VERSION` initial value is exactly `"v0.2"`**, defined in `src/lib/consulting/snapshot-content.ts`, stamped on every row.
- **Transparency line copy (verbatim):** `Anonymous answers are kept to improve this tool — no names, no emails.`
- **Retention:** prune rows older than **24 months**.
- **No tests against a real/prod D1** — mock or local only. Hard rule.
- **Test command:** `npx vitest run`.

---

### Task 1: Test infrastructure (vitest)

Stand up the test runner the rest of the plan depends on. No vitest exists today.

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest-setup.ts`
- Create: `src/lib/server/smoke.test.ts` (temporary; deleted at end of task)
- Modify: `package.json` (add `test` script + devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npx vitest run` that resolves `$lib`, compiles `.svelte`, runs under jsdom. Test glob: `src/**/*.{test,spec}.{js,ts}`.

- [ ] **Step 1: Install test dependencies**

```bash
cd /home/evan/Projects/personal-profile
npm install -D vitest@^2 jsdom@^25 @testing-library/svelte@^5 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

- [ ] **Step 2: Add the `test` script to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the vitest config**

Create `vitest.config.ts`. A dedicated config (not the app `vite.config.ts`) avoids the full `sveltekit()` plugin, which conflicts with vitest. `$lib` is aliased manually; `svelteTesting()` sets the `browser` resolve condition and auto-cleanup.

```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import path from 'node:path';

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	resolve: {
		alias: { $lib: path.resolve('./src/lib') }
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
```

- [ ] **Step 4: Write the jsdom setup file**

Create `vitest-setup.ts`. The stubs let bits-ui's Dialog (used by the component test in Task 9) mount under jsdom, which lacks pointer-capture and matchMedia.

```ts
import '@testing-library/jest-dom/vitest';

// bits-ui / floating-ui need these APIs that jsdom does not implement.
if (!window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			onchange: null,
			addEventListener: () => {},
			removeEventListener: () => {},
			addListener: () => {},
			removeListener: () => {},
			dispatchEvent: () => false
		}) as unknown as MediaQueryList;
}

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
```

- [ ] **Step 5: Write a smoke test**

Create `src/lib/server/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest', () => {
	it('runs', () => {
		expect(1 + 1).toBe(2);
	});
});
```

- [ ] **Step 6: Run the smoke test to verify the runner works**

Run: `npx vitest run src/lib/server/smoke.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 7: Delete the smoke test**

```bash
rm src/lib/server/smoke.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest-setup.ts
git commit -m "test: add vitest + jsdom test infrastructure"
```

---

### Task 2: RUBRIC_VERSION constant

**Files:**
- Modify: `src/lib/consulting/snapshot-content.ts` (add the constant near the top, after the `Branch` type)
- Test: `src/lib/consulting/snapshot-content.test.ts`

**Interfaces:**
- Produces: `export const RUBRIC_VERSION: string` (value `"v0.2"`), imported by `src/lib/server/snapshot-log.ts` (Task 4).

- [ ] **Step 1: Write the failing test**

Create `src/lib/consulting/snapshot-content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { RUBRIC_VERSION } from './snapshot-content';

describe('RUBRIC_VERSION', () => {
	it('is the current rubric version string', () => {
		expect(RUBRIC_VERSION).toBe('v0.2');
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/consulting/snapshot-content.test.ts`
Expected: FAIL — `RUBRIC_VERSION` is not exported.

- [ ] **Step 3: Add the constant**

In `src/lib/consulting/snapshot-content.ts`, immediately after the line `export type Branch = 'llm' | 'ml' | 'both';`, add:

```ts
/**
 * Rubric version stamped on every logged snapshot response, so calibration can
 * segment answer distributions by rubric. Bump this whenever QUESTIONS,
 * DIMENSIONS, BANDS, or the scoring rules change in a way that affects results.
 */
export const RUBRIC_VERSION = 'v0.2';
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/consulting/snapshot-content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consulting/snapshot-content.ts src/lib/consulting/snapshot-content.test.ts
git commit -m "feat: add RUBRIC_VERSION constant to snapshot content"
```

---

### Task 3: Server validation & header-derivation helpers

Pure functions: payload validation against the current rubric, coarse device/source derivation, and the prune cutoff. No D1 here.

**Files:**
- Create: `src/lib/server/snapshot-log.ts`
- Test: `src/lib/server/snapshot-log.test.ts`

**Interfaces:**
- Consumes: `questionsForBranch`, `isComplete`, `type Answers` from `../consulting/scoring`; `type Branch` from `../consulting/snapshot-content`.
- Produces:
  - `type ValidationResult = { ok: true; branch: Branch; answers: Answers } | { ok: false; message: string }`
  - `validateSnapshotPayload(body: unknown): ValidationResult`
  - `deriveDeviceClass(userAgent: string | null): 'mobile' | 'desktop'`
  - `deriveSource(referer: string | null): 'deeplink' | 'organic'`
  - `snapshotPruneCutoff(nowMs: number, months?: number): number`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/server/snapshot-log.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/server/snapshot-log.test.ts`
Expected: FAIL — module `./snapshot-log` not found.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/server/snapshot-log.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/server/snapshot-log.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/snapshot-log.ts src/lib/server/snapshot-log.test.ts
git commit -m "feat: add snapshot payload validation and header-derivation helpers"
```

---

### Task 4: Row builder, D1 insert, and prune

Add the row-shaping (server recompute via `scoreSnapshot`) and the two D1 operations to `snapshot-log.ts`, with a hand-rolled D1 mock in tests.

**Files:**
- Modify: `src/lib/server/snapshot-log.ts` (append types + 3 functions)
- Test: `src/lib/server/snapshot-log-db.test.ts`

**Interfaces:**
- Consumes: `scoreSnapshot` from `../consulting/scoring`; `RUBRIC_VERSION` from `../consulting/snapshot-content`; `snapshotPruneCutoff` (Task 3, same module); the global `D1Database` type (available at runtime in Workers; in tests a structural mock is passed and typed `as unknown as D1Database`).
- Produces:
  - `interface SnapshotRow { id; created_at; rubric_version; branch; answers_json; overall; band_id; gate; cap_reason; dimensions_json; source; device_class }`
  - `interface RowContext { deviceClass: 'mobile' | 'desktop'; source: 'deeplink' | 'organic'; now: number }`
  - `buildSnapshotRow(branch: Branch, answers: Answers, ctx: RowContext): SnapshotRow`
  - `insertSnapshot(db: D1Database, row: SnapshotRow): Promise<void>`
  - `pruneOldSnapshots(db: D1Database, nowMs: number, months?: number): Promise<number>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/server/snapshot-log-db.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/server/snapshot-log-db.test.ts`
Expected: FAIL — `buildSnapshotRow` / `insertSnapshot` / `pruneOldSnapshots` are not exported.

- [ ] **Step 3: Append the row builder and D1 operations**

Append to `src/lib/server/snapshot-log.ts`. Add this import to the existing import block at the top (merge with the existing `../consulting/scoring` and `../consulting/snapshot-content` imports):

```ts
import { scoreSnapshot, questionsForBranch, isComplete, type Answers } from '../consulting/scoring';
import { RUBRIC_VERSION, type Branch } from '../consulting/snapshot-content';
```

Then append at the end of the file:

```ts
export interface SnapshotRow {
	id: string;
	created_at: number;
	rubric_version: string;
	branch: Branch;
	answers_json: string;
	overall: number;
	band_id: string;
	gate: string | null;
	cap_reason: string | null;
	dimensions_json: string;
	source: 'deeplink' | 'organic';
	device_class: 'mobile' | 'desktop';
}

export interface RowContext {
	deviceClass: 'mobile' | 'desktop';
	source: 'deeplink' | 'organic';
	now: number;
}

/** Re-run the authoritative score server-side and shape the row to be stored. */
export function buildSnapshotRow(branch: Branch, answers: Answers, ctx: RowContext): SnapshotRow {
	const result = scoreSnapshot(branch, answers);
	return {
		id: crypto.randomUUID(),
		created_at: ctx.now,
		rubric_version: RUBRIC_VERSION,
		branch,
		answers_json: JSON.stringify(answers),
		overall: result.overall,
		band_id: result.band.id,
		gate: result.gate,
		cap_reason: result.capReason,
		dimensions_json: JSON.stringify(result.dimensions),
		source: ctx.source,
		device_class: ctx.deviceClass
	};
}

const INSERT_SQL =
	'INSERT INTO snapshot_responses ' +
	'(id, created_at, rubric_version, branch, answers_json, overall, band_id, gate, cap_reason, dimensions_json, source, device_class) ' +
	'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

/** Insert one row using bound parameters only. */
export async function insertSnapshot(db: D1Database, row: SnapshotRow): Promise<void> {
	await db
		.prepare(INSERT_SQL)
		.bind(
			row.id,
			row.created_at,
			row.rubric_version,
			row.branch,
			row.answers_json,
			row.overall,
			row.band_id,
			row.gate,
			row.cap_reason,
			row.dimensions_json,
			row.source,
			row.device_class
		)
		.run();
}

/** Delete rows older than `months` (default 24). Returns the number removed. */
export async function pruneOldSnapshots(
	db: D1Database,
	nowMs: number,
	months = 24
): Promise<number> {
	const cutoff = snapshotPruneCutoff(nowMs, months);
	const res = await db
		.prepare('DELETE FROM snapshot_responses WHERE created_at < ?')
		.bind(cutoff)
		.run();
	return res?.meta?.changes ?? 0;
}
```

Note: `questionsForBranch` and `isComplete` remain used by `validateSnapshotPayload`; keep them in the import. The `D1Database` type resolves once Task 5 adds `@cloudflare/workers-types`; until then the tests pass a structurally-typed mock, so vitest does not type-check it.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/server/snapshot-log-db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/snapshot-log.ts src/lib/server/snapshot-log-db.test.ts
git commit -m "feat: add snapshot row builder, bound-param insert, and prune"
```

---

### Task 5: D1 binding + Platform typing

Wire the `DB` binding into `wrangler.jsonc` and type it on `App.Platform` so `platform.env.DB` is `D1Database`.

**Files:**
- Modify: `wrangler.jsonc` (add `d1_databases`)
- Modify: `src/app.d.ts` (type `App.Platform`)
- Modify: `package.json` (add `@cloudflare/workers-types` devDependency)

**Interfaces:**
- Produces: `App.Platform.env.DB: D1Database`, consumed by the endpoint (Task 7). Binding name is exactly `DB`.

- [ ] **Step 1: Install Cloudflare Workers types**

```bash
cd /home/evan/Projects/personal-profile
npm install -D @cloudflare/workers-types@^4
```

- [ ] **Step 2: Add the D1 binding to wrangler.jsonc**

Replace the contents of `wrangler.jsonc` with (keeps existing keys, adds `d1_databases`; the `database_id` is a placeholder Evan replaces after `wrangler d1 create`):

```jsonc
{
	"name": "professional-portfolio",
	"main": ".svelte-kit/cloudflare/_worker.js",
	"compatibility_date": "2025-01-01",
	"assets": {
		"binding": "ASSETS",
		"directory": ".svelte-kit/cloudflare"
	},
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "professional-portfolio-snapshots",
			"database_id": "REPLACE_WITH_D1_DATABASE_ID",
			"migrations_dir": "migrations"
		}
	]
}
```

- [ ] **Step 3: Type the Platform interface**

Replace the contents of `src/app.d.ts`:

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
			};
			cf?: CfProperties;
			ctx?: ExecutionContext;
		}
	}
}

export {};
```

- [ ] **Step 4: Verify types still check**

Run: `npm run check`
Expected: completes with no new type errors referencing `D1Database`, `DB`, or `Platform` (pre-existing unrelated warnings, if any, are acceptable).

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc src/app.d.ts package.json package-lock.json
git commit -m "feat: add D1 binding and Platform typing for snapshot logging"
```

---

### Task 6: D1 schema migration

The `snapshot_responses` table plus a `created_at` index (used by the prune DELETE).

**Files:**
- Create: `migrations/0001_snapshot_responses.sql`
- Test: `src/lib/server/migration.test.ts` (asserts the SQL shape matches the row contract — no live DB)

**Interfaces:**
- Consumes: nothing at runtime.
- Produces: the `snapshot_responses` table that `insertSnapshot`/`pruneOldSnapshots` (Task 4) target. Column set and order must match `INSERT_SQL`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/server/migration.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/server/migration.test.ts`
Expected: FAIL — migration file does not exist (ENOENT at import time).

- [ ] **Step 3: Write the migration**

Create `migrations/0001_snapshot_responses.sql`:

```sql
-- AI Readiness Snapshot response log. One anonymous row per completed snapshot.
-- No PII: only created_at, a coarse device_class, and a coarse source.
CREATE TABLE IF NOT EXISTS snapshot_responses (
	id              TEXT    PRIMARY KEY,
	created_at      INTEGER NOT NULL,   -- server epoch ms
	rubric_version  TEXT    NOT NULL,
	branch          TEXT    NOT NULL,   -- llm | ml | both
	answers_json    TEXT    NOT NULL,   -- { questionId: optionIndex }
	overall         INTEGER NOT NULL,   -- server-recomputed 0-100
	band_id         TEXT    NOT NULL,
	gate            TEXT,               -- nullable
	cap_reason      TEXT,               -- nullable
	dimensions_json TEXT    NOT NULL,
	source          TEXT    NOT NULL,   -- deeplink | organic
	device_class    TEXT    NOT NULL    -- mobile | desktop
);

-- Supports the 24-month retention prune (DELETE ... WHERE created_at < ?).
CREATE INDEX IF NOT EXISTS idx_snapshot_responses_created_at
	ON snapshot_responses (created_at);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/server/migration.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add migrations/0001_snapshot_responses.sql src/lib/server/migration.test.ts
git commit -m "feat: add snapshot_responses D1 migration"
```

---

### Task 7: POST /api/snapshot endpoint

Orchestrates: body-size cap → JSON parse → validate → graceful no-op if no binding → build row (server recompute) → bound insert. Never throws to the client.

**Files:**
- Create: `src/routes/api/snapshot/+server.ts`
- Test: `src/routes/api/snapshot/server.test.ts`

**Interfaces:**
- Consumes: `validateSnapshotPayload`, `buildSnapshotRow`, `insertSnapshot`, `deriveDeviceClass`, `deriveSource` from `$lib/server/snapshot-log`; `json` from `@sveltejs/kit`; `App.Platform` typing (Task 5).
- Produces: `export const POST: RequestHandler`. Status contract: `204` (logged, or no-op when binding absent, or D1 threw), `400` (malformed/invalid), `413` (body too large). No response body on success.

- [ ] **Step 1: Write the failing tests**

Create `src/routes/api/snapshot/server.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/routes/api/snapshot/server.test.ts`
Expected: FAIL — `./+server` not found.

- [ ] **Step 3: Implement the endpoint**

Create `src/routes/api/snapshot/+server.ts`:

```ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	validateSnapshotPayload,
	buildSnapshotRow,
	insertSnapshot,
	deriveDeviceClass,
	deriveSource
} from '$lib/server/snapshot-log';

/** Generous cap for a 12-question answer map; rejects abusive bodies. */
const MAX_BODY_BYTES = 4096;

const noContent = () => new Response(null, { status: 204 });

export const POST: RequestHandler = async ({ request, platform }) => {
	const raw = await request.text();
	if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
		return json({ error: 'payload too large' }, { status: 413 });
	}

	let body: unknown;
	try {
		body = JSON.parse(raw);
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}

	const valid = validateSnapshotPayload(body);
	if (!valid.ok) {
		return json({ error: valid.message }, { status: 400 });
	}

	// Graceful no-op when D1 is not bound (local dev / preview).
	const db = platform?.env?.DB;
	if (!db) return noContent();

	const row = buildSnapshotRow(valid.branch, valid.answers, {
		deviceClass: deriveDeviceClass(request.headers.get('user-agent')),
		source: deriveSource(request.headers.get('referer')),
		now: Date.now()
	});

	try {
		await insertSnapshot(db, row);
	} catch {
		// Logging is best-effort; never surface a write failure to the client.
	}
	return noContent();
};
```

Note: SvelteKit generates `./$types` during `svelte-kit sync`; if vitest cannot resolve it, run `npm run prepare` once before the test. The handler only destructures `request` and `platform`, both present on the test's event object.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run prepare && npx vitest run src/routes/api/snapshot/server.test.ts`
Expected: PASS, all 7 cases.

- [ ] **Step 5: Commit**

```bash
git add src/routes/api/snapshot/+server.ts src/routes/api/snapshot/server.test.ts
git commit -m "feat: add POST /api/snapshot logging endpoint"
```

---

### Task 8: Client fire-and-forget POST helper

A tiny client-safe function the component calls inside its once-guarded effect. Extracted so the fire-and-forget behavior is unit-testable without mounting the component.

**Files:**
- Create: `src/lib/consulting/snapshot-client.ts`
- Test: `src/lib/consulting/snapshot-client.test.ts`

**Interfaces:**
- Consumes: `type Branch` from `./snapshot-content`; `type Answers` from `./scoring`.
- Produces: `postSnapshot(branch: Branch, answers: Answers, fetchImpl?: typeof fetch): void` — POSTs `{ branch, answers }` to `/api/snapshot`, never awaits, swallows all errors.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/consulting/snapshot-client.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/consulting/snapshot-client.test.ts`
Expected: FAIL — `./snapshot-client` not found.

- [ ] **Step 3: Implement the helper**

Create `src/lib/consulting/snapshot-client.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/consulting/snapshot-client.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consulting/snapshot-client.ts src/lib/consulting/snapshot-client.test.ts
git commit -m "feat: add fire-and-forget snapshot client helper"
```

---

### Task 9: Component wiring — once-guarded POST + transparency line

Hook the helper into the wizard via a `$effect` that fires once per completed result, reset on "Start over", and add the transparency line to the result block.

**Files:**
- Modify: `src/lib/components/consulting/AIReadinessSnapshot.svelte`
- Test: `src/lib/components/consulting/AIReadinessSnapshot.test.ts`

**Interfaces:**
- Consumes: `postSnapshot` from `$lib/consulting/snapshot-client` (Task 8).
- Produces: UI behavior — exactly one POST per completed result; transparency line rendered in the result block.

- [ ] **Step 1: Write the failing component test**

Create `src/lib/components/consulting/AIReadinessSnapshot.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';

// Mock the client helper so we can count POSTs without touching the network.
const postSnapshot = vi.fn();
vi.mock('$lib/consulting/snapshot-client', () => ({ postSnapshot }));

import AIReadinessSnapshot from './AIReadinessSnapshot.svelte';

/** Click through Q0 (intent) and answer every branch question by picking option 1. */
async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
	// Q0: choose the first intent ("Help my people work faster" → llm branch).
	await user.click((await screen.findAllByRole('button'))[0]);
	// Answer each subsequent question by clicking its first option until the result shows.
	for (let i = 0; i < 20; i++) {
		if (screen.queryByText(/Anonymous answers are kept/i)) break;
		const buttons = screen.getAllByRole('button');
		// The first listed option button advances the wizard.
		await user.click(buttons[0]);
	}
}

describe('AIReadinessSnapshot logging', () => {
	beforeEach(() => postSnapshot.mockClear());

	it('fires the POST exactly once when the result renders', async () => {
		const user = userEvent.setup();
		render(AIReadinessSnapshot, { props: { open: true } });
		await completeWizard(user);
		expect(postSnapshot).toHaveBeenCalledTimes(1);
	});

	it('shows the transparency line on the result screen', async () => {
		const user = userEvent.setup();
		render(AIReadinessSnapshot, { props: { open: true } });
		await completeWizard(user);
		expect(screen.getByText(/Anonymous answers are kept to improve this tool/i)).toBeInTheDocument();
	});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/components/consulting/AIReadinessSnapshot.test.ts`
Expected: FAIL — no transparency text rendered and `postSnapshot` not called (0 calls).

- [ ] **Step 3: Wire the effect and reset guard in the script block**

In `src/lib/components/consulting/AIReadinessSnapshot.svelte`, add the import alongside the existing imports (after line 4):

```ts
	import { postSnapshot } from '$lib/consulting/snapshot-client';
```

Add a `logged` flag with the other `$state` declarations (after the `answers` declaration):

```ts
	// Ensures the result is logged at most once per completed run.
	let logged = $state(false);
```

Add the once-guarded effect after the `progress` `$derived` (around line 24):

```ts
	// Fire-and-forget log when the result first becomes available. The `logged`
	// guard keeps reactive re-runs from posting twice; reset() clears it so a
	// fresh "Start over" run logs again.
	$effect(() => {
		if (result && branch && !logged) {
			logged = true;
			postSnapshot(branch, answers);
		}
	});
```

Clear the flag inside `reset()` so re-completion logs a new row:

```ts
	function reset() {
		step = 0;
		branch = null;
		answers = {};
		logged = false;
	}
```

- [ ] **Step 4: Add the transparency line to the result block**

In the `{:else if result}` block, add the transparency line immediately after the existing "This snapshot is a guide…" paragraph (after the `</p>` around line 149):

```svelte
				<p class="text-xs text-muted-foreground">
					Anonymous answers are kept to improve this tool — no names, no emails.
				</p>
```

- [ ] **Step 5: Validate the component with the Svelte MCP autofixer**

Use the `mcp__svelte__svelte-autofixer` tool on the edited `AIReadinessSnapshot.svelte` to confirm no runes/markup issues were introduced. Fix anything it reports, then re-run it until clean.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/lib/components/consulting/AIReadinessSnapshot.test.ts`
Expected: PASS — exactly one POST, transparency line present.

If the bits-ui Dialog does not mount under jsdom despite the Task 1 setup stubs, do NOT weaken the test — use `superpowers:systematic-debugging` to find the missing DOM stub (commonly `Element.prototype.scrollIntoView` or a `PointerEvent` constructor) and add it to `vitest-setup.ts`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/components/consulting/AIReadinessSnapshot.svelte src/lib/components/consulting/AIReadinessSnapshot.test.ts
git commit -m "feat: log completed snapshots once and show transparency line"
```

---

### Task 10: Retention prune wiring (Cron Trigger + documented fallback)

`pruneOldSnapshots` already exists and is tested (Task 4). This task wires the schedule. Per the spec, because `@sveltejs/adapter-cloudflare` does not cleanly host a `scheduled()` handler, the v1 mechanism is a Cloudflare Cron Trigger plus a documented recurring `wrangler d1 execute` prune as the operational fallback.

**Files:**
- Modify: `wrangler.jsonc` (add `triggers.crons`)
- Create: `migrations/prune.sql` (standalone prune statement for the manual/scheduled execution)
- Create: `docs/runbooks/snapshot-prune.md` (operator runbook)

**Interfaces:**
- Consumes: `pruneOldSnapshots` / `snapshotPruneCutoff` (Task 4) for the in-Worker path if/when a scheduled handler is added.
- Produces: a documented, runnable monthly prune.

- [ ] **Step 1: Add the cron trigger to wrangler.jsonc**

Add a `triggers` block to `wrangler.jsonc` (sibling of `d1_databases`). Monthly at 03:00 UTC on the 1st:

```jsonc
	"triggers": {
		"crons": ["0 3 1 * *"]
	}
```

The file should now contain both `d1_databases` and `triggers`. Keep valid JSONC (comma between sibling keys).

- [ ] **Step 2: Write the standalone prune SQL**

Create `migrations/prune.sql`. The cutoff is parameterized at execution time; this file documents the canonical statement. (24 months ≈ the boundary computed by `snapshotPruneCutoff`; the runbook shows how to compute the exact epoch-ms value.)

```sql
-- Retention prune: delete snapshot responses older than 24 months.
-- Pass the cutoff (epoch ms) computed for "now minus 24 calendar months".
-- Example invocation is in docs/runbooks/snapshot-prune.md.
DELETE FROM snapshot_responses WHERE created_at < :cutoff_ms;
```

- [ ] **Step 3: Write the operator runbook**

Create `docs/runbooks/snapshot-prune.md`:

```markdown
# Snapshot retention prune (24 months)

Snapshot responses are retained for 24 months, then deleted.

## Primary: Cloudflare Cron Trigger
`wrangler.jsonc` declares `triggers.crons: ["0 3 1 * *"]` (monthly, 03:00 UTC, 1st).
A `scheduled()` handler can call `pruneOldSnapshots(env.DB, Date.now())` from
`src/lib/server/snapshot-log.ts` once the SvelteKit Cloudflare adapter exposes a
scheduled entry point.

## Fallback: manual / recurring wrangler prune (v1)
Until the scheduled handler is wired, run this monthly. Compute the 24-month
cutoff and execute the bound DELETE against the production D1:

```bash
# Cutoff = now minus 24 calendar months, in epoch ms.
CUTOFF=$(node -e 'const d=new Date();d.setUTCMonth(d.getUTCMonth()-24);console.log(d.getTime())')

wrangler d1 execute professional-portfolio-snapshots --remote \
	--command "DELETE FROM snapshot_responses WHERE created_at < ${CUTOFF}"
```

Use `--local` against the local dev D1 for rehearsal. Never run a destructive
command against production without confirming the binding name and cutoff first.
```

- [ ] **Step 4: Verify the full test suite is green and wrangler.jsonc parses**

Run: `npx vitest run`
Expected: PASS — all suites (content, helpers, db, migration, endpoint, client, component).

Run: `npx wrangler d1 migrations list professional-portfolio-snapshots --local` (or `npm run check`) to confirm `wrangler.jsonc` is valid JSONC. A binding/credential error is acceptable here; a JSONC parse error is not.

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc migrations/prune.sql docs/runbooks/snapshot-prune.md
git commit -m "feat: add snapshot retention prune cron trigger and runbook"
```

---

## Self-Review

**Spec coverage check (each FR / AC mapped to a task):**
- New `POST /api/snapshot` writing to `DB` → Task 7 (+ binding Task 5).
- Client sends only `{branch,answers}`, server recomputes via `scoreSnapshot` → Task 8 (body) + Task 4 `buildSnapshotRow` + Task 7.
- Stored fields (`id`, `created_at`, `rubric_version`, `branch`, `answers_json`, `overall`, `band_id`, `gate`, `cap_reason`, `dimensions_json`, `source`, `device_class`) → Task 4 `SnapshotRow` + Task 6 schema.
- `RUBRIC_VERSION = "v0.2"` → Task 2.
- Fire-and-forget exactly once → Task 8 + Task 9 effect guard.
- Transparency line (verbatim) → Task 9.
- Schema migration (table + `created_at` index) → Task 6.
- Binding in `wrangler.jsonc` + `app.d.ts` typing → Task 5.
- 24-month prune (cron + documented `wrangler d1 execute` fallback) → Task 4 (logic) + Task 10 (wiring).
- AC1 one row, all fields → Task 7 insert test + Task 4. AC2 server-recompute equals `scoreSnapshot` → Task 4 `buildSnapshotRow` test. AC3 malformed → 4xx, no row → Task 7. AC4 D1 down → render intact (204, swallowed) → Task 7 + Task 8. AC5 transparency line → Task 9. AC6 no PII → Task 6 schema + Task 3 coarse derivation. AC7 no await → Task 8. AC8 prune only >24mo → Task 3 cutoff + Task 4. AC9 one row per completion → Task 9.
- Security: no read endpoint (only POST authored — Task 7); bound params only (Task 4 `INSERT_SQL`/prune); no IP/full-UA (Task 3 derivation; never stored); body-size cap (Task 7 `MAX_BODY_BYTES`).
- Testing guidelines: vitest added (Task 1); unit (Tasks 3,4,8), integration (Task 7), component (Task 9); D1 always mocked, never a real binding (all tasks).

**Placeholder scan:** No TBD/TODO/"add validation"/"handle edge cases" left; every code step shows full code, every run step shows the command and expected result.

**Type consistency:** `SnapshotRow` columns ↔ `INSERT_SQL` order ↔ Task 6 schema all 12 columns in the same order; `RowContext` fields (`deviceClass`,`source`,`now`) consistent across Tasks 4 and 7; `validateSnapshotPayload` `ValidationResult` consumed identically in Task 7; `postSnapshot` signature consistent across Tasks 8 and 9; `pruneOldSnapshots`/`snapshotPruneCutoff` names consistent across Tasks 3, 4, 10.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-29-snapshot-response-logging.md`.
