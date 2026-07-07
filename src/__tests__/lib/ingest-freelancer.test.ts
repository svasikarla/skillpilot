import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchFreelancer } from '@/lib/ingest/freelancer'

function apiResponse(projects: unknown[]) {
  return {
    ok: true,
    json: async () => ({ status: 'success', result: { projects } }),
  } as Response
}

const fixedProject = {
  id: 111,
  title: 'Fine-tune an LLM on our support tickets',
  seo_url: 'machine-learning/fine-tune-llm',
  preview_description: 'Fine-tune a large language model…',
  description: 'We need a machine learning engineer to fine-tune an open-source LLM on 50k support tickets. Deliverable: model + eval report.',
  type: 'fixed',
  time_submitted: 1751500000,
  budget: { minimum: 750, maximum: 1500 },
  currency: { code: 'USD', exchange_rate: 1 },
  jobs: [{ name: 'Machine Learning (ML)' }, { name: 'Python' }],
}

const hourlyProject = {
  id: 222,
  title: 'RAG chatbot for internal docs',
  seo_url: 'python/rag-chatbot',
  preview_description: 'Build a RAG chatbot',
  description: 'Build a retrieval augmented generation chatbot with vector search over our wiki.',
  type: 'hourly',
  submitdate: 1751400000,
  budget: { minimum: 25, maximum: 50 },
  currency: { code: 'AUD', exchange_rate: 0.66 },
  jobs: [{ name: 'Python' }, { name: 'NLP' }],
  hourly_project_info: { commitment: { hours: 10, interval: 'week' } },
}

const nonAiProject = {
  id: 333,
  title: 'Logo design for bakery',
  seo_url: 'design/logo-bakery',
  preview_description: 'Design a logo',
  description: 'We want a warm, friendly logo for our neighborhood bakery.',
  type: 'fixed',
  time_submitted: 1751500000,
  budget: { minimum: 50, maximum: 100 },
  currency: { code: 'USD', exchange_rate: 1 },
  jobs: [{ name: 'Graphic Design' }],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(apiResponse([fixedProject, hourlyProject, nonAiProject])))
})
afterEach(() => vi.unstubAllGlobals())

describe('fetchFreelancer', () => {
  it('maps fixed-budget projects with rate_type=fixed and contract employment', async () => {
    const jobs = await fetchFreelancer()
    const fixed = jobs.find(j => j.source_id === 'freelancer-111')!

    expect(fixed).toBeTruthy()
    expect(fixed.rate_type).toBe('fixed')
    expect(fixed.employment_type).toBe('contract')
    expect(fixed.rate_min).toBe(750)
    expect(fixed.rate_max).toBe(1500)
    expect(fixed.platform).toBe('Freelancer')
    expect(fixed.url).toBe('https://www.freelancer.com/projects/machine-learning/fine-tune-llm')
    expect(fixed.skills).toContain('Machine Learning')
    expect(fixed.skills).toContain('Python')
    expect(fixed.posted_at).toBe(new Date(1751500000 * 1000).toISOString())
  })

  it('converts hourly budgets to USD and captures weekly commitment', async () => {
    const jobs = await fetchFreelancer()
    const hourly = jobs.find(j => j.source_id === 'freelancer-222')!

    expect(hourly.rate_type).toBe('hourly')
    expect(hourly.rate_min).toBe(Math.round(25 * 0.66))
    expect(hourly.rate_max).toBe(Math.round(50 * 0.66))
    expect(hourly.duration).toBe('10 hrs/week')
  })

  it('filters out non-AI/ML projects', async () => {
    const jobs = await fetchFreelancer()
    expect(jobs.find(j => j.source_id === 'freelancer-333')).toBeUndefined()
  })

  it('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response))
    await expect(fetchFreelancer()).rejects.toThrow('Freelancer fetch failed: 503')
  })
})
