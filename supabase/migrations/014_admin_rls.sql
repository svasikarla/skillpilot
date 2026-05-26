-- Phase 9: Admin RLS — admins (profiles.role = 'admin') get full write access

-- Ensure role column exists (idempotent — safe to run even if 011 was applied)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role      TEXT DEFAULT 'member' CHECK (role IN ('member','admin')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  invited_by  UUID REFERENCES auth.users(id),
  accepted    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function: returns true if the current auth user has role = 'admin'
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ── platforms (currently read-only for everyone) ──────────────────────────────
CREATE POLICY "admins can update platforms" ON platforms
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "admins can insert platforms" ON platforms
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admins can delete platforms" ON platforms
  FOR DELETE USING (public.is_admin());

-- ── jobs ─────────────────────────────────────────────────────────────────────
-- Existing policy: members read approved jobs. Admins get full access.
CREATE POLICY "admins can manage jobs" ON jobs
  FOR ALL USING (public.is_admin());

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Existing policy: users manage own profile. Admins can read all (for member mgmt).
CREATE POLICY "admins can read all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins can update any profile" ON profiles
  FOR UPDATE USING (public.is_admin());

-- ── applications ─────────────────────────────────────────────────────────────
-- Existing policy: users manage own applications. Admins can read aggregate data.
CREATE POLICY "admins can read all applications" ON applications
  FOR SELECT USING (public.is_admin());

-- ── invites ──────────────────────────────────────────────────────────────────
CREATE POLICY "admins can manage invites" ON invites
  FOR ALL USING (public.is_admin());

-- ── scam_reports ─────────────────────────────────────────────────────────────
CREATE POLICY "admins can manage scam reports" ON scam_reports
  FOR ALL USING (public.is_admin());

-- ── ingestion_runs ───────────────────────────────────────────────────────────
CREATE POLICY "admins can read ingestion runs" ON ingestion_runs
  FOR SELECT USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
