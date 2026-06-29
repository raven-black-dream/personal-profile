# Adversarial Review — Snapshot Response Logging — Rating: WARN

Two real, non-blocking issues (a configured cron with no handler that silently no-ops automated retention, and request-body buffering before the size check). All core security/correctness claims hold: server recompute is authoritative, SQL is fully bound, validation is tight, the 12-column INSERT is aligned, and the `$effect` once-guard fires exactly once. No BLOCK-level findings.

---

## Finding 1 — Configured cron trigger has no `scheduled()` handler (automated retention silently no-ops)
- **Category:** Correctness / Dead config / Missing edge case (AC8 — prune)
- **Evidence:** `wrangler.jsonc:17-19` declares `"triggers": { "crons": ["0 3 1 * *"] }`, but there is **no `scheduled()` export anywhere** (`grep -rn "scheduled" src/` → NONE; `svelte.config.js` uses `@sveltejs/adapter-cloudflare`, which emits only a `fetch` handler in `.svelte-kit/cloudflare/_worker.js`). `docs/runbooks/snapshot-prune.md:5-11` itself admits "A `scheduled()` handler **can** call `pruneOldSnapshots(...)` once the SvelteKit Cloudflare adapter exposes a scheduled entry point" and `:12-26` documents a manual `wrangler d1 execute` fallback as the actual v1 path.
- **Impact:** Deployed, Cloudflare will fire the monthly cron and invoke a worker that has no scheduled handler → it errors/no-ops every run. Retention does **not** happen automatically; it relies entirely on a human remembering the manual prune. The config gives false confidence that pruning is wired. `pruneOldSnapshots` (snapshot-log.ts:144) is therefore currently unreachable in production — only reached by tests and the (unused) `migrations/prune.sql`.
- **Why non-blocking:** The spec (lines 33-35) explicitly blesses "a documented recurring `wrangler d1 execute` prune … as an acceptable v1 fallback," and the runbook documents it honestly. No data loss or breach. AC8 is satisfied by the unit test on the pure function, not by a live wired cron.
- **Suggested fix:** Either remove `triggers.crons` from `wrangler.jsonc` until a real `scheduled()` entry point exists (avoids monthly error-log noise and false confidence), or add a thin Cloudflare worker `scheduled` handler that calls `pruneOldSnapshots(env.DB, Date.now())`. At minimum, leave the runbook's "primary vs fallback" framing as-is so no one assumes the cron works.

## Finding 2 — Request body fully buffered before the size cap is enforced
- **Category:** Missing edge case / minor DoS (Edge Cases: "Oversized request body → rejected by a size cap")
- **Evidence:** `src/routes/api/snapshot/+server.ts:17-20` — `const raw = await request.text();` reads the **entire** body into memory, then `new TextEncoder().encode(raw).length > MAX_BODY_BYTES` rejects it. The cap is applied after buffering, not before.
- **Impact:** A hostile client can send a body far larger than 4096 bytes (up to the Cloudflare Workers ~100 MB platform request cap) and force it to be buffered+encoded before the 413. Bounded by the platform, so not catastrophic, but the size cap doesn't do what "rejected by a size cap" implies (reject early/cheaply).
- **Suggested fix:** Check `request.headers.get('content-length')` against `MAX_BODY_BYTES` before reading the body, then still keep the post-decode check as a backstop for missing/lying Content-Length.

