-- Phase 5: Platform intelligence — interest tracking + richer guide fields

ALTER TABLE platforms
  ADD COLUMN IF NOT EXISTS setup_guide       TEXT,
  ADD COLUMN IF NOT EXISTS application_guide TEXT,
  ADD COLUMN IF NOT EXISTS rate_min_aiml     NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS rate_max_aiml     NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS payment_model     TEXT,
  ADD COLUMN IF NOT EXISTS has_escrow        BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS member_platform_interests (
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id  UUID REFERENCES platforms(id)  ON DELETE CASCADE,
  interest     TEXT CHECK (interest IN ('have','want','not')),
  profile_url  TEXT,
  PRIMARY KEY (user_id, platform_id)
);

ALTER TABLE member_platform_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY mpi_own ON member_platform_interests
  FOR ALL USING (user_id = auth.uid());
