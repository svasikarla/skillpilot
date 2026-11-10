import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchRedditForhire, parseRedditRates } from '@/lib/ingest/reddit-forhire'

function post(over: Record<string, unknown> = {}) {
  return {
    id: 'abc01',
    title: '[Hiring] Build a RAG chatbot over our product docs (Python, LangChain)',
    selftext: 'We need a machine learning engineer to build a retrieval pipeline with embeddings. Budget: $800-1,200. 4-6 weeks.',
    permalink: '/r/forhire/comments/abc01/hiring_build_a_rag_chatbot/',
    created_utc: Math.floor(Date.now() / 1000) - 3600,
    link_flair_text: 'Hiring',
    ...over,
  }
}

function listing(posts: unknown[]) {
  return {
    ok: true,
    json: async () => ({ data: { children: posts.map(p => ({ data: p })) } }),
  } as Response
}

beforeEach(() => {
  delete process.env.REDDIT_CLIENT_ID
  delete process.env.REDDIT_CLIENT_SECRET
})
afterEach(() => vi.unstubAllGlobals())

describe('fetchRedditForhire', () => {
  it('maps [Hiring] AI/ML posts to contract gigs with parsed fixed budgets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(listing([post()])))
    const jobs = await fetchRedditForhire()

    expect(jobs).toHaveLength(1)
    const gig = jobs[0]
    expect(gig.source_id).toBe('reddit-forhire-abc01')
    expect(gig.employment_type).toBe('contract')
    expect(gig.platform).toBe('Reddit r/forhire')
    expect(gig.title).toBe('Build a RAG chatbot over our product docs (Python, LangChain)')
    expect(gig.url).toBe('https://www.reddit.com/r/forhire/comments/abc01/hiring_build_a_rag_chatbot/')
    expect(gig.rate_type).toBe('fixed')
    expect(gig.rate_min).toBe(800)
    expect(gig.rate_max).toBe(1200)
    expect(gig.skills).toContain('RAG Pipelines')
  })

  it('excludes [For Hire] self-promotion and non-AI/ML hiring posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(listing([
      post({ id: 'x1', title: '[For Hire] ML engineer available for LLM work', link_flair_text: 'For Hire' }),
      post({ id: 'x2', title: '[Hiring] Logo designer for bakery brand', selftext: 'Need a logo.', link_flair_text: 'Hiring' }),
    ])))
    expect(await fetchRedditForhire()).toEqual([])
  })

  it('uses the public JSON endpoint when no OAuth creds are configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(listing([]))
    vi.stubGlobal('fetch', fetchMock)
    await fetchRedditForhire()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('https://www.reddit.com/r/forhire/new.json')
  })

  it('exchanges client credentials and calls oauth.reddit.com when creds exist', async () => {
    process.env.REDDIT_CLIENT_ID = 'cid'
    process.env.REDDIT_CLIENT_SECRET = 'csecret'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok123' }) } as Response)
      .mockResolvedValueOnce(listing([post()]))
    vi.stubGlobal('fetch', fetchMock)

    const jobs = await fetchRedditForhire()

    expect(String(fetchMock.mock.calls[0][0])).toBe('https://www.reddit.com/api/v1/access_token')
    expect(String(fetchMock.mock.calls[1][0])).toContain('https://oauth.reddit.com/r/forhire/new')
    const headers = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tok123')
    expect(jobs).toHaveLength(1)
  })

  it('throws on a throttled/non-OK listing response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response))
    await expect(fetchRedditForhire()).rejects.toThrow('Reddit r/forhire fetch failed: 429')
  })
})

describe('parseRedditRates', () => {
  it('parses hourly ranges and single hourly rates', () => {
    expect(parseRedditRates('Paying $40-60/hr for the right person'))
      .toEqual({ rate_min: 40, rate_max: 60, rate_type: 'hourly' })
    expect(parseRedditRates('Rate: $50 per hour'))
      .toEqual({ rate_min: 50, rate_max: 50, rate_type: 'hourly' })
  })

  it('parses fixed budgets in both word orders', () => {
    expect(parseRedditRates('Budget: $1,500 for the whole project'))
      .toEqual({ rate_min: 1500, rate_max: 1500, rate_type: 'fixed' })
    expect(parseRedditRates('Offering $300-500 budget'))
      .toEqual({ rate_min: 300, rate_max: 500, rate_type: 'fixed' })
  })

  it('returns nulls with the hourly default when no rate is stated', () => {
    expect(parseRedditRates('DM me with your portfolio'))
      .toEqual({ rate_min: null, rate_max: null, rate_type: 'hourly' })
  })
})
