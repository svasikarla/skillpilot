-- 019_profiles_digest_opt_out.sql
-- The weekly digest (api/cron/weekly-digest) selects profiles.digest_opt_out,
-- but only the retired 001 schema ever defined it — the current profiles table
-- (003/007) never got the column, so the digest query fails against live DBs.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS digest_opt_out BOOLEAN NOT NULL DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
