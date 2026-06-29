WARN

# Security spec review — Snapshot Response Logging

Pre-implementation review of `docs/superpowers/specs/2026-06-29-snapshot-response-logging-design.md`
and plan `docs/superpowers/plans/2026-06-29-snapshot-response-logging.{json,md}`.

Verdict: **WARN** — no blocking issues. Core security properties (no IDOR surface, bound
parameters everywhere, no PII persisted, no auth bypass beyond the intentionally-public write)
all hold. Two real-but-non-blocking hardening gaps and one nit are noted below.

---

## BOLA / IDOR — PASS

- Only `POST` is authored (`src/routes/api/snapshot/+server.ts`, plan Task 7). No GET/PUT/DELETE
  handler, no read endpoint, no `[id]` route. Verified against the plan self-review and task list.
- No user-owned records exist: every row is anonymous with a server-generated UUID and no owner
  column. There is nothing to fetch or mutate per-user, so there is no IDOR surface. The spec's
  write-only claim holds in the plan.

## Auth bypass — PASS (public write is safe here)

- The endpoint is intentionally unauthenticated. Assessed: an anonymous caller can do exactly one
  thing — insert one anonymous analytics row whose score fields are **server-recomputed**
  (`buildSnapshotRow` → `scoreSnapshot`, plan Task 4), never client-supplied. No secrets at the
  edge (D1 is a binding, not a credential). No privileged operation, state change affecting a user,
  or readable data is reachable. Public access is acceptable for what this does.
- CSRF is not meaningfully exploitable: there is no authenticated victim or user-owned state to
  forge against. The `application/json` content type also sits outside SvelteKit's form-based CSRF
  check, but that is fine given nothing sensitive is protected. Note the spec lists a "same-origin
  expectation" as a mitigation that is **not implemented in code** — acceptable, but it is
  aspirational, not enforced.

## Injection (SQL/command/template) — PASS

- INSERT (`insertSnapshot`, plan Task 4): static `INSERT_SQL` string with `.prepare().bind(...)`
  on all 12 columns. No interpolation. TC-10 explicitly asserts the SQL contains no interpolated
  values.
- Prune DELETE (`pruneOldSnapshots`, Task 4): `prepare('DELETE FROM snapshot_responses WHERE
  created_at < ?').bind(cutoff)` — bound integer parameter. Good.
- `answers_json` is `JSON.stringify(answers)` stored as a **bound** string param, never executed;
  and validation (Task 3) rejects any unknown question id and any non-integer/out-of-range index,
  so the JSON cannot carry attacker-controlled free text. `dimensions_json` is server-computed.
  No template/command injection vectors in app code.

## Data-poisoning / abuse — WARN (non-blocking)

- Strengths: strict shape/range validation + complete-set check (Task 3), authoritative server
  recompute (no arbitrary `overall`/`band_id` can land), 4096-byte body cap (Task 7), 400 on
  malformed. These mean only well-formed, in-rubric submissions persist.
- **Gap:** the spec's stated abuse mitigation is "Cloudflare default rate/bot protection," but
  nothing in the plan configures or verifies a rate limit, and a Cloudflare zone's *defaults* do
  not include per-IP rate limiting. A scripted client can still POST many valid-but-fake rows to
  skew answer distributions. The spec explicitly accepts this as low-stakes (anonymous aggregate,
  human-judged calibration), so this is **not blocking**.
  - Recommendation: either confirm a Cloudflare WAF rate-limiting rule is actually enabled on the
    zone (and note it in the runbook), or accept the risk explicitly in the prune/runbook doc so
    the "Cloudflare default" claim isn't mistaken for a configured control. `rubric_version`
    segmentation already limits blast radius across rubric changes.

## Privacy / PII — PASS

- Stored columns (migration Task 6): `id, created_at, rubric_version, branch, answers_json,
  overall, band_id, gate, cap_reason, dimensions_json, source, device_class`. No IP, no full
  User-Agent, no email/name/fingerprint, no cookies.
- `device_class` is derived from UA then the UA is discarded; `source` is derived from Referer then
  only the coarse `deeplink|organic` bucket is kept (the full referer/path is never stored).
- Key protection that holds: because validation rejects unknown question ids and non-integer
  indices, `answers_json` cannot be used to smuggle PII free-text. Re-identification risk from
  `created_at` + coarse `device_class`/`source` is negligible for anonymous aggregate use.

## Additional notes (nits, non-blocking)

- **Body read before size check** (Task 7): `await request.text()` buffers the entire body, then
  measures it. The 4096 cap correctly rejects oversized payloads, but a very large body is read
  into memory before rejection. Low risk behind Cloudflare's platform limits; optional hardening:
  short-circuit on a `Content-Length` header that already exceeds `MAX_BODY_BYTES` before reading.
- **Prune fallback runbook** (Task 10): `wrangler d1 execute --remote --command "DELETE ... < ${CUTOFF}"`
  interpolates `CUTOFF`, but it is a locally-computed `Date.getTime()` integer with no user input —
  not an injection vector. This is the intended prod retention job (the no-prod-**test** rule does
  not apply). Runbook already cautions to confirm binding/cutoff first. Fine.
- Validation error responses echo the offending question id in a JSON body (e.g. `unknown question:
  <qid>`) — reflects only the caller's own input, JSON (not HTML), no XSS or info leak. Fine.

## Spec "Security Considerations" coverage — all addressed

No-read-endpoint (held), public-write-is-poisoning-not-theft (held, see WARN), bound-parameters
(held), no-IP/no-full-UA (held), no edge secrets (held).
