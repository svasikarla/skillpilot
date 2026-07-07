import { describe, it, expect } from 'vitest'
import { isAiMlJob } from '@/lib/ingest/types'

describe('isAiMlJob precision', () => {
  it('accepts a single keyword when it appears in the title', () => {
    expect(isAiMlJob('Machine Learning Engineer', 'We build widgets.', [])).toBe(true)
  })

  it('accepts a single keyword when it appears in tags', () => {
    expect(isAiMlJob('Backend Engineer', 'Ship APIs.', ['pytorch'])).toBe(true)
  })

  it('rejects a single keyword buried in description boilerplate', () => {
    expect(isAiMlJob(
      'Corporate Travel Consultant',
      'Our company uses machine learning to optimise itineraries. You will book travel for executives.',
      [],
    )).toBe(false)
  })

  it('accepts descriptions with two distinct AI/ML terms (HN comments have no title)', () => {
    expect(isAiMlJob(
      '',
      'Need help building a RAG pipeline with embeddings over our product docs.',
      [],
    )).toBe(true)
  })

  it('does not substring-match: storage is not RAG, scv is not cv engineer', () => {
    expect(isAiMlJob('Cloud Storage Engineer', 'Manage storage and backups for gigabytes of data.', [])).toBe(false)
  })

  it('matches hyphen-adjacent terms like gpt-4', () => {
    expect(isAiMlJob('GPT-4 Integration Developer', '', [])).toBe(true)
  })
})
