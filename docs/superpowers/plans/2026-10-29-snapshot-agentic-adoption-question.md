# Snapshot Agentic-Adoption Question Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one unscored, mandatory measurement question (`ag1`) to the free AI Readiness Snapshot, logged with every response, and bump the rubric to v0.5 without changing any score, band or observation.

**Architecture:** `ag1` is a plain data entry in `QUESTIONS` (`src/lib/consulting/snapshot-content.ts`), placed after `tc1`, with options that carry no `score`/`gate`/`weightMod`/`cap`/`insight`. The scoring engine already drops score-less options from dimension averages and `items` (`scoring.ts` step 3), and the server allowlist and completeness check derive from `questionsForBranch`, so no engine, server or schema code changes. The work is content plus tests that pin "no effect on results" and "logged and validated".

**Tech Stack:** SvelteKit (Svelte 5), TypeScript, Vitest + @testing-library/svelte, Cloudflare D1 (mocked in tests).

**Spec:** `docs/superpowers/specs/2026-10-29-snapshot-agentic-adoption-question-design.md`

## Global Constraints

- Question id: `ag1`.
- Prompt, verbatim: `Does any AI tool act on your behalf today: sending, booking or updating something without someone doing each step?`
- Options in this order, labels verbatim: `No` (index 0), `Not sure` (1), `Yes` (2). No `score`, `gate`, `weightMod`, `cap` or `insight` on any.
- No `branches` field (shown on `llm`, `ml`, `both`).
- `dimension: 'tooling-infra'` with an inline comment: unscored measurement item for Consultancy `forward-bets.md` Bet 6; no effect on any dimension.
- Position: immediately after `tc1` in `QUESTIONS`.
- `RUBRIC_VERSION = 'v0.5'`; its doc comment also says to bump when the answer set changes (analysis segments `answers_json` by rubric version).
- Header gains a "What changed in v0.5" block (ag1; why unscored; source `Consultancy/forward-bets.md` Bet 6; accepted loss for in-flight v0.4 tabs, which the server rejects as incomplete). PLACEHOLDER line reads `v0.5, 2026-10-29`.
- `Option.score` doc comment names the third no-score case: an unscored measurement item.
- No changes to `scoring.ts`, `snapshot-log.ts`, `+server.ts`, the DB schema, the paid Audit scorecard, or consulting page copy.
- User-facing strings: no em dashes (voice rule; the prompt above already complies).
- Test command `npm test`; also `npm run check`, `npm run build`. Do not run `npm install` (node_modules is a symlink to the main checkout).

## Review Focus

1. **A gated answer set plus ag1** (E4): a respondent who trips `llm-deterministic` or `ml-no-data` and also answers ag1 must still get `not-a-fit`, overall 0, and the gate snippet. Pinned in Task 1's scoring test by scoring an all-index-0 set (uc1/df1 index 0 are gates on their branches; the test asserts the gate is non-null where expected, so the fixture can't silently drift).
2. **ag1 surfacing in `dimensions[tooling-infra].items`** or the `tooling-infra` normalised score: a respondent would expect their tooling score unchanged. Pinned by deep-equality of the whole `SnapshotResult` (Task 1).
3. **Wizard stalling at the new step** (the component helper clicks a fixed list): a respondent must be able to finish. Pinned by Task 1's component test walking through ag1 and reaching the result screen.
4. **Server accepting a stale v0.4 payload, or an out-of-range ag1** (E2, E3): rejected, nothing written. Pinned in Task 2.
5. **Label collision on "No"/"Yes"** (gr/tc questions also have a `No` option): only one question renders at a time, so exact-name clicks are unambiguous; the component test clicks `Yes` at the ag1 step and asserts the posted `ag1` is 2, which would fail if a different "Yes" were clicked.

---

### Task 1: Add ag1 to the rubric (content, version, scoring and component tests)

