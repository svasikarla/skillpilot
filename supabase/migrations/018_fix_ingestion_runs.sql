-- 018_fix_ingestion_runs.sql
-- 001_schema.sql created ingestion_runs with the old shape (source_name,
-- jobs_fetched, completed_at, error_msg), so 004's `create table if not exists`
-- silently no-opped and the deployed table never matched what
-- src/lib/ingest/index.ts writes (source, jobs_found, finished_at, error).
-- Every run-log insert has failed silently since. The table holds no rows, so
-- rebuild it with the shape the code expects and restore both RLS policies.

DROP TABLE IF EXISTS ingestion_runs CASCADE;

CREATE TABLE ingestion_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at  timestamptz DEFAULT now(),
  finished_at timestamptz,
  source      text NOT NULL,
  jobs_found  int DEFAULT 0,
  jobs_new    int DEFAULT 0,
  jobs_duped  int DEFAULT 0,
  status      text DEFAULT 'running',   -- running | done | error
  error       text
);

ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages runs" ON ingestion_runs FOR ALL USING (true);
CREATE POLICY "admins can read ingestion runs" ON ingestion_runs
  FOR SELECT USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
