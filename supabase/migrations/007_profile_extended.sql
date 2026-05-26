-- Phase 1: Extend profiles table with full PRD fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS years_experience  INT,
  ADD COLUMN IF NOT EXISTS work_preference   TEXT CHECK (work_preference IN ('short_project','long_contract','retainer','any')),
  ADD COLUMN IF NOT EXISTS timezone          TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS hours_per_week    INT,
  ADD COLUMN IF NOT EXISTS min_budget        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS about             TEXT,
  ADD COLUMN IF NOT EXISTS portfolio         JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS platform_accounts JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS learning_skills   TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learned_skills    TEXT[] DEFAULT '{}';

-- portfolio item schema: {name: string, description: string, stack: string[], result: string}
-- platform_accounts schema: {platform_id: string, interest: 'have'|'want'|'not', profile_url?: string}