The content change breaks the existing component test (its wizard walk stalls at ag1), so the walk fix lives in this task to keep the suite green at the commit.

**Files:**
- Modify: `src/lib/consulting/snapshot-content.ts` (header block ~lines 1-40, `RUBRIC_VERSION` doc ~44-49, `Option.score` doc ~53, `QUESTIONS` after `tc1` ~line 209)
- Modify: `src/lib/consulting/snapshot-content.test.ts`
- Create: `src/lib/consulting/scoring.test.ts`
- Modify: `src/lib/components/consulting/AIReadinessSnapshot.test.ts` (helper ~lines 11-77 and the first `it`)

**Interfaces:**
- Consumes: `QUESTIONS`, `RUBRIC_VERSION`, `type Branch` from `snapshot-content.ts`; `questionsForBranch(branch: Branch): Question[]`, `scoreSnapshot(branch: Branch, answers: Answers): SnapshotResult`, `type Answers = Record<string, number>` from `scoring.ts`.
- Produces: question `ag1` (3 options, indexes 0-2) present in `questionsForBranch(b)` for every branch; `RUBRIC_VERSION === 'v0.5'`. Task 2 relies on both.

- [ ] **Step 1: Write the failing content tests** in `src/lib/consulting/snapshot-content.test.ts`

```ts
it('is the current rubric version string', () => {
	expect(RUBRIC_VERSION).toBe('v0.5');
});

describe('ag1 (agentic adoption, unscored)', () => {
	const PROMPT =
		'Does any AI tool act on your behalf today: sending, booking or updating something without someone doing each step?';
	it.each(['llm', 'ml', 'both'] as const)('appears once, directly after tc1, on %s', (branch) => {
		const ids = questionsForBranch(branch).map((q) => q.id);
		expect(ids.filter((id) => id === 'ag1')).toHaveLength(1);
		expect(ids.indexOf('ag1')).toBe(ids.indexOf('tc1') + 1);
	});
	it('has the exact prompt, three plain options, no branches field', () => {
		const q = QUESTIONS.find((q) => q.id === 'ag1')!;
		expect(q.prompt).toBe(PROMPT);
		expect(q.dimension).toBe('tooling-infra');
		expect(q.branches).toBeUndefined();
		expect(q.options.map((o) => o.label)).toEqual(['No', 'Not sure', 'Yes']);
		for (const o of q.options) expect(Object.keys(o)).toEqual(['label']);
	});
});
```

- [ ] **Step 2: Write the failing scoring regression test** `src/lib/consulting/scoring.test.ts`

Helper `answerSet(branch, pick: 'first' | 'last'): Answers` maps every `questionsForBranch(branch)` question to index 0 or `options.length - 1`; `withoutAg1(a)` returns a copy with `ag1` deleted.

```ts
describe.each(['llm', 'ml', 'both'] as const)('ag1 has no effect on scoring (%s)', (branch) => {
	it.each(['first', 'last'] as const)('%s-option base set', (pick) => {
		const base = answerSet(branch, pick);
		expect(base).toHaveProperty('ag1'); // fixture includes ag1, so Task 1 content must exist
		const expected = scoreSnapshot(branch, withoutAg1(base));
		for (const idx of [0, 1, 2]) {
			expect(scoreSnapshot(branch, { ...base, ag1: idx })).toEqual(expected);
		}
	});
});

it('gated answer sets still score not-a-fit with ag1 answered (E4)', () => {
	for (const branch of ['llm', 'ml'] as const) {
		const r = scoreSnapshot(branch, { ...answerSet(branch, 'first'), ag1: 2 });
		expect(r.gate).not.toBeNull();
		expect(r.band.id).toBe('not-a-fit');
		expect(r.overall).toBe(0);
	}
});
```

If `r.gate` is null for a branch with the all-first set, the implementer checks which question carries that branch's gate option and sets it explicitly in the fixture; the assertion stays.

