-- Retention prune: delete snapshot responses older than 24 months.
-- Pass the cutoff (epoch ms) computed for "now minus 24 calendar months".
-- Example invocation is in docs/runbooks/snapshot-prune.md.
DELETE FROM snapshot_responses WHERE created_at < :cutoff_ms;
