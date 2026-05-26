-- Phase 6: Admin — member invites + is_active flag

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role      TEXT DEFAULT 'member' CHECK (role IN ('member','admin')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  invited_by  UUID REFERENCES auth.users(id),
  accepted    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
