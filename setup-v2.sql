-- Run AFTER setup.sql in Supabase SQL Editor
-- Adds reliability scoring, job status, source tracking, platforms, and ingestion logs

-- ── extend jobs table ─────────────────────────────────────────────────────────
alter table jobs
  add column if not exists reliability_score int default 50,
  add column if not exists reliability_flags text[] default '{}',
  add column if not exists status text default 'approved',   -- pending | approved | rejected
  add column if not exists source text default 'seed';       -- remotive | remoteok | himalayas | seed

-- index for feed queries
create index if not exists jobs_status_score_idx on jobs (status, reliability_score desc, posted_at desc);

-- ── platforms ─────────────────────────────────────────────────────────────────
create table if not exists platforms (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  tier        int not null default 2,          -- 1=elite, 2=strong, 3=emerging, 4=risky
  trust_score int not null default 50,         -- 0-100
  description text,
  guide_md    text,                            -- full markdown guide
  tips        text[],
  red_flags   text[],
  website     text,
  created_at  timestamptz default now()
);

alter table platforms enable row level security;
create policy "anyone can read platforms" on platforms for select using (true);
create policy "service role manages platforms" on platforms for all using (true);

-- seed core platforms
insert into platforms (slug, name, tier, trust_score, description, tips, red_flags, website) values
  ('upwork',     'Upwork',     1, 88, 'Largest freelance marketplace. High volume, competitive. Escrow payment.', array['Complete your profile to 100% before bidding','Use Connects wisely — target mid-size jobs first','Always use Upwork contracts, never go off-platform'], array['Clients asking to pay outside Upwork','Requests for "test tasks" without pay','Job posts with no budget or "negotiate later"'], 'https://upwork.com'),
  ('toptal',     'Toptal',     1, 95, 'Top 3% network. Rigorous vetting but premium rates ($100-200/hr typical). Long-term engagements.', array['Prepare for 3-stage technical screening','Have a strong portfolio of complex work','Apply only if you have 3+ years senior experience'], array['Impersonators — always verify toptal.com domain','Unsolicited "Toptal recruiter" emails'], 'https://toptal.com'),
  ('contra',     'Contra',     1, 85, 'No-fee freelance platform for independent professionals. Strong for AI/ML product work.', array['Build your Contra portfolio with case studies','Use their invoice tool — no fees on payments','Good for recurring project work'], array['Less volume than Upwork — may need patience'], 'https://contra.com'),
  ('braintrust', 'Braintrust', 1, 90, 'Talent-owned network. No client fees. Strong AI/ML and engineering demand.', array['Apply via referral for faster review','Rates are typically $80-150/hr for AI/ML','Long-term contracts preferred'], array['Longer application process — be patient'], 'https://braintrust.dev'),
  ('gun-io',     'Gun.io',     2, 82, 'Curated network for senior engineers. Vetted clients, good AI/ML demand.', array['Must pass technical assessment','Focus on Python/ML skills in profile'], array['Limited volume — check weekly'], 'https://gun.io'),
  ('freelancer', 'Freelancer', 2, 65, 'High volume, competitive, mixed quality. Good for smaller AI/ML tasks.', array['Filter to Fixed Price jobs for clearer scope','Milestone payments reduce risk','Read client reviews carefully'], array['"Pay to bid" schemes','Clients with 0 reviews asking for large projects','Requests to communicate on Telegram/WhatsApp'], 'https://freelancer.com'),
  ('remotive',   'Remotive',   2, 78, 'Curated remote job board. Good for full-time and long-term contract AI/ML roles.', array['Jobs are pre-vetted by Remotive team','Good signal-to-noise ratio'], array['Some listings are old — check posted date'], 'https://remotive.com'),
  ('remoteok',   'RemoteOK',   2, 72, 'Remote job aggregator. Large volume, mixed curation. Strong tech listings.', array['Filter by "Machine Learning" or "AI" tags','Salary often listed — filter by rate'], array['Duplicate listings common','Some listings link to broken application pages'], 'https://remoteok.com'),
  ('himalayas',  'Himalayas',  2, 80, 'Modern remote job board. Clean UX, good AI/ML category coverage.', array['Apply directly — no intermediary','Good for startup and growth-stage companies'], array['Newer platform — lower volume than Upwork'], 'https://himalayas.app'),
  ('turing',     'Turing',     2, 76, 'AI-powered vetting. Long-term US-company contracts. Good rates for senior ML.', array['Technical assessment required','Good for full-time equivalent remote contracts'], array['Revenue share model — read contract carefully'], 'https://turing.com')
on conflict (slug) do nothing;

-- ── ingestion_runs ────────────────────────────────────────────────────────────
create table if not exists ingestion_runs (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz default now(),
  finished_at timestamptz,
  source      text not null,
  jobs_found  int default 0,
  jobs_new    int default 0,
  jobs_duped  int default 0,
  status      text default 'running',   -- running | done | error
  error       text
);

alter table ingestion_runs enable row level security;
create policy "service role manages runs" on ingestion_runs for all using (true);

-- ── reload schema cache ───────────────────────────────────────────────────────
notify pgrst, 'reload schema';
