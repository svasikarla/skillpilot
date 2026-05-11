import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}))

import { GET } from '@/app/api/cron/refresh-matches/route'
import { createAdminClient } from '@/lib/supabase/server'

// ─── Types (mirror the route's raw DB shapes) ─────────────────────────────────

type RawMember = {
  id:                string
  target_hourly_rate: string | null
  hours_per_week:    number | null
  years_experience:  number | null
  profile_embedding: null
  member_skills:     Array<{
    self_rating: number
    skills:      { name: string } | null
  }>
}

type RawJob = {
  id:              string
  extracted_skills: string[] | null
  job_embedding:   null
  rate_min:        string | null
  rate_max:        string | null
  description:     string | null
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MATCH_MEMBER: RawMember = {
  id:                 'member-1',
  target_hourly_rate: '100',
  hours_per_week:     40,
  years_experience:   5,
  profile_embedding:  null,
  member_skills: [
    { self_rating: 4, skills: { name: 'Python' } },
    { self_rating: 3, skills: { name: 'LangChain' } },
    { self_rating: 3, skills: { name: 'RAG' } },
  ],
}

const MATCH_JOB: RawJob = {
  id:               'job-1',
  extracted_skills: ['Python', 'LangChain', 'RAG'],
  job_embedding:    null,
  rate_min:         '90',
  rate_max:         '110',
  description:      'Contract role. 3+ years experience required. Full-time.',
}

const LOW_SKILL_MEMBER: RawMember = {
  ...MATCH_MEMBER,
  id: 'member-low',
  member_skills: [
    { self_rating: 4, skills: { name: 'JavaScript' } },   // not in job skills
  ],
}

// ─── Mock builder ─────────────────────────────────────────────────────────────

function buildSupa({
  membersData  = [] as RawMember[],
  jobsData     = [] as RawJob[],
  membersError = null as unknown,
  jobsError    = null as unknown,
} = {}) {
  const upsertMock = vi.fn().mockResolvedValue({ error: null })

  const client = {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: membersData, error: membersError }),
          }),
        }
      }
      if (table === 'jobs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ data: jobsData, error: jobsError }),
            }),
          }),
        }
      }
      if (table === 'member_job_matches') {
        return { upsert: upsertMock }
      }
      return {}
    }),
  }

  return { client, upsertMock }
}

function makeReq(authHeader?: string): Request {
  return new Request('http://localhost/api/cron/refresh-matches', {
    headers: authHeader ? { authorization: authHeader } : {},
  })
}

// ─── CRON_SECRET auth guard ───────────────────────────────────────────────────

describe('GET /api/cron/refresh-matches — auth guard', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET
    vi.clearAllMocks()
  })

  it('returns 401 when CRON_SECRET is set and Authorization header is absent', async () => {
    process.env.CRON_SECRET = 'my-secret'
    const { client } = buildSupa()
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('returns 401 when bearer token does not match CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'my-secret'
    const { client } = buildSupa()
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res = await GET(makeReq('Bearer wrong-token'))
    expect(res.status).toBe(401)
  })

  it('returns 200 when bearer token matches CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'my-secret'
    const { client } = buildSupa()
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res = await GET(makeReq('Bearer my-secret'))
    expect(res.status).toBe(200)
  })

  it('returns 200 (no auth check) when CRON_SECRET is not set', async () => {
    const { client } = buildSupa()
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res = await GET(makeReq())
    expect(res.status).toBe(200)
  })
})

// ─── Match sync loop ──────────────────────────────────────────────────────────

