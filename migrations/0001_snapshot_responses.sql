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
CREATE INDEX IF NOT EXISTS idx_snapshot_responses_created_at ON snapshot_responses (created_at);
