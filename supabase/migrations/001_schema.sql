-- ─────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─────────────────────────────────────────────
-- MEMBERS
-- ─────────────────────────────────────────────
CREATE TABLE members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  timezone            TEXT DEFAULT 'UTC',
  target_hourly_rate  NUMERIC(8,2),
  min_project_budget  NUMERIC(10,2),
  hours_per_week      INT,
  years_experience    INT,
  work_preference     TEXT CHECK (work_preference IN ('short_project','long_contract','retainer','any')),
  about               TEXT,
  github_url          TEXT,
  portfolio           JSONB DEFAULT '[]',
  profile_embedding   VECTOR(512),
  digest_opt_out      BOOLEAN DEFAULT FALSE,
  privacy_agreed_at   TIMESTAMPTZ,
  role                TEXT DEFAULT 'member' CHECK (role IN ('member','admin')),
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  last_active_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- SKILLS TAXONOMY
-- ─────────────────────────────────────────────
CREATE TABLE skills (
  id        SERIAL PRIMARY KEY,
  name      TEXT UNIQUE NOT NULL,
  cluster   TEXT NOT NULL,
  embedding VECTOR(512)
);

CREATE TABLE skill_aliases (
  alias     TEXT PRIMARY KEY,
  skill_id  INT REFERENCES skills(id)
);

CREATE TABLE member_skills (
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  skill_id    INT REFERENCES skills(id),
  self_rating INT CHECK (self_rating BETWEEN 1 AND 5),
  is_verified BOOLEAN DEFAULT FALSE,
  proof_text  TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','learning','planned')),
  PRIMARY KEY (member_id, skill_id)
);

-- ─────────────────────────────────────────────
-- PLATFORMS
-- ─────────────────────────────────────────────
CREATE TABLE platforms (
  id                  SERIAL PRIMARY KEY,
  name                TEXT UNIQUE NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  url                 TEXT NOT NULL,
  platform_type       TEXT,
  trust_tier          INT CHECK (trust_tier BETWEEN 1 AND 4),
  trust_score         INT CHECK (trust_score BETWEEN 0 AND 100),
  rate_min_aiml       NUMERIC(8,2),
  rate_max_aiml       NUMERIC(8,2),
  payment_model       TEXT,
  has_escrow          BOOLEAN,
  has_id_verification BOOLEAN,
  typical_time_to_pay TEXT,
  setup_guide         TEXT,
  application_guide   TEXT,
  platform_tips       TEXT,
  red_flags           TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_platform_accounts (
  member_id           UUID REFERENCES members(id) ON DELETE CASCADE,
  platform_id         INT REFERENCES platforms(id),
  has_account         BOOLEAN DEFAULT FALSE,
  profile_url         TEXT,
  profile_completeness INT CHECK (profile_completeness BETWEEN 0 AND 100),
  interest_level      TEXT CHECK (interest_level IN ('have_account','want_to_try','not_interested')),
  PRIMARY KEY (member_id, platform_id)
);

CREATE TABLE platform_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id INT REFERENCES platforms(id),
  member_id   UUID REFERENCES members(id),
  review_text TEXT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────
CREATE TABLE jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id         INT REFERENCES platforms(id),
  source_job_id       TEXT,
  source_url          TEXT NOT NULL,
  title               TEXT NOT NULL,
  company             TEXT,
  description         TEXT,
  description_excerpt TEXT,
  rate_min            NUMERIC(8,2),
  rate_max            NUMERIC(8,2),
  rate_type           TEXT CHECK (rate_type IN ('hourly','fixed','monthly','undisclosed')),
  job_type            TEXT CHECK (job_type IN ('contract','freelance','part_time','full_time','gig','competition')),
  is_remote           BOOLEAN DEFAULT TRUE,
  location            TEXT,
  posted_at           TIMESTAMPTZ,
  ingested_at         TIMESTAMPTZ DEFAULT NOW(),
  status              TEXT DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','archived')),
  reliability_score   INT,
  reliability_signals JSONB,
  extracted_skills    TEXT[],
  job_embedding       VECTOR(512),
  dedup_hash          TEXT UNIQUE,
  application_count   INT,
  UNIQUE (platform_id, source_job_id)
);

CREATE INDEX idx_jobs_status    ON jobs(status);
CREATE INDEX idx_jobs_posted    ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_embedding ON jobs USING hnsw (job_embedding vector_cosine_ops)
  WITH (m = 8, ef_construction = 32);
