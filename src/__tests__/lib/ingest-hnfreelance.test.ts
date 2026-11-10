import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchHNFreelance } from '@/lib/ingest/hnfreelance'

// Dates are relative to now: the adapter rejects threads older than 40 days,
// so hardcoded dates would make this suite start failing with the calendar.
const daysAgoISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const storyHit = { objectID: '40001', title: 'Ask HN: Freelancer? Seeking freelancer?', created_at: daysAgoISO(5) }

const seekingFreelancerAi = {
  objectID: '40100',
  created_at: daysAgoISO(4),
  comment_text: 'SEEKING FREELANCER | Remote | Need an engineer to build a RAG pipeline with embeddings over product docs. Python, LangChain. 6-8 week project, milestone payments.',
}

const seekingWork = {
  objectID: '40101',
  created_at: daysAgoISO(4),
  comment_text: 'SEEKING WORK | Remote | ML engineer with 8 years of experience in PyTorch and LLM fine-tuning.',
}

const seekingFreelancerNonAi = {
  objectID: '40102',
  created_at: daysAgoISO(3),
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

  it('ignores unrelated whoishiring threads (e.g. Who is hiring?)', async () => {
    const unrelated = { objectID: '50000', title: 'Ask HN: Who is hiring?', created_at: daysAgoISO(5) }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hits: [unrelated] }) } as Response))
    expect(await fetchHNFreelance()).toEqual([])
  })

  it('skips stale threads — HN paused the freelancer thread after October 2025', async () => {
    const stale = { ...storyHit, title: 'Ask HN: Freelancer? Seeking freelancer? (October 2025)', created_at: daysAgoISO(120) }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hits: [stale] }) } as Response))
    expect(await fetchHNFreelance()).toEqual([])
  })
})
