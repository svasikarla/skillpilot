-- Run this in your Supabase SQL editor: supabase.com > SQL Editor
-- This drops old tables first, then recreates cleanly.

-- ── drop old tables (safe — cascade removes dependent policies too) ────────────
drop table if exists jobs cascade;
drop table if exists profiles cascade;

-- also drop any other old tables from the previous implementation
drop table if exists member_job_matches cascade;
drop table if exists member_skills cascade;
drop table if exists members cascade;
drop table if exists platforms cascade;
drop table if exists learning_resources cascade;
drop table if exists applications cascade;
drop table if exists platform_reviews cascade;
drop table if exists skill_taxonomy cascade;

-- ── profiles ──────────────────────────────────────────────────────────────────
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade unique not null,
  name        text not null default '',
  skills      text[] default '{}',
  hourly_rate int,
  onboarded   boolean default false,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "own profile read"   on profiles for select using (auth.uid() = user_id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on profiles for update using (auth.uid() = user_id);

-- ── jobs ──────────────────────────────────────────────────────────────────────
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  company     text,
  description text,
  platform    text not null,
  url         text,
  skills      text[] default '{}',
  location    text default 'Remote',
  rate_min    int,
  rate_max    int,
  posted_at   timestamptz default now(),
  created_at  timestamptz default now()
);

alter table jobs enable row level security;

create policy "anyone can read jobs" on jobs for select using (true);
create policy "service role can insert" on jobs for insert with check (true);

-- ── reload schema cache so PostgREST picks up the new columns ─────────────────
notify pgrst, 'reload schema';