CREATE INDEX idx_jobs_skills    ON jobs USING GIN(extracted_skills);
CREATE INDEX idx_jobs_fts       ON jobs USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- ─────────────────────────────────────────────
-- MATCHING
-- ─────────────────────────────────────────────
CREATE TABLE member_job_matches (
  member_id       UUID REFERENCES members(id) ON DELETE CASCADE,
  job_id          UUID REFERENCES jobs(id) ON DELETE CASCADE,
  match_score     NUMERIC(5,2),
  skill_score     NUMERIC(5,2),
  semantic_score  NUMERIC(5,2),
  rate_score      NUMERIC(5,2),
  exp_score       NUMERIC(5,2),
  avail_score     NUMERIC(5,2),
  missing_skills  TEXT[],
  matched_skills  TEXT[],
  is_near_miss    BOOLEAN DEFAULT FALSE,
  computed_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (member_id, job_id)
);

-- ─────────────────────────────────────────────
-- APPLICATION TRACKING
-- ─────────────────────────────────────────────
CREATE TABLE applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID REFERENCES members(id) ON DELETE CASCADE,
  job_id            UUID REFERENCES jobs(id),
  platform_id       INT REFERENCES platforms(id),
  status            TEXT DEFAULT 'saved'
                      CHECK (status IN ('saved','in_progress','submitted','interviewing',
                                        'negotiating','won','lost','no_response','withdrawn')),
  applied_at        TIMESTAMPTZ,
  rate_proposed     NUMERIC(8,2),
  rate_agreed       NUMERIC(8,2),
  days_to_response  INT,
  notes             TEXT,
  checklist_state   JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROPOSALS
-- ─────────────────────────────────────────────
CREATE TABLE proposal_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID REFERENCES members(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id),
  platform_id   INT REFERENCES platforms(id),
  generated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- LEARNING RESOURCES
-- ─────────────────────────────────────────────
CREATE TABLE learning_resources (
  id            SERIAL PRIMARY KEY,
  skill_id      INT REFERENCES skills(id),
  title         TEXT NOT NULL,
  provider      TEXT,
  url           TEXT NOT NULL,
  cost          TEXT DEFAULT 'free' CHECK (cost IN ('free','paid')),
  est_hours     NUMERIC(4,1),
  format        TEXT,
  quality_score INT DEFAULT 80
);

-- ─────────────────────────────────────────────
-- RATE BENCHMARKS
-- ─────────────────────────────────────────────
CREATE TABLE rate_benchmarks (
  id            SERIAL PRIMARY KEY,
  platform_id   INT REFERENCES platforms(id),
  skill_cluster TEXT,
  p25           NUMERIC(8,2),
  p50           NUMERIC(8,2),
  p75           NUMERIC(8,2),
  source        TEXT,
  as_of_date    TEXT
);

-- ─────────────────────────────────────────────
-- SYSTEM
-- ─────────────────────────────────────────────
CREATE TABLE ingestion_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name   TEXT NOT NULL,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  jobs_fetched  INT DEFAULT 0,
  jobs_new      INT DEFAULT 0,
  jobs_duped    INT DEFAULT 0,
  status        TEXT CHECK (status IN ('running','success','error')),
  error_msg     TEXT
);

CREATE TABLE scam_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES jobs(id),
  reported_by   UUID REFERENCES members(id),
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved      BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE members                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_job_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_reviews         ENABLE ROW LEVEL SECURITY;

-- Members see their own data only
CREATE POLICY member_own            ON members             FOR ALL     USING (id = auth.uid());
CREATE POLICY member_own_skills     ON member_skills       FOR ALL     USING (member_id = auth.uid());
CREATE POLICY member_own_platforms  ON member_platform_accounts FOR ALL USING (member_id = auth.uid());
CREATE POLICY member_own_matches    ON member_job_matches  FOR SELECT  USING (member_id = auth.uid());
CREATE POLICY member_own_apps       ON applications        FOR ALL     USING (member_id = auth.uid());
CREATE POLICY member_own_proposals  ON proposal_logs       FOR ALL     USING (member_id = auth.uid());

-- Approved jobs visible to all active members
CREATE POLICY approved_jobs         ON jobs                FOR SELECT  USING (status = 'approved');

-- Platforms and skills readable by all members
CREATE POLICY platforms_readable    ON platforms           FOR SELECT  USING (true);
CREATE POLICY skills_readable       ON skills              FOR SELECT  USING (true);
CREATE POLICY learning_readable     ON learning_resources  FOR SELECT  USING (true);

-- Platform reviews readable by all, writable by owner
CREATE POLICY reviews_readable      ON platform_reviews    FOR SELECT  USING (true);
CREATE POLICY reviews_own           ON platform_reviews    FOR INSERT  WITH CHECK (member_id = auth.uid());

-- Admin bypass policies
CREATE POLICY admin_all_members     ON members             FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY admin_all_jobs        ON jobs                FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role = 'admin'));
