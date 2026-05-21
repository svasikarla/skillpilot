-- Run AFTER setup-v2.sql in Supabase SQL Editor
-- Adds: skill_ratings to profiles, applications table

-- ── extend profiles with skill ratings ───────────────────────────────────────
-- skill_ratings: { "python": 5, "pytorch": 4, "langchain": 3, ... }
alter table profiles
  add column if not exists skill_ratings jsonb default '{}',
  add column if not exists years_experience int default 0,
  add column if not exists availability_hrs int default 20;   -- hrs/week available

-- ── applications (job tracker) ───────────────────────────────────────────────
create table if not exists applications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  job_id       uuid references jobs(id) not null,
  status       text default 'saved' check (
                 status in ('saved','in_progress','submitted',
                            'interviewing','negotiating','won','lost','no_response','withdrawn')
               ),
  applied_at   timestamptz,
  rate_proposed int,
  rate_agreed   int,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id, job_id)
);

alter table applications enable row level security;

create policy "own applications read"   on applications for select using (auth.uid() = user_id);
create policy "own applications insert" on applications for insert with check (auth.uid() = user_id);
create policy "own applications update" on applications for update using (auth.uid() = user_id);
create policy "own applications delete" on applications for delete using (auth.uid() = user_id);

-- ── proposal_logs (rate limiting) ────────────────────────────────────────────
create table if not exists proposal_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  job_id       uuid references jobs(id),
  generated_at timestamptz default now()
);

alter table proposal_logs enable row level security;
create policy "own proposal logs select" on proposal_logs for select using (auth.uid() = user_id);
create policy "own proposal logs insert" on proposal_logs for insert with check (auth.uid() = user_id);
create policy "own proposal logs delete" on proposal_logs for delete using (auth.uid() = user_id);

-- ── reload schema cache ───────────────────────────────────────────────────────
notify pgrst, 'reload schema';