describe('GET /api/cron/refresh-matches — sync loop', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns { ok:true, members:0, jobs:0, matchesUpserted:0 } when no members exist', async () => {
    const { client } = buildSupa({ membersData: [], jobsData: [MATCH_JOB] })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as Record<string, unknown>

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.members).toBe(0)
    expect(json.matchesUpserted).toBe(0)
  })

  it('returns matchesUpserted:0 when no approved jobs exist', async () => {
    const { client } = buildSupa({ membersData: [MATCH_MEMBER], jobsData: [] })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as Record<string, unknown>

    expect(json.matchesUpserted).toBe(0)
    expect(json.jobs).toBe(0)
  })

  it('upserts exactly members × jobs times', async () => {
    const secondJob: RawJob = { ...MATCH_JOB, id: 'job-2' }
    const { client, upsertMock } = buildSupa({
      membersData: [MATCH_MEMBER],
      jobsData:    [MATCH_JOB, secondJob],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as Record<string, unknown>

    expect(json.matchesUpserted).toBe(2)
    expect(upsertMock).toHaveBeenCalledTimes(2)
  })

  it('upserted row contains required fields with correct types', async () => {
    const { client, upsertMock } = buildSupa({
      membersData: [MATCH_MEMBER],
      jobsData:    [MATCH_JOB],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    await GET(makeReq())

    const [payload, opts] = upsertMock.mock.calls[0] as [Record<string, unknown>, Record<string, string>]

    expect(payload.member_id).toBe('member-1')
    expect(payload.job_id).toBe('job-1')
    expect(typeof payload.match_score).toBe('number')
    expect(typeof payload.skill_score).toBe('number')
    expect(typeof payload.is_near_miss).toBe('boolean')
    expect(Array.isArray(payload.matched_skills)).toBe(true)
    expect(Array.isArray(payload.missing_skills)).toBe(true)
    expect(typeof payload.computed_at).toBe('string')
    expect(opts).toEqual({ onConflict: 'member_id,job_id' })
  })

  it('match_score is in range 0–100', async () => {
    const { client, upsertMock } = buildSupa({
      membersData: [MATCH_MEMBER],
      jobsData:    [MATCH_JOB],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    await GET(makeReq())

    const [payload] = upsertMock.mock.calls[0] as [Record<string, unknown>]
    expect(payload.match_score as number).toBeGreaterThanOrEqual(0)
    expect(payload.match_score as number).toBeLessThanOrEqual(100)
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe('GET /api/cron/refresh-matches — error handling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 500 when the members query fails', async () => {
    const { client } = buildSupa({ membersError: { message: 'members table not found' } })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as { error: string }

    expect(res.status).toBe(500)
    expect(json.error).toBe('members table not found')
  })

  it('returns 500 when the jobs query fails', async () => {
    const { client } = buildSupa({
      membersData: [MATCH_MEMBER],
      jobsError:   { message: 'jobs table timeout' },
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as { error: string }

    expect(res.status).toBe(500)
    expect(json.error).toBe('jobs table timeout')
  })
})

// ─── computeMatch integration ─────────────────────────────────────────────────

describe('GET /api/cron/refresh-matches — computeMatch integration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('well-matched member produces match_score >= 70 and is_near_miss = false', async () => {
    const { client, upsertMock } = buildSupa({
      membersData: [MATCH_MEMBER],
      jobsData:    [MATCH_JOB],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    await GET(makeReq())

    const [payload] = upsertMock.mock.calls[0] as [Record<string, unknown>]
    expect(payload.match_score as number).toBeGreaterThanOrEqual(70)
    expect(payload.is_near_miss).toBe(false)
  })

  it('member with no matching skills triggers near-miss (is_near_miss = true)', async () => {
    const mismatchJob: RawJob = {
      ...MATCH_JOB,
      id:               'job-mismatch',
      extracted_skills: ['TensorFlow', 'PyTorch', 'CUDA', 'Rust', 'C++'],
    }
    const { client, upsertMock } = buildSupa({
      membersData: [LOW_SKILL_MEMBER],
      jobsData:    [mismatchJob],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    await GET(makeReq())

    const [payload] = upsertMock.mock.calls[0] as [Record<string, unknown>]
    expect(payload.is_near_miss).toBe(true)
  })

  it('member skills with self_rating < 2 are excluded from matched_skills', async () => {
    const memberWithLowRatings: RawMember = {
      ...MATCH_MEMBER,
      id: 'member-low-ratings',
      member_skills: [
        { self_rating: 1, skills: { name: 'Python' } },     // excluded — rating 1
        { self_rating: 4, skills: { name: 'LangChain' } },  // included
      ],
    }
    const jobRequiringBoth: RawJob = {
      ...MATCH_JOB,
      extracted_skills: ['Python', 'LangChain'],
    }
    const { client, upsertMock } = buildSupa({
      membersData: [memberWithLowRatings],
      jobsData:    [jobRequiringBoth],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    await GET(makeReq())

    const [payload] = upsertMock.mock.calls[0] as [Record<string, unknown>]
    const matched = payload.matched_skills as string[]
    expect(matched).not.toContain('Python')    // rating 1 — excluded
    expect(matched).toContain('LangChain')     // rating 4 — included
  })

  it('2 members × 3 jobs produces 6 upsert calls with correct member/job id pairs', async () => {
    const member2: RawMember = { ...MATCH_MEMBER, id: 'member-2' }
    const job2: RawJob       = { ...MATCH_JOB,    id: 'job-2'    }
    const job3: RawJob       = { ...MATCH_JOB,    id: 'job-3'    }

    const { client, upsertMock } = buildSupa({
      membersData: [MATCH_MEMBER, member2],
      jobsData:    [MATCH_JOB, job2, job3],
    })
    vi.mocked(createAdminClient).mockResolvedValue(client as never)

    const res  = await GET(makeReq())
    const json = await res.json() as Record<string, unknown>

    expect(json.matchesUpserted).toBe(6)
    expect(upsertMock).toHaveBeenCalledTimes(6)

    const pairs = upsertMock.mock.calls.map(
      ([p]: [Record<string, string>]) => `${p.member_id}:${p.job_id}`
    )
    expect(pairs).toEqual(expect.arrayContaining([
      'member-1:job-1', 'member-1:job-2', 'member-1:job-3',
      'member-2:job-1', 'member-2:job-2', 'member-2:job-3',
    ]))
  })
})