- [ ] **Step 3: Run the new tests to verify they fail**

Run: `npx vitest run src/lib/consulting/`
Expected: FAIL (version is `v0.4`; `ag1` not found; `toHaveProperty('ag1')` fails).

- [ ] **Step 4: Implement the content change in `src/lib/consulting/snapshot-content.ts`**

Insert the `ag1` entry after `tc1` per Global Constraints (shape of `rag1` without `branches`/`weightMod`). Set `RUBRIC_VERSION = 'v0.5'` and widen its doc comment. Add the "What changed in v0.5" header block above the v0.4 block and update the PLACEHOLDER line. Extend the `Option.score` doc comment: `or omitted for a gate / pure-router option / unscored measurement item.`

- [ ] **Step 5: Update the component wizard walk** in `AIReadinessSnapshot.test.ts`

In `completeWizard`, after the `tc1` click add:

```ts
// ag1 — agentic adoption (unscored measurement item, v0.5)
await user.click(await screen.findByRole('button', { name: 'Yes' }));
```

Update the doc comment to 14 steps (1 intent + 13 branch questions) and list the actual order including pc1, pc2 and ag1 (the current list omits pc1/pc2). In the first test add:

```ts
expect(postSnapshot.mock.calls[0][1]).toMatchObject({ ag1: 2 });
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, all files (server/log tests still pass because their fixtures derive from `questionsForBranch`).

- [ ] **Step 7: Commit**

```bash
git add src/lib/consulting/snapshot-content.ts src/lib/consulting/snapshot-content.test.ts src/lib/consulting/scoring.test.ts src/lib/components/consulting/AIReadinessSnapshot.test.ts
git commit -m "feat(snapshot): add unscored ag1 agentic-adoption question, rubric v0.5"
```

---

### Task 2: Pin server validation and logging of ag1, then verify the build

These are pinning tests: the behaviour already follows from Task 1 (allowlist and completeness derive from `questionsForBranch`), so they are expected to pass on first run. The Step 2 sanity check proves they can fail.

**Files:**
- Modify: `src/lib/server/snapshot-log.test.ts` (`validateSnapshotPayload` describe)
- Modify: `src/lib/server/snapshot-log-db.test.ts` (`buildSnapshotRow` describe)
- Modify: `src/routes/api/snapshot/server.test.ts` (`POST /api/snapshot` describe)

**Interfaces:**
- Consumes: `validateSnapshotPayload(body: unknown): ValidationResult`, `buildSnapshotRow(branch, answers, ctx): SnapshotRow` from `src/lib/server/snapshot-log.ts`; `POST` from `src/routes/api/snapshot/+server.ts`; each file's existing `completeAnswers(branch)` and `fakeD1()` helpers; `ag1` and `RUBRIC_VERSION === 'v0.5'` from Task 1.
- Produces: nothing new.

- [ ] **Step 1: Add the tests**

`snapshot-log.test.ts`:
- `it.each([0, 1, 2])('accepts a complete v0.5 set with ag1 = %i')`: `validateSnapshotPayload({ branch: 'llm', answers: { ...completeAnswers('llm'), ag1: i } })` → `ok: true`, `answers.ag1 === i`.
- `it('rejects a v0.4-shaped set missing ag1 as incomplete (accepted loss, E2)')`: delete `ag1` → `{ ok: false, message: 'incomplete answers' }`.
- `it.each([3, -1])('rejects ag1 = %i (E3)')` → `{ ok: false, message: 'invalid option index for ag1' }`.

`snapshot-log-db.test.ts`:
- `it('logs ag1 in answers_json and stamps v0.5')`: `buildSnapshotRow('ml', { ...completeAnswers('ml'), ag1: 1 }, ctx)` → `JSON.parse(row.answers_json).ag1 === 1` and `row.rubric_version === 'v0.5'` (literal, not `RUBRIC_VERSION`, so AC5 is pinned here too).

`server.test.ts`:
- `it('stores ag1 for a complete v0.5 payload')`: POST `{ branch: 'both', answers: { ...completeAnswers('both'), ag1: 2 } }` → 204, one call; the bound `answers_json` arg (index 4) parses to an object with `ag1: 2`, and the `rubric_version` arg (index 2) is `'v0.5'`.
- `it('rejects a payload missing ag1 with 400 and writes nothing')` and the same for `ag1: 3`.

- [ ] **Step 2: Run, then sanity-check the tests can fail**

Run: `npx vitest run src/lib/server src/routes/api/snapshot`
Expected: PASS. Then temporarily change one new assertion's expected value (e.g. `ag1: 2` → `ag1: 1` in the server test), rerun, confirm FAIL, revert.

- [ ] **Step 3: Full verification**

Run: `npm test && npm run check && npm run build`
Expected: all tests pass; svelte-check reports 0 errors; vite build completes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/snapshot-log.test.ts src/lib/server/snapshot-log-db.test.ts src/routes/api/snapshot/server.test.ts
git commit -m "test(snapshot): pin ag1 validation and logging"
```

