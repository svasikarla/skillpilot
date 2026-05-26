-- Phase 7: Semantic embeddings for job-profile matching
-- Uses pgvector (384-dim from all-MiniLM-L6-v2 local model)

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS embedding vector(384);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS embedding vector(384);

-- HNSW indexes for fast approximate cosine similarity search
CREATE INDEX IF NOT EXISTS jobs_embedding_hnsw_idx
  ON jobs USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_embedding_hnsw_idx
  ON profiles USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;
