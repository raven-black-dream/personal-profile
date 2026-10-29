# Snapshot Result Fixes (rubric v0.6) Implementation Plan

> **READ FIRST:** the two sections at the end, "Controller rulings" and "Corrections from plan verification, red-team and security" (plus its W1 addendum), are binding and override any earlier text in this plan and in the .json summary that conflicts with them (expected arrays for Cases C/C2, CAP_SOURCES, apostrophes, D1 placement).


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four defects in the free AI Readiness Snapshot result: weakness messages chosen per question so they match the answers, a privacy cap, a `strong` observation that no longer repeats the band blurb, and a use-case floor at `<= 25`. Bump the rubric to v0.6.

**Architecture:** All changes are in the pure, client-side scoring engine (`src/lib/consulting/scoring.ts`) and its content file (`src/lib/consulting/snapshot-content.ts`). Step 6 of `scoreSnapshot` swaps the per-dimension `low:<dimension>` lookup for a per-question pick inside each weak dimension; step 5 gains one `else if` for the privacy cap and changes `<` to `<=`. No component, server, API or schema code changes; only tests that pin the version string move.

**Tech Stack:** SvelteKit (Svelte 5), TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-snapshot-result-fixes-design.md`
**Blind-spot pass:** `.factory/r6/blind-spots.md` (CONVENTIONS / COUPLINGS / GAPS with file:line; every expected observation list below was checked by a scratchpad-only prototype of these rules).

## Global Constraints

- Copy strings are transcribed **byte-for-byte** from the "Copy" table below (the spec's Copy section). They use ASCII apostrophes (`'`); do not convert them to typographic `’` even though older snippets use `’`. No em dashes, no superlatives.
- Exactly 14 per-question keys: `low:uc1`, `low:uc2`, `low:uc3`, `low:uc4`, `low:tc1`, `low:tc2`, `low:tc3`, `low:pc1`, `low:pc2`, `low:df1`, `low:df2`, `low:ti1`, `low:gr1`, `low:gr2`. No `low:ag1`, no `low:rag1`.
- Removed keys: `low:use-case-fit`, `low:team-capability`, `low:data-foundation`, `low:tooling-infra`, `low:process-clarity`, `low:governance-risk`.
- No `cap:privacy` key is added to `SNIPPETS`; the privacy text comes only from gr2's existing `insight: 'flag:privacy'` (FR4, Assumption 3).
- Cap precedence (first match wins): use-case floor → risk-blind → real-damage → privacy.
- `FLOOR_T` stays `25`; the comparison becomes `ucf.normalised <= FLOOR_T`.
- `RUBRIC_VERSION = 'v0.6'`; PLACEHOLDER line reads `(v0.6, 2026-10-29)`.
- Unchanged: question set and order, weights, band thresholds 75/50, band blurbs/CTAs, the three-observation limit, the `strong` condition (`!capReason && overall >= 75`), the component, logging, API, D1 schema.
- Commands: `npm test`, `npm run check`, `npm run build`. Do not run `npm install` (node_modules is a symlink).

### Copy (verbatim from the spec)

