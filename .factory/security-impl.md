PASS

# Security impl review — Snapshot Response Logging

Post-implementation review of the actual code: `src/routes/api/snapshot/+server.ts`,
`src/lib/server/snapshot-log.ts`, `src/lib/consulting/snapshot-client.ts`,
`migrations/0001_snapshot_responses.sql`, `docs/runbooks/snapshot-prune.md`, and the
`$effect` in `src/lib/components/consulting/AIReadinessSnapshot.svelte`.

Verdict: **PASS** — every security property the spec-pass asserted holds as implemented.
The one spec-pass WARN (no configured rate limit) is now explicitly addressed by
documentation and accepted as low-stakes, so it no longer warrants a WARN. No new
implementation-introduced risk rises to WARN/BLOCK.

---

## Re-check of spec-pass findings against real code

### Data-poisoning / no rate-limit (spec-pass WARN) — ADDRESSED by documentation
- `docs/runbooks/snapshot-prune.md:28-42` now has an "Abuse / rate-limiting" section that
  (a) states the endpoint is intentionally unauthenticated, (b) characterizes data-poisoning
  as low-stakes (anonymous aggregate, human-judged calibration), and (c) gives concrete
  Cloudflare WAF rate-limiting steps with an explicit "accept the risk and document it"
  fallback. This is exactly the remediation the spec-pass recommended. Residual: no rate-limit
  is enforced *in code* (by design — it's a zone/WAF control), so a scripted client can still
  POST many valid rows. Documented and accepted; non-blocking.

### BOLA / IDOR — PASS (no read surface exists)
- `src/routes/api/snapshot/+server.ts` exports only `POST`. No GET/PUT/DELETE handler, no
  `[id]` route. `find src/routes -path '*snapshot*'` shows only `+server.ts` (and a
  `server.test.ts`) — confirmed no read endpoint anywhere.
- Rows carry a server-generated `crypto.randomUUID()` id (`snapshot-log.ts:103`) and no owner
  column (`migrations/0001_snapshot_responses.sql:3-16`). Nothing is fetchable or mutable
  per-user. Zero IDOR surface.

### Injection — PASS (bound parameters only, verified in code)
- INSERT: `INSERT_SQL` is a fully static string with 12 `?` placeholders
  (`snapshot-log.ts:117-120`); `insertSnapshot` does `.prepare(INSERT_SQL).bind(...).run()`
  (`snapshot-log.ts:123-141`). No interpolation of any field.
- Prune DELETE: `db.prepare('DELETE FROM snapshot_responses WHERE created_at < ?').bind(cutoff)`
  (`snapshot-log.ts:150-153`) — `cutoff` is a locally-computed integer, bound, not interpolated.
- `answers_json` / `dimensions_json` are `JSON.stringify(...)` stored as bound string params
  (`snapshot-log.ts:106,111`), never executed as SQL. Validation
  (`validateSnapshotPayload`, `snapshot-log.ts:15-43`) rejects unknown branches, unknown
  question ids, and non-integer/out-of-range indices, so the JSON cannot smuggle free text.
- Runbook fallback (`snapshot-prune.md:21-23`) interpolates `${CUTOFF}` into a `wrangler d1
  execute --command`, but `CUTOFF` is a locally-computed `Date.getTime()` integer with no user
  input — not an injection vector. This is the intended prod retention job, not a test.

### Auth / abuse — PASS (public write is safe as built)
- Endpoint is intentionally unauthenticated. An anonymous caller can do exactly one thing:
  insert one row whose score fields are **server-recomputed** via `buildSnapshotRow` →
  `scoreSnapshot` (`snapshot-log.ts:99-115`) — `overall/band_id/gate/cap_reason/dimensions`
  never come from the client; only `branch` and `answers` (validated) are caller-supplied.
- Validation runs **before** any DB access (`+server.ts:29-32`), so malformed payloads return
  400 and write no row.
- Body size capped at 4096 bytes (`+server.ts:11-20`) → 413 on oversized.
- D1 errors are swallowed (`+server.ts:44-48`); the catch block is empty, so no stack trace or
  D1 error detail reaches the client (always `204 No Content`). Missing binding no-ops to 204
  (`+server.ts:35-36`). No info leak.
- Validation 400 bodies echo only the caller's own input (e.g. `unknown question: <qid>`) as
  JSON, not HTML — no XSS, no server-state leak.

### Privacy / PII — PASS (no IP, no full UA, no full Referer, no PII)
- Stored columns (`migrations/0001_snapshot_responses.sql:3-16`): `id, created_at,
  rubric_version, branch, answers_json, overall, band_id, gate, cap_reason, dimensions_json,
  source, device_class`. No IP, no User-Agent, no Referer, no email/name/fingerprint, no cookies.
- `deriveDeviceClass` (`snapshot-log.ts:46-49`) reads the UA only to bucket mobile/desktop; the
  UA string is never stored. `deriveSource` (`snapshot-log.ts:56-68`) parses the Referer only to
  emit the coarse `deeplink|organic` bucket — the full referer/path is discarded.
- `answers_json` is bounded to known questionIds and in-range option indices by validation, so
  it cannot carry PII free-text. Re-identification from `created_at` + coarse buckets is negligible.

---

## Implementation-introduced details the spec-pass could not see — all benign

- **Effect-refire guard** (`AIReadinessSnapshot.svelte:28-33`): `logged` state gates the POST so
  exactly one fire per completed result; `reset()` (line 35-40) clears it, so "Start over" +
  re-complete logs a new row — matches spec AC-9 / edge-case intent. No duplicate-flood bug.
- **Client `keepalive: true`** (`snapshot-client.ts:18`): lets the fire-and-forget POST survive a
  fast dialog close. Body is `{ branch, answers }` only — no client-computed score sent, so the
  server-recompute trust boundary is intact. Double-swallowed (`.catch(() => {}}` + outer
  try/catch), so a logging failure can never affect render.
- **Body read before size check** (`+server.ts:17-18`): `await request.text()` buffers the whole
  body before measuring. Same nit the spec-pass noted; bounded by Cloudflare platform limits,
  low risk. Optional hardening: short-circuit on a `Content-Length` header > MAX_BODY_BYTES.
  Non-blocking.

## Spec-pass coverage summary
No-read-endpoint (held), public-write-is-poisoning-not-theft (held + now documented in runbook),
bound-parameters (held), no-IP/no-full-UA/no-full-Referer (held), no edge secrets (held),
server-recompute trust boundary (held). No BLOCK conditions (breach / data loss / PII exposure)
present.
