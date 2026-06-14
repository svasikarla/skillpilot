-- Track when each job was last observed in a source feed.
-- Enables: (1) archiving jobs that disappear from sources (filled/closed), and
-- (2) a recency cutoff in the feed query. Existing rows default to NOW(), so the
-- first ingest after this migration won't archive anything — jobs only become
-- stale once they go unseen for STALE_AFTER_DAYS (see src/lib/job-freshness.ts).

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS jobs_last_seen_idx ON jobs (status, last_seen_at);