- `low:uc1`: "A person checking every answer is a sound setup, but the check is where the time goes. Before automating, time how long a review takes: if checking is nearly as slow as doing the work, the gain is small."
- `low:uc2`: "This isn’t yet one specific task that comes up often. The teams that get value name a single job that costs real hours every week and point AI at exactly that. Pick your most repetitive time-sink and start there."
- `low:uc3`: "There’s no written, agreed description yet of what a good result looks like. Without one, nobody can tell whether the AI got it right. Writing it down is usually an hour’s work, and it comes before building anything."
- `low:uc4`: "This task is missing a named owner, a business number it would move, or both. Without them a pilot drifts: nobody is accountable for it and nobody can show it paid off. Settle both before you start."
- `low:tc1`: "Most of your team isn’t using AI for real work yet. A short, practical session to get a few more people productive will move you further than any strategy document."
- `low:tc2`: "Your team doesn’t always catch it when AI gets something wrong. That’s the skill that makes everything else safe, and it can be taught: practice at checking AI output pays off before any automation does."
- `low:tc3`: "Leadership doesn’t yet have a clear line on what AI shouldn’t be trusted with. Drawing that line is quick, and it’s what lets people use AI with confidence everywhere else."
- `low:pc1`: "If the person doing your most repetitive job were away, the work would depend on asking around rather than on a written process. An AI can only follow what’s written down, so documenting that job comes first, and it’s worth doing whether or not you automate it."
- `low:pc2`: "The rules behind your recurring decisions aren’t fully written down and current. Those rules are what an AI needs to act on your behalf. Capturing them is cheap, and it protects the business whether or not you automate."
- `low:df1`: "Your records of this happening are patchy or short. A model learns from past examples, so a few months of clean, consistent records will do more for you right now than any model."
- `low:df2`: "Your data isn’t in one central place yet. Models need it accessible and consistent, so pulling the data this task depends on into one place is the step to take before building on top of it."
- `low:ti1`: "Moving data between your systems still involves some manual steps. That’s a solvable plumbing problem, and worth solving before you automate on top of it."
- `low:gr1`: "Mistakes here cost you something: rework at least, and possibly more. Keep a person checking every output until you’ve seen how often the AI gets your own work wrong, and put guardrails in place before anything runs on its own."
- `low:gr2`: "Sensitive or confidential data is involved, and keeping it inside controlled tools is the right setup. The next step is a written rule on what may go where, so that stays true as more people start using AI."
- `strong` (replaces the old text): "Before anything gets built, agree the one number this should move and record where it stands today. Then the result is visible when it lands, not a matter of opinion."

### Shared test fixtures (used by both tasks, defined once in `src/lib/consulting/scoring.test.ts`)

```ts
// Case A from the spec (llm). Cases below are written as spreads of A.
const A: Answers = { uc1: 3, uc2: 3, uc3: 2, uc4: 2, rag1: 0, tc1: 3, ag1: 0, tc2: 2, tc3: 2,
	pc1: 2, pc2: 2, df2: 2, ti1: 2, gr1: 2, gr2: 2 };
const B: Answers = { ...A, df2: 3, ti1: 3, gr1: 2, gr2: 0 };
// answerSet gains a 'mid' pick: index Math.floor(q.options.length / 2).
const S = (k: string) => SNIPPETS[k];
```

## Review Focus

1. **A weak dimension whose only remaining answer is the top one** (spec gap G1): e.g. Case B, where gr2 is skipped (it already told) and gr1 is "Minor annoyance". A person who picked the best answer must not be told the worst case. Rule: a candidate's chosen score must be below that question's top option score; otherwise the dimension adds nothing. Pinned in Task 1 (risk-blind fixture) and Task 2 (Case B observations `[flag:privacy]` only).
2. **The reported "no use case, no definition, no owner" profile with a strong team** (Case C2, gap G3): on main it scores Ready to prioritise (74) and is pitched the Audit. The spec's Case C is already Foundations first on main (overall 46), so only `capReason` changes there. Pinned in Task 2 by both C and C2.
3. **Cap text plus a same-dimension weakness message under the use-case floor** (decision D1): Cases C/C2 show `cap:use-case` and `low:uc2`. Assumption 2 only skips questions whose *option* produced a cap or insight; the floor is dimension-level, and main already showed `cap:use-case` with `low:use-case-fit`. Kept as the literal reading; the PR names it for Evan. Pinned (as current behaviour) by the Case C/C2 assertions.
4. **Results that hit none of the four defects must not move** (AC6): band, overall and capReason pinned for llm/ml/both × first/mid/last at main's values, in Task 1, so both commits are checked against them.
5. **Visible apostrophe mismatch on one card** (decision D2): new strings use `'`, older cap/insight/gate strings use `’`. Kept verbatim per the spec; listed in the PR copy section for Evan.

---

### Task 1: Per-question weakness messages (FR1, FR2, FR3, FR8)

Adds the 14 messages, replaces dimension-level lookup with per-question selection, removes the six dimension keys and updates the doc comments. These land together because `SNIPPETS` is `Record<string, string>`: removing the keys before the selection change would silently blank results with a green suite.

**Files:**
- Modify: `src/lib/consulting/snapshot-content.ts` (SNIPPETS doc comment :400-404; remove :423-434; add the 14 keys)
- Modify: `src/lib/consulting/scoring.ts` (`SnapshotResult` doc comments :52-53 and :55; constants after :60; step-6 comment :151 and loop :164-172)
- Modify: `src/lib/consulting/scoring.test.ts`
- Modify: `src/lib/consulting/snapshot-content.test.ts`

