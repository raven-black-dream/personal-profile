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

## Abuse / rate-limiting

**POST /api/snapshot is intentionally unauthenticated** to capture anonymous analytics of portfolio assessment completions. No personally identifiable information (PII) is stored — only coarse-grained device class and anonymized branch/answer aggregate.

**Data-poisoning risk (flooding fake completions to skew calibration):** Low-stakes. The data is anonymous and aggregate; calibration relies on human judgment and aggregate statistical patterns rather than individual row accuracy. A flood of fake responses would dilute signal but not corrupt historical baselines.

**Recommended mitigation:** Enable a Cloudflare rate-limiting rule on the `/api/snapshot` route in the Cloudflare dashboard. Example: 10 requests per minute per IP. Cloudflare's default rate-limiting rules do NOT automatically cover custom routes — you must explicitly enable one, or accept the risk of unbounded POST volume.

**To enable in Cloudflare:**
1. Navigate to your domain → Security → Rate limiting
2. Create a new rule: URI Path matches `/api/snapshot*` AND Method equals `POST`
3. Set threshold (e.g., 10 requests/min) and action (block for N seconds, or challenge)
4. Deploy

If you accept the risk, document the decision in this runbook and in your security posture.
