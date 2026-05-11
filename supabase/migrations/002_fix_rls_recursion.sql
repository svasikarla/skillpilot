-- Fix: infinite recursion in admin RLS policies
-- The original admin_all_members policy queried the members table from inside
-- a members policy, causing PostgreSQL to recurse infinitely.
-- Solution: security definer function that bypasses RLS for the admin check.

-- Drop the recursive policies
DROP POLICY IF EXISTS admin_all_members ON members;
DROP POLICY IF EXISTS admin_all_jobs    ON jobs;

-- Helper function: runs as postgres (service role), bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM members WHERE id = auth.uid() LIMIT 1),
    FALSE
  )
$$;

-- Recreate admin policies using the non-recursive function
CREATE POLICY admin_all_members ON members FOR ALL
  USING (public.is_admin());

CREATE POLICY admin_all_jobs ON jobs FOR ALL
  USING (public.is_admin());