**Interfaces:**
- Consumes: `QUESTIONS`, `SNIPPETS`, `type Option`, `type Question` from `snapshot-content.ts`.
- Produces (module-private in `scoring.ts`, Task 2 extends `CAP_SOURCES`):
  - `const CAP_SOURCES: Record<string, NonNullable<Option['cap']>[]>` = `{ 'cap:risk-blind': ['real-damage', 'cannot-verify'], 'cap:real-damage': ['real-damage'] }` — which option caps an applied `capReason` "told".
  - `function topScore(q: Question): number` — highest numeric `score` among `q.options`.
  - `SNIPPETS['low:<qid>']` for the 14 ids in Global Constraints.

- [ ] **Step 1: Write the failing content tests** in `snapshot-content.test.ts`

```ts
const LOW_COPY: Record<string, string> = { /* the 14 low:<qid> strings, verbatim from the Copy section */ };

describe('per-question weakness messages (v0.6)', () => {
	it('has exactly the 14 low:<qid> keys with the approved copy', () => {
		const lowKeys = Object.keys(SNIPPETS).filter((k) => k.startsWith('low:')).sort();
		expect(lowKeys).toEqual(Object.keys(LOW_COPY).sort());
		for (const [k, v] of Object.entries(LOW_COPY)) expect(SNIPPETS[k]).toBe(v);
	});
	it('every question with a non-top scored option has its low:<qid> key (AC5)', () => {
		for (const q of QUESTIONS) {
			const scores = q.options.map((o) => o.score).filter((s): s is number => typeof s === 'number');
			if (scores.some((s) => s < Math.max(...scores))) expect(SNIPPETS[`low:${q.id}`]).toBeDefined();
		}
	});
	it('the six dimension-level keys are gone (FR3)', () => {
		for (const d of ['use-case-fit','team-capability','data-foundation','tooling-infra','process-clarity','governance-risk'])
			expect(SNIPPETS[`low:${d}`]).toBeUndefined();
	});
});
```

- [ ] **Step 2: Write the failing scoring tests** in `scoring.test.ts` (add the shared fixtures and `'mid'` to `answerSet`). Use `toEqual` on whole observation arrays:

