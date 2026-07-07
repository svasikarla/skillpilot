-- 017_project_work.sql
-- Freelance/project marketplaces post fixed-budget projects, not just hourly
-- roles. rate_type says how to read rate_min/rate_max: 'hourly' → $/hr,
-- 'fixed' → total project budget in USD. duration captures stated engagement
-- length ("3 months", "short-term") when a source provides it.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS rate_type text
    NOT NULL DEFAULT 'hourly'
    CHECK (rate_type IN ('hourly', 'fixed')),
  ADD COLUMN IF NOT EXISTS duration text;

NOTIFY pgrst, 'reload schema';
