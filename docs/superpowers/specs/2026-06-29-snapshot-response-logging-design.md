# Snapshot Response Logging

**Date:** 2026-06-29
**Branch:** claude/feature/consulting-page-snapshot
**Status:** approved

## Summary
Persist each completed AI Readiness Snapshot as one anonymous row in a Cloudflare D1 table,
written from a SvelteKit `+server.ts` POST endpoint that the Snapshot component calls
(fire-and-forget) when the result screen renders. Purpose: capture real answer distributions
to calibrate the placeholder 75/50 band thresholds, surface skewed/never-picked options, and
back the "I calibrate my instruments" brand claim. Fully anonymous — no PII, no email, no IP,
no fingerprint.

## Functional Requirements
- New endpoint `POST /api/snapshot` (`src/routes/api/snapshot/+server.ts`) writing to a D1
  binding (`DB`).
- The client POSTs only `{ branch, answers }` (answers = `{ questionId: optionIndex }`). The
  **server recomputes** the result via `scoreSnapshot` and stores the authoritative output —
  client-computed scores are never trusted.
- Stored per row: `id` (server-generated uuid), `created_at` (server epoch ms),
  `rubric_version`, `branch`, `answers_json`, `overall`, `band_id`, `gate`, `cap_reason`,
  `dimensions_json`, `source` (`deeplink` | `organic`), `device_class` (`mobile` | `desktop`).
- Add a `RUBRIC_VERSION` constant to `snapshot-content.ts` (initial value `"v0.2"`); stamped on
  every row so calibration can segment by rubric version.
- The Snapshot component fires the POST exactly once per completed result, fire-and-forget (no
  `await` blocking render; failures swallowed).
- A transparency line on the result screen: "Anonymous answers are kept to improve this tool —
  no names, no emails."
- D1 schema migration (table + `created_at` index); D1 binding added to `wrangler.jsonc` and
  typed in `app.d.ts` (`App.Platform.env.DB`).
- A scheduled prune deleting rows older than 24 months (Cloudflare Cron Trigger; if the
  SvelteKit Cloudflare adapter cannot host a scheduled handler cleanly, a minimal companion
  scheduled worker or a documented recurring `wrangler d1 execute` prune is an acceptable v1
  fallback).

## Out of Scope
- Any email/identity capture or opt-in linkage (future, separate explicit opt-in).
- Per-step / drop-off events (v1 is completed-submissions-only).
- An admin/dashboard UI to view responses (query via `wrangler d1` / SQL).
- The actual threshold recalibration that *consumes* this data (separate later task).
- MotherDuck ETL (later; D1 is the v1 system of record).
- Consent banner / cookies (none needed — anonymous, no cookies set).

## Edge Cases
- POST fails / D1 unavailable → result still renders fully; nothing surfaces to the user.
- Malformed or forged payload (unknown branch, unknown questionId, out-of-range option index)
  → server validates against the current rubric, returns 4xx, writes no row.
- Stale client after a rubric change → answers validated against current `QUESTIONS`; mismatch
  is rejected (keeps calibration clean; `rubric_version` makes drift detectable).
- D1 binding absent in local dev/preview → endpoint no-ops gracefully (guards
  `platform?.env?.DB`), never throws.
- Component effect re-firing on reactive ticks → guarded to fire once per completed result;
  "Start over" + re-complete logs a new row (acceptable).
- Bot / no-JS visitor → no POST (analytics-only, fine).
- Oversized request body → rejected by a size cap.

## Acceptance Criteria
1. Completing the Snapshot inserts exactly one row with all listed fields populated.
2. Stored `overall`/`band_id`/`gate`/`cap_reason`/`dimensions_json` equal
   `scoreSnapshot(branch, answers)` computed **server-side** (not client-supplied).
3. Malformed payload → 4xx and no row written.
4. POST failure / D1 down → result screen renders fully, no user-visible error.
5. The transparency line is shown on the result screen.
6. No PII/email/IP/full-UA/fingerprint stored (schema has only `created_at`, coarse
   `device_class`, coarse `source`).
7. Result render does not await the POST (fire-and-forget).
8. The prune removes rows older than 24 months and leaves newer rows intact.
9. Normal completion writes exactly one row (effect-refire guard holds).

## Security Considerations
- **No read endpoint exists** — ingestion is write-only; calibration reads happen out-of-band
  via `wrangler` / SQL. So there is **no BOLA/IDOR surface** (no user-owned records to fetch).
- **Public write endpoint → data-poisoning, not data theft.** Accepted, low-impact (anonymous
  aggregate; calibration is human-judged). Mitigations: strict shape/range validation + server
  recompute (no arbitrary values land), Cloudflare default rate/bot protection, body-size cap,
  same-origin expectation.
- **SQL injection:** D1 prepared statements with bound parameters only — never
  string-concatenate answers into SQL. Hard requirement.
- **Privacy:** never persist IP or full User-Agent; `device_class` is a coarse mobile/desktop
  bucket derived at request time and otherwise discarded.
- No secrets at the edge (D1 is a binding, not a credential).

## Testing Guidelines
- The project has **no test runner today** — v1 adds **vitest** (standard for Vite/SvelteKit).
  D1 is mocked (no real binding in tests).
- Unit: payload validation (valid + each malformed case); server recompute matches
  `scoreSnapshot`; `device_class`/`source` derivation; prune selects only >24-month rows.
- Integration: POST with a mocked D1 inserts the expected row; malformed → 4xx, no insert; D1
  throwing → endpoint degrades gracefully.
- Component: result render triggers exactly one POST; POST failure doesn't break render;
  transparency line present.
- **No tests run against a real/prod D1** (mock or a local `--local` D1 only) — per the hard
  no-prod-test rule.