| test name | answers (llm unless noted) | expected `observations` |
|---|---|---|
| `Case A: messages match the answers (AC1)` | `A` | `[S('strong'), S('low:df2'), S('low:ti1')]`; also `join(' ')` contains neither `spread across spreadsheets` nor `mostly manual` |
| `lowest-scoring question wins` | `{ ...A, tc1: 1, tc2: 0 }` | `[S('strong'), S('low:tc2'), S('low:df2')]` |
| `uc3 "No" is eligible when no cap applied` | `{ ...A, uc3: 0, uc4: 0 }` | `[S('strong'), S('low:uc3'), S('low:df2')]` |
| `question that produced the cap is skipped; top answer never chosen (E1)` | `{ ...A, uc3: 0, uc4: 0, gr1: 0 }` | capReason `cap:risk-blind`; `[S('cap:risk-blind'), S('low:uc4'), S('low:df2')]` |
| `mid sets: ties go to QUESTIONS order (E3)` (llm, ml, both) | `answerSet(b, 'mid')` | llm `[low:gr1, low:pc1, low:uc1]`; ml `[low:gr1, low:pc1, low:uc3]`; both `[low:gr1, low:pc1, low:uc1]` (each via `S`) |
| `ag1 has no effect on mid sets` (extend the existing ag1 describe.each with `'mid'`) | `answerSet(b, 'mid')` ± ag1 0/1/2 | deep-equal, as the existing test |
| `unaffected answer sets keep band, overall, capReason (AC6)` | `answerSet(b, p)` for 3 branches × first/mid/last | `{band.id, overall, capReason}`: first → `not-a-fit, 0, null` (all branches); mid → llm `ready-to-prioritise, 58, null`, ml `ready-to-prioritise, 58, null`, both `ready-to-prioritise, 55, null`; last → `ready-to-build, 100, null` (all branches) |

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test -- src/lib/consulting`
Expected: the new content tests and the Case A / selection / mid tests FAIL (keys missing; observations still dimension-level). AC6 pins and ag1 tests PASS already.

- [ ] **Step 4: Add the 14 `low:<qid>` entries to `SNIPPETS`, delete the six `low:<dimension>` entries, and rewrite the SNIPPETS doc comment** to: assembly order is cap reason (if capped) → chosen-option insights → `strong` (no cap, overall ≥ 75) → one per-question weakness message per weak dimension (weakest dimension first), capped at 3.

- [ ] **Step 5: Implement the selection in `scoring.ts` step 6**

Add `CAP_SOURCES` and `topScore(q: Question): number` (see Interfaces; `topScore` ignores options with no `score`). Replace the `push(SNIPPETS[\`low:${d.id}\`])` loop body with: among `applicable` questions where `q.dimension === d.id`, take the chosen option `o = q.options[answers[q.id]]`; it is a candidate when `typeof o.score === 'number'`, `o.score < topScore(q)`, and it is not *told*. Told means `o.insight` is set, or `o.cap` is set and `CAP_SOURCES[capReason]` contains it. Pick the lowest score; on ties keep the first in `applicable` order (strict `<`). Push `SNIPPETS[\`low:${q.id}\`]` if a candidate exists, else nothing. Keep the `weakest` sort/filter and the `>= 3` break as they are.

Update doc comments: `capReason` (:52-53) to "Which cap set the band (SNIPPETS key, except `cap:privacy`, whose text comes from the `flag:privacy` insight)" (Task 2 introduces `cap:privacy`; write the comment now so it is final); `observations` (:55) and step-6 comment (:151) to the order in Step 4.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test`
Expected: all PASS (including the unchanged ag1, component and server tests).

- [ ] **Step 7: Type-check**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/consulting/snapshot-content.ts src/lib/consulting/scoring.ts src/lib/consulting/scoring.test.ts src/lib/consulting/snapshot-content.test.ts
git commit -m "fix(snapshot): choose weakness messages per question so they match the answers"
```

---

### Task 2: Privacy cap, floor at 25, new strong copy, v0.6 (FR4–FR7)

**Files:**
- Modify: `src/lib/consulting/snapshot-content.ts` (header :4-16, `RUBRIC_VERSION` :62, `Option.cap` :79, gr2 option :337-340, `strong` :435-436)
- Modify: `src/lib/consulting/scoring.ts` (`CAP_SOURCES`; step 5 :135 and after :148)
- Modify: `src/lib/consulting/scoring.test.ts`, `src/lib/consulting/snapshot-content.test.ts`
- Modify (version pins, blind-spot K1): `src/lib/server/snapshot-log-db.test.ts:56,59`, `src/routes/api/snapshot/server.test.ts:107,117`, `src/lib/server/snapshot-log.test.ts:66` (title only). Leave `AIReadinessSnapshot.test.ts:49` (comment records when ag1 was added).

**Interfaces:**
- Consumes: `CAP_SOURCES`, `topScore`, the told rule and fixtures `A`, `B`, `S` from Task 1.
- Produces: `Option['cap']` = `'real-damage' | 'cannot-verify' | 'privacy'`; `capReason` may be `'cap:privacy'`; `CAP_SOURCES['cap:privacy'] = ['privacy']`; `RUBRIC_VERSION === 'v0.6'`.

- [ ] **Step 1: Write the failing tests**

In `snapshot-content.test.ts`: `RUBRIC_VERSION` is `'v0.6'`; `SNIPPETS.strong` equals the new copy verbatim; gr2 option 0 has `cap: 'privacy'` and keeps `insight: 'flag:privacy'`.

In `scoring.test.ts` (llm; assert `band.id`, `overall`, `capReason`, and `observations` with `toEqual`):

| test name | answers | band, overall, capReason | observations |
|---|---|---|---|
| `Case B: privacy caps Ready to build (AC2)` | `B` | `ready-to-prioritise, 95, 'cap:privacy'` | `[S('flag:privacy')]`; also `observations.filter(o => o === S('flag:privacy'))` has length 1 and `join(' ')` lacks `real damage` |
| `Case C: floor triggers at 25 (AC4)` | `{ ...A, uc2: 0, uc3: 0, uc4: 0, tc1: 0, tc2: 0, tc3: 0 }` | `foundations-first, 46, 'cap:use-case'` | `[S('cap:use-case'), S('low:tc1'), S('low:uc2')]` |
| `Case C2: strong team no longer escapes the floor` | `{ ...A, uc2: 0, uc3: 0, uc4: 0 }` | `foundations-first, 74, 'cap:use-case'` | `[S('cap:use-case'), S('low:uc2'), S('low:df2')]` |
| `E4: real-damage outranks privacy` | `{ ...B, gr1: 0 }` | `ready-to-prioritise, 91, 'cap:real-damage'` | `[S('cap:real-damage'), S('flag:privacy')]` |
| `E5: privacy below Ready to build is a no-op on band` | `{ ...B, tc1: 0, tc2: 0, tc3: 0 }` | `ready-to-prioritise, 68, null` | `[S('flag:privacy'), S('low:tc1')]` |
| `AC3: Ready to build never repeats the blurb` | `A` and `answerSet(b, 'last')` for 3 branches | `ready-to-build` | no observation equals the band's `blurb`; `S('strong')` does not contain `sensible read on the risks` |

Change the version pins in the three server/log test files from `'v0.5'` to `'v0.6'` (assertions and titles).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL on version, strong copy, gr2 cap, Cases B/C/C2/E5 (E4 may already pass).

- [ ] **Step 3: Content changes in `snapshot-content.ts`**

Extend the `Option.cap` union with `'privacy'`; add `cap: 'privacy'` to gr2 option 0 (keep its `score` and `insight`); replace `strong` with the new copy; set `RUBRIC_VERSION = 'v0.6'`; change the PLACEHOLDER line to `(v0.6, 2026-10-29)` and insert this block above "What changed in v0.5":

```
 * What changed in v0.6 (result fixes from the 2026-10-29 review, which ran scoreSnapshot on
 * v0.5 and found four defects; spec docs/superpowers/specs/2026-10-29-snapshot-result-fixes-design.md):
 *   - Weakness messages are chosen per question (`low:<questionId>`), from the lowest-scoring
 *     non-top answer in each weak dimension, skipping a question that already produced a cap or
 *     insight. The six `low:<dimension>` snippets, which described the worst case, are removed.
 *   - gr2 "pasting it into public AI tools" caps Ready to build at Ready to prioritise
 *     (`cap:privacy`); the existing `flag:privacy` text explains it.
 *   - The use-case floor triggers at 25 or below (was below 25).
 *   - `strong` rewritten so it no longer repeats the Ready to build blurb.
```

- [ ] **Step 4: Scoring changes in `scoring.ts`**

Add `'cap:privacy': ['privacy']` to `CAP_SOURCES`. In step 5 change `ucf.normalised < FLOOR_T` to `ucf.normalised <= FLOOR_T`, and after the real-damage branch add `else if (privacy chosen && band.id === 'ready-to-build')` → band `ready-to-prioritise`, `capReason = 'cap:privacy'` (privacy chosen = `chosen.some((o) => o.cap === 'privacy')`). Update the `FLOOR_T` comment to "at or below this".

- [ ] **Step 5: Run the full verification**

Run: `npm test && npm run check && npm run build`
Expected: all tests PASS, check 0 errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/consulting src/lib/server/snapshot-log-db.test.ts src/lib/server/snapshot-log.test.ts src/routes/api/snapshot/server.test.ts
git commit -m "fix(snapshot): privacy cap, use-case floor at 25, new strong copy; rubric v0.6"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-29-snapshot-result-fixes.md`. Please review the plan. Does it capture what you want?

## Controller rulings (2026-10-29, binding; override the steps above where they conflict)

- **D1 ruled:** when `capReason === 'cap:use-case'`, the `use-case-fit` dimension adds NO weakness message (the floor's text already says it). Implement as: skip the dimension in the weakness loop when `capReason === 'cap:use-case' && d.id === 'use-case-fit'`. Update every expected observation array for Cases C, C2 and any other `cap:use-case` fixture to drop `S('low:uc…')` entries for the use-case dimension, and add a test that a `cap:use-case` result contains no `low:uc1`–`low:uc4` text. Spec Assumption 2 now states this.
- **D2 ruled:** the new copy uses the curly apostrophe ’ (U+2019), matching existing snippets. The Copy lines in this plan and the spec are already converted; transcribe them exactly.

## Corrections from plan verification, red-team and security (2026-10-29, binding; override everything above)

Sources: `.factory/r6/plan-verification.md` (BLOCK), `.factory/r6/plan-redteam.md` (BLOCK), `.factory/r6/security-spec.md` (PASS, S1 WARN). Values below were verified by the red-team running the corrected plan.

- **F1 (expected arrays under D1):** Case C expects `[S('cap:use-case'), S('low:tc1'), S('low:df2')]`; Case C2 expects `[S('cap:use-case'), S('low:df2'), S('low:ti1')]`. Update Task 2 Step 1, JSON TC-10 and Review Focus 3. (Dropping the uc entry frees the slot for the next weak dimension.)
- **F3 (D1 placement):** implement the D1 skip in Task 1 Step 5 (the weakness loop) and add a test there: a `cap:use-case` result contains none of the `low:uc1`–`low:uc4` texts.
- **R1 / S1 (crash):** the told lookup must be total. Add `'cap:use-case': []` to `CAP_SOURCES` AND read it with `CAP_SOURCES[capReason]?.includes(o.cap) ?? false`. Add a regression row: `{ ...A, uc2: 0, uc3: 0, uc4: 0, gr1: 0 }` → band `foundations-first`, overall 69, capReason `cap:use-case`, observations `[S('cap:use-case'), S('low:gr1'), S('low:df2')]`.
- **R2 (unanswered question):** guard the chosen-option read (`const o = answers[q.id] != null ? q.options[answers[q.id]] : undefined`; skip when undefined). Add an ag1 equality case on fixture `A` (with vs without ag1, deep-equal).
- **R4 (gr1 below Ready to build):** resolved by new `low:gr1` copy, true for both "Real damage" and "Some rework" (already replaced in spec and Copy above): "Mistakes here cost you something: rework at least, and possibly more. Keep a person checking every output until you’ve seen how often the AI gets your own work wrong, and put guardrails in place before anything runs on its own."
- **R5 (AC3):** keep the "no observation equals the blurb" assertion but the load-bearing checks are: `strong` equals the new copy exactly, and no Ready to build observation contains "sensible read on the risks".
- **R6 (E5/E6 pins):** add rows `{ ...C2, gr2: 0 }` → `foundations-first`, 69, `cap:use-case`, `[S('cap:use-case'), S('flag:privacy'), S('low:df2')]`; and for each branch's all-first (gated) set, observations are exactly `[S('gate:<gate>')]`.
- **F2 (apostrophes):** delete the Global Constraints / Review Focus bullets that say to use ASCII apostrophes. New copy uses ’ (U+2019); a test should assert at least one new snippet contains ’ and none contains ASCII `'`.
- **F4:** E5's test may already pass at Task 2's red step; that is expected, not a TDD violation. Note it in the report.
- **F5:** the v0.6 header block and the SNIPPETS doc comment mention the D1 skip (no weakness message for use-case-fit when the use-case floor applied).
- **Imports:** add `SNIPPETS`, `BANDS`, `isComplete` imports to the test files that need them.

### Addendum W1 (from the re-check, verified at both Task 1 and final v0.6 states)

- Task 1 still has the old `< 25` floor, so its D1 test must use a fixture BELOW 25: `{ ...A, uc1: 2, uc2: 0, uc3: 0, uc4: 0 }` → `foundations-first`, 70, `cap:use-case`, `[S('cap:use-case'), S('low:df2'), S('low:ti1')]`. Task 1's R1 crash row is `{ ...A, uc1: 2, uc2: 0, uc3: 0, uc4: 0, gr1: 0 }` → `foundations-first`, 66, `cap:use-case`, `[S('cap:use-case'), S('low:gr1'), S('low:df2')]`. Both keep these values in v0.6.
- The rows sitting exactly at use-case 25 (Cases C, C2, the at-25 R1 row, the R6 row) belong in Task 2, after the floor becomes `<= 25`.
- Define `C2` in the shared fixtures block (`{ ...A, uc2: 0, uc3: 0, uc4: 0 }`).
