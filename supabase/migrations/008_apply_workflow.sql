-- Phase 3: Application workflow — checklist state + scam reports

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS checklist_state  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS days_to_response INT;

CREATE TABLE IF NOT EXISTS scam_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved    BOOLEAN DEFAULT FALSE
);

ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY scam_insert ON scam_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY scam_own_select ON scam_reports
  FOR SELECT USING (user_id = auth.uid());

-- Admin can see all reports
CREATE POLICY scam_admin_all ON scam_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );
