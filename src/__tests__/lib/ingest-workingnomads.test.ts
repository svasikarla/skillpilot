import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWorkingNomads } from '@/lib/ingest/workingnomads'

// The live API sends `tags` as a comma-separated string, not an array —
// treating it as an array crashed the whole adapter (tags.join TypeError).
const apiJob = {
  id: 91,
  title: 'Machine Learning Engineer',
  company: 'Acme AI',
  company_logo: null,
  category: 'Data Science',
  tags: 'python, machine-learning, docker',
  url: 'https://www.workingnomads.com/jobs/ml-engineer-acme',
  pub_date: '2026-07-05T00:00:00Z',
  description: 'Build and deploy machine learning models. Contract role, hourly rate.',
  salary: '$60-90/hr',
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [apiJob, { ...apiJob, id: 92, tags: null }],
  } as Response))
})
afterEach(() => vi.unstubAllGlobals())

describe('fetchWorkingNomads', () => {
  it('parses comma-separated string tags into skills', async () => {
    const jobs = await fetchWorkingNomads()
    const job = jobs.find(j => j.source_id === 'workingnomads-91')!
    expect(job.skills).toEqual(expect.arrayContaining(['Python', 'Machine Learning', 'Docker']))
    expect(job.employment_type).toBe('contract')
  })

  it('tolerates null tags without crashing', async () => {
    const jobs = await fetchWorkingNomads()
    expect(jobs.find(j => j.source_id === 'workingnomads-92')).toBeTruthy()
  })
})
