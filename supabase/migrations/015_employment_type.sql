-- 015_employment_type.sql
-- Adds employment_type to jobs so freelance/contract listings can be distinguished
-- from full-time roles. Backfills existing rows using description/title heuristics.

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS employment_type text
    NOT NULL DEFAULT 'unknown'
    CHECK (employment_type IN ('contract', 'full_time', 'unknown'));

CREATE INDEX IF NOT EXISTS jobs_employment_type_idx
  ON jobs (employment_type, posted_at DESC);

-- Backfill: anything that smells like contract/freelance/hourly work → 'contract'.
-- Anything explicitly full-time/salaried → 'full_time'. Everything else stays 'unknown'.
UPDATE jobs
SET employment_type = 'contract'
WHERE employment_type = 'unknown'
  AND (
       title       ~* '\m(contract|contractor|freelance|consultant|c2c|1099)\M'
    OR description ~* '\m(contract role|contract position|contract-to-hire|freelance|freelancer|hourly rate|/\s*hr\M|/\s*hour\M|per hour|1099|c2c|corp[- ]to[- ]corp|project[- ]based|short[- ]term engagement|fixed[- ]term)\M'
  );

UPDATE jobs
SET employment_type = 'full_time'
WHERE employment_type = 'unknown'
  AND (
       title       ~* '\m(full[- ]time|permanent|FTE)\M'
    OR description ~* '\m(full[- ]time|permanent position|permanent role|salaried|annual salary|equity|stock options|401\(k\)|health insurance|paid time off|PTO\M)\M'
  );

NOTIFY pgrst, 'reload schema';
