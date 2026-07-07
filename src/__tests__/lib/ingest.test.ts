import { describe, it, expect, vi, beforeEach } from 'vitest'

// Contract test for the ingest wiring (last_seen_at bump + stale archiving).
// A real run needs a live Supabase + external APIs, so we mock the client and
// adapters and assert the queries ingest builds — the logic that pure unit tests
// can't reach.

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
vi.mock('@/lib/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2]),
  jobEmbeddingText: () => 'embedding text',
}))
vi.mock('@/lib/ingest/remotive', () => ({ fetchRemotive: vi.fn() }))
vi.mock('@/lib/ingest/remoteok', () => ({ fetchRemoteOK: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/himalayas', () => ({ fetchHimalayas: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/findwork', () => ({ fetchFindwork: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/hnwih', () => ({ fetchHNWhoIsHiring: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/weworkremotely', () => ({ fetchWeWorkRemotely: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/workingnomads', () => ({ fetchWorkingNomads: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/freelancer', () => ({ fetchFreelancer: vi.fn().mockResolvedValue([]) }))
vi.mock('@/lib/ingest/hnfreelance', () => ({ fetchHNFreelance: vi.fn().mockResolvedValue([]) }))

import { ingestAllSources } from '@/lib/ingest'
import { createClient } from '@supabase/supabase-js'
import { fetchRemotive } from '@/lib/ingest/remotive'
import { STALE_AFTER_DAYS } from '@/lib/job-freshness'
import type { RawJob } from '@/lib/ingest/types'

type Op = [string, ...unknown[]]

interface Recorder {
  inserted: Record<string, unknown>[]
  lastSeenUpdates: Op[][]
  archiveUpdates: Op[][]
}

function fakeSupabase(
  existing: { url: string }[],
  opts: { failInsert?: boolean } = {},
): { client: unknown; rec: Recorder } {
  const rec: Recorder = { inserted: [], lastSeenUpdates: [], archiveUpdates: [] }

  function builder(table: string) {
    const ops: Op[] = []
    const b: Record<string, unknown> = {}
    for (const m of ['select', 'insert', 'update', 'eq', 'neq', 'lt', 'in']) {
      b[m] = (...args: unknown[]) => { ops.push([m, ...args]); return b }
    }
    // Thenable so `await`ing the chain resolves like the supabase builder does.
    b.then = (resolve: (v: unknown) => void) => {
      const [first, payload] = ops[0] ?? []
      if (table === 'jobs' && first === 'select') return resolve({ data: existing })
      if (table === 'jobs' && first === 'insert') {
        if (opts.failInsert) return resolve({ error: { message: 'column does not exist' } })
        rec.inserted.push(...(payload as Record<string, unknown>[]))
        return resolve({ error: null })
      }
      if (table === 'jobs' && first === 'update') {
        const p = payload as Record<string, unknown>
        if (p.status === 'archived') rec.archiveUpdates.push(ops)
        else rec.lastSeenUpdates.push(ops)
        return resolve({ error: null })
      }
      return resolve({ data: null, error: null })
    }
    return b
  }

  return { client: { from: (t: string) => builder(t) }, rec }
}

const rawJob = (over: Partial<RawJob> = {}): RawJob => ({
  source_id: 'remotive-1', source: 'remotive', title: 'ML Engineer',
  company: 'Acme', description: 'Build models. Hourly contract. '.padEnd(320, 'x'),
  platform: 'Remotive', url: 'https://jobs/new', skills: ['Python'],
  location: 'Remote', rate_min: 100, rate_max: 150,
  posted_at: '2026-06-01T00:00:00.000Z', employment_type: 'contract', ...over,
})

beforeEach(() => vi.clearAllMocks())

describe('ingestAllSources wiring', () => {
  it('inserts new jobs, bumps last_seen for existing ones, and archives stale jobs', async () => {
    const existing = [{ url: 'https://jobs/existing' }]
    const { client, rec } = fakeSupabase(existing)
    vi.mocked(createClient).mockReturnValue(client as never)

    vi.mocked(fetchRemotive).mockResolvedValue([
      rawJob({ url: 'https://jobs/new', rate_min: 31.25, rate_max: 81.5 }), // fractional source rates
      rawJob({ source_id: 'remotive-2', url: 'https://jobs/existing' }), // already known
    ])

    const before = Date.now()
    const results = await ingestAllSources()
    const after = Date.now()

    // New job inserted with a last_seen_at stamp
    expect(rec.inserted).toHaveLength(1)
    const row = rec.inserted[0]
    expect(row.title).toBe('ML Engineer')
    expect(typeof row.last_seen_at).toBe('string')
    // rate_type defaults to hourly and duration to null when the source omits them
    expect(row.rate_type).toBe('hourly')
    expect(row.duration).toBeNull()
    // fractional rates are rounded — the DB rate columns are int
    expect(row.rate_min).toBe(31)
    expect(row.rate_max).toBe(82)

    // Existing URL got a last_seen bump scoped to that url
    const bump = rec.lastSeenUpdates.find(ops =>
      ops.some(([m, col, val]) => m === 'in' && col === 'url' && Array.isArray(val) && val.includes('https://jobs/existing'))
    )
    expect(bump).toBeTruthy()
    const bumpPayload = bump![0][1] as Record<string, unknown>
    expect(typeof bumpPayload.last_seen_at).toBe('string')

    // Exactly one archive pass with the correct filters
    expect(rec.archiveUpdates).toHaveLength(1)
    const archive = rec.archiveUpdates[0]
    expect(archive[0]).toEqual(['update', { status: 'archived' }])
    expect(archive).toContainEqual(['eq', 'status', 'approved'])
    expect(archive).toContainEqual(['neq', 'source', 'seed'])

    // Cutoff is ~STALE_AFTER_DAYS in the past
    const ltOp = archive.find(([m]) => m === 'lt')!
    const cutoff = new Date(ltOp[2] as string).getTime()
    const expected = before - STALE_AFTER_DAYS * 86_400_000
    expect(cutoff).toBeGreaterThanOrEqual(expected - 5_000)
    expect(cutoff).toBeLessThanOrEqual(after - STALE_AFTER_DAYS * 86_400_000 + 5_000)

    // The remotive adapter reported one new + one duped
    const remotive = results.find(r => r.source === 'remotive')!
    expect(remotive.inserted).toBe(1)
    expect(remotive.duped).toBe(1)
  })

  it('reports insert failures as errors instead of claiming success', async () => {
    const { client, rec } = fakeSupabase([], { failInsert: true })
    vi.mocked(createClient).mockReturnValue(client as never)
    vi.mocked(fetchRemotive).mockResolvedValue([rawJob()])

    const results = await ingestAllSources()
    const remotive = results.find(r => r.source === 'remotive')!

    expect(rec.inserted).toHaveLength(0)
    expect(remotive.inserted).toBe(0)
    expect(remotive.error).toMatch(/insert failed: column does not exist/)
  })

  it('still runs the archive pass when no new jobs are found', async () => {
    const { client, rec } = fakeSupabase([])
    vi.mocked(createClient).mockReturnValue(client as never)
    vi.mocked(fetchRemotive).mockResolvedValue([])

    await ingestAllSources()

    expect(rec.inserted).toHaveLength(0)
    expect(rec.archiveUpdates).toHaveLength(1)
  })
})
