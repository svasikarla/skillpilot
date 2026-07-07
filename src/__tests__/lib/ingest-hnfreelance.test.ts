import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchHNFreelance } from '@/lib/ingest/hnfreelance'

const storyHit = { objectID: '40001', title: 'Ask HN: Freelancer? Seeking freelancer? (July 2026)', created_at: '2026-07-01T15:00:00.000Z' }

const seekingFreelancerAi = {
  objectID: '40100',
  created_at: '2026-07-02T10:00:00.000Z',
  comment_text: 'SEEKING FREELANCER | Remote | Need an engineer to build a RAG pipeline with embeddings over product docs. Python, LangChain. 6-8 week project, milestone payments.',
}

const seekingWork = {
  objectID: '40101',
  created_at: '2026-07-02T11:00:00.000Z',
  comment_text: 'SEEKING WORK | Remote | ML engineer with 8 years of experience in PyTorch and LLM fine-tuning.',
}

const seekingFreelancerNonAi = {
  objectID: '40102',
  created_at: '2026-07-02T12:00:00.000Z',
  comment_text: 'SEEKING FREELANCER | Remote | WordPress site redesign for a restaurant.',
}

function mockAlgolia() {
  return vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ hits: [storyHit] }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ hits: [seekingFreelancerAi, seekingWork, seekingFreelancerNonAi] }) } as Response)
}

beforeEach(() => vi.stubGlobal('fetch', mockAlgolia()))
afterEach(() => vi.unstubAllGlobals())

describe('fetchHNFreelance', () => {
  it('keeps only AI/ML SEEKING FREELANCER comments as contract gigs', async () => {
    const jobs = await fetchHNFreelance()

    expect(jobs).toHaveLength(1)
    const gig = jobs[0]
    expect(gig.source_id).toBe('hnfreelance-40100')
    expect(gig.employment_type).toBe('contract')
    expect(gig.platform).toBe('HN Freelance Thread')
    expect(gig.location).toBe('Remote')
    expect(gig.url).toBe('https://news.ycombinator.com/item?id=40100')
    expect(gig.title).toContain('RAG pipeline')
  })

  it('excludes SEEKING WORK self-promotion comments', async () => {
    const jobs = await fetchHNFreelance()
    expect(jobs.find(j => j.source_id === 'hnfreelance-40101')).toBeUndefined()
  })

  it('returns empty when no monthly thread is found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hits: [] }) } as Response))
    expect(await fetchHNFreelance()).toEqual([])
  })
})
