-- Phase 4: Stand Out Coach — rate benchmarks table
CREATE TABLE IF NOT EXISTS rate_benchmarks (
  id           SERIAL PRIMARY KEY,
  platform     TEXT NOT NULL,
  skill_cluster TEXT,
  rate_p25     NUMERIC(8,2),
  rate_median  NUMERIC(8,2),
  rate_p75     NUMERIC(8,2),
  source       TEXT,
  as_of        DATE
);

-- Seed with PRD Section 8.2 data
INSERT INTO rate_benchmarks (platform, skill_cluster, rate_p25, rate_median, rate_p75, source, as_of) VALUES
  ('Upwork',     'AI/ML General',    45,  55,  95,  'Upwork Freelance Economy Report 2024', '2024-01-01'),
  ('Toptal',     'AI/ML General',    110, 140, 180, 'Toptal Published Rate Data 2024',      '2024-01-01'),
  ('Contra',     'AI/ML General',    60,  90,  140, 'Contra Rate Survey 2024',              '2024-01-01'),
  ('Braintrust', 'AI/ML General',    80,  120, 175, 'Braintrust Rate Data 2024',            '2024-01-01'),
  ('Mercor',     'AI/ML General',    30,  60,  110, 'Mercor Platform Data 2024',            '2024-01-01'),
  ('Outlier',    'LLM Evaluation',   15,  30,  50,  'Outlier/Scale AI Rate Data 2024',      '2024-01-01')
ON CONFLICT DO NOTHING;