---

## Ownership

All tasks and test cases are agent-owned: everything runs locally under Vitest, svelte-check and vite build. Deploying is out of scope (the PR is the deliverable), so no human-owned items.

## Spec coverage

| Spec item | Task |
|---|---|
| FR1-FR5, FR8 | Task 1 Step 4, content tests Step 1 |
| FR6, AC5 | Task 1 Steps 1, 4; Task 2 db test |
| FR7 | Task 1 Step 4 (doc-only, reviewed in diff) |
| FR9, AC3, AC4 | Task 1 Step 5; Task 2 |
| AC1 | Task 1 Step 1 |
| AC2, E1, E4 | Task 1 Step 2 |
| E2, E3 | Task 2 |
| E5 | Follows from `questions.length` in the component; no test (layout unchanged) |
| AC6 | Task 2 Step 3 |

## Corrections from plan verification and red-team (2026-10-29, binding; override the steps above where they conflict)

Sources: `.factory/plan-verification.md` (WARN), `.factory/plan-redteam.md` (WARN).

- **Step 0 (before Task 1):** run `npx svelte-kit sync` in the worktree. Without `.svelte-kit/` every test file fails to load (V1), so a "red" at Task 1 Step 3 would be a transform error, not the named assertion. (Already run by the controller; baseline 33/33 green.)
- **Component test comment:** the LLM walk is **16 steps** (1 intent + 15 questions), not 14 (V2, R5).
- **Label collisions:** the other "No" options are on uc3 and tc3; no other option is labelled exactly "Yes". Exact-name clicks are safe because one question shows at a time (V3, R6).
- **R1:** the server test "ag1 = 3 → 400" must also assert the body `{ error: 'invalid option index for ag1' }`, so it cannot pass via "unknown question" when ag1 is missing.
- **R2:** the gated test is a fixture sanity check (the fixture is gated, result is not-a-fit), not an ag1 guard; name it so, and cover `both` as well as `llm` and `ml`. The equality test's gated cases are the real E4 guard.
- **R3:** assert validator results with `expect(r).toMatchObject({ ok: true, answers: { ag1: i } })` rather than reading `r.answers` on an un-narrowed union (svelte-check error otherwise).
- **R4:** Task 2's "tests can fail" step: stash/revert `src/lib/consulting/snapshot-content.ts` and rerun the new tests; every ag1 test must fail. Do not prove it by editing a test's own expected value.
- **AC4 index 0:** include ag1 = 0 in the stored-and-stamped-v0.5 test.

## Unverified assumptions

- FR5's comment, FR6's doc comment, FR7's header block and FR8's doc comment are checked only by reading the diff; no test covers comment text (R7).
- The real D1 runtime and the deployed page are not exercised; D1 is faked in tests.