## Items checked and found correct (no finding)
- **Server recompute / no client-trusted score:** client sends only `{branch, answers}` (`snapshot-client.ts:18`); endpoint recomputes via `buildSnapshotRow` → `scoreSnapshot` (`snapshot-log.ts:99-100`). No score/result/band field is read from the payload. (AC2) ✔
- **SQL injection:** both statements use `prepare().bind()` with placeholders only (`snapshot-log.ts:117-120, 124-140, 150-153`); no string concatenation of any value. ✔
- **INSERT 12-column alignment:** 12 columns, 12 `?`, 12 bound values in matching order (`snapshot-log.ts:118-139`); matches schema column order in `migrations/0001_snapshot_responses.sql:4-15`. ✔
- **Validation completeness:** rejects non-object body, unknown branch, non-object/array answers, unknown questionId, non-integer/out-of-range index, and incomplete sets (`snapshot-log.ts:16-42`). `__proto__`/extra keys are rejected as "unknown question" (byId only holds applicable questions). No forged score can land. ✔
- **`$effect` once-guard:** `logged` gate (`AIReadinessSnapshot.svelte:28-33`) fires exactly once when `result` first becomes non-null; `reset()` clears `logged` (`:35-40`) so Start-over re-completes a fresh row (spec-accepted). Setting `logged=true` then reading it in the same effect cannot loop (guarded). Component test asserts `toHaveBeenCalledTimes(1)` (`AIReadinessSnapshot.test.ts:76-81`). (AC9) ✔
- **Fire-and-forget races:** `postSnapshot` swallows both sync throw and rejected promise (`snapshot-client.ts:14-23`), never awaited by the effect; `keepalive: true` for dialog-close survival. (AC7) ✔
- **Null/undefined guarding:** `platform?.env?.DB` no-ops to 204 when absent (`+server.ts:35-36`); D1 throw is swallowed to 204 (`:44-48`); `deriveDeviceClass(null)`/`deriveSource(null)` default safely (`snapshot-log.ts:46-68`). (AC4, edge cases) ✔
- **Privacy:** schema stores only `created_at` + coarse `device_class`/`source`; UA and Referer are consumed at request time and discarded (`+server.ts:38-42`, `snapshot-log.ts:45-68`). No IP/UA/email/fingerprint columns. (AC6) ✔
- **Dead code:** none introduced beyond the unreachable-in-prod prune path noted in Finding 1 (`prune.sql` + `pruneOldSnapshots` are reachable only via the manual runbook, which is the intended v1 design, not accidental dead code).

---

## Triage of the 6 logged Minors

1. **`BRANCHES` const duplicates the `Branch` union (drift hazard).** — **Ship as-is.** Real but low: a 4th branch requires touching `snapshot-content.ts` (union + INTENT_QUESTION + DIMENSIONS weights) anyway, and an un-added branch simply fails validation (closed-fail, safe). Could derive from a single source later; not merge-blocking.

2. **`snapshotPruneCutoff` month-end overflow untested (e.g. Jan 31 − 1mo).** — **Ship as-is.** For the production `months=24` (a 12-multiple) the target month is identical, so day-overflow can only shift the cutoff by ~1 day in the Feb-29 leap case — negligible for a coarse 24-month retention boundary. Worth a one-line test someday; not blocking.

3. **Two separate imports from `../consulting/scoring` could be merged.** — **Ship as-is (note: location is the *test* file, not `snapshot-log.ts`).** The duplicate is `snapshot-log-db.test.ts:3-4`; `snapshot-log.ts:1` has a single scoring import. Pure style, zero runtime effect.

4. **`fakeD1 throwOnRun` / `insertSnapshot` D1-failure has no dedicated unit test.** — **Ship as-is.** The endpoint test (`server.test.ts:` "degrades gracefully (204, no throw) when D1 throws") exercises the swallow path through the real handler, which is the behavior that matters. A unit-level test on `insertSnapshot` alone would only assert it propagates (it has no internal catch) — redundant.

5. **Insert test only spot-checks one bound value (not all 12).** — **Ship as-is.** `snapshot-log-db.test.ts` asserts `args.toHaveLength(12)`, `sql` matches the INSERT prefix, the SQL does not contain the interpolated `overall`, and `args[0] === row.id`. Combined with the `buildSnapshotRow` field-by-field test, coverage is adequate. Asserting all 12 positions would be nice-to-have, not required.

6. **New `TextEncoder` per request; body buffered before size check.** — **TextEncoder allocation: ship as-is** (negligible; could hoist to module scope). **Body-buffered-before-check: see Finding 2** — recommend the Content-Length pre-check before merge if cheap, but acceptable to ship given the platform body cap. Non-blocking.
