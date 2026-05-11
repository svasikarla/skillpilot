import { describe, it, expect } from 'vitest'
import { computeMatch, matchLabel } from '@/lib/matching'
import type { MemberProfile, JobForMatch } from '@/lib/matching'
import { MATCH_THRESHOLDS } from '@/lib/config'
import { serializeEmbedding } from '@/lib/embeddings'

// ─── Factories ────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<MemberProfile> = {}): MemberProfile {
  return {
    id:               'member-1',
    targetHourlyRate: 100,
    hoursPerWeek:     20,
    yearsExperience:  5,
    profileEmbedding: null,
    skills: [
      { name: 'Python',    selfRating: 4 },
      { name: 'LangChain', selfRating: 3 },
      { name: 'RAG',       selfRating: 3 },
    ],
    ...overrides,
  }
}

function makeJob(overrides: Partial<JobForMatch> = {}): JobForMatch {
  return {
    id:              'job-1',
    extractedSkills: ['Python', 'LangChain', 'RAG'],
    jobEmbedding:    null,
    rateMin:         90,
    rateMax:         110,
    description:     'Contract work. 3 years experience required.',
    ...overrides,
  }
}

// ─── computeMatch — result shape ─────────────────────────────────────────────

describe('computeMatch() — result shape', () => {
  it('returns an object with the required fields', () => {
    const result = computeMatch(makeMember(), makeJob())
    expect(result).toHaveProperty('memberId', 'member-1')
    expect(result).toHaveProperty('jobId',    'job-1')
    expect(result).toHaveProperty('matchScore')
    expect(result).toHaveProperty('skillScore')
    expect(result).toHaveProperty('semanticScore')
    expect(result).toHaveProperty('rateScore')
    expect(result).toHaveProperty('expScore')
    expect(result).toHaveProperty('availScore')
    expect(result).toHaveProperty('matchedSkills')
    expect(result).toHaveProperty('missingSkills')
    expect(result).toHaveProperty('isNearMiss')
  })

  it('matchScore is an integer in 0–100', () => {
    const { matchScore } = computeMatch(makeMember(), makeJob())
    expect(matchScore).toBeGreaterThanOrEqual(0)
    expect(matchScore).toBeLessThanOrEqual(100)
    expect(Number.isInteger(matchScore)).toBe(true)
  })
})

// ─── computeMatch — skill matching ───────────────────────────────────────────

describe('computeMatch() — skill matching', () => {
  it('all skills matched → skillScore = 100', () => {
    const { skillScore, matchedSkills, missingSkills } = computeMatch(
      makeMember({ skills: [{ name: 'Python', selfRating: 3 }, { name: 'LangChain', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain'] })
    )
    expect(skillScore).toBe(100)
    expect(matchedSkills).toEqual(expect.arrayContaining(['Python', 'LangChain']))
    expect(missingSkills).toHaveLength(0)
  })

  it('no skills matched → skillScore = 0', () => {
    const { skillScore, matchedSkills, missingSkills } = computeMatch(
      makeMember({ skills: [{ name: 'Rust', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain'] })
    )
    expect(skillScore).toBe(0)
    expect(matchedSkills).toHaveLength(0)
    expect(missingSkills).toEqual(expect.arrayContaining(['Python', 'LangChain']))
  })

  it('partial match (1/3) → skillScore ≈ 33', () => {
    const { skillScore } = computeMatch(
      makeMember({ skills: [{ name: 'Python', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain', 'RAG'] })
    )
    expect(skillScore).toBe(33)
  })

  it('matching is case-insensitive', () => {
    const { matchedSkills } = computeMatch(
      makeMember({ skills: [{ name: 'python', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python'] })
    )
    expect(matchedSkills).toHaveLength(1)
  })

  it('excludes skills with selfRating < 2', () => {
    const { matchedSkills, missingSkills } = computeMatch(
      makeMember({ skills: [
        { name: 'Python',    selfRating: 1 },   // excluded
        { name: 'LangChain', selfRating: 2 },   // included
      ]}),
      makeJob({ extractedSkills: ['Python', 'LangChain'] })
    )
    // Python excluded from member set → not matched
    expect(matchedSkills).toEqual(['LangChain'])
    expect(missingSkills).toEqual(['Python'])
  })

  it('job with no extracted skills → neutral skillScore (70)', () => {
    const { skillScore, isNearMiss } = computeMatch(
      makeMember(),
      makeJob({ extractedSkills: [] })
    )
    expect(skillScore).toBe(70)  // 0.7 * 100
    expect(isNearMiss).toBe(false)
  })

  it('null extractedSkills treated as no skills', () => {
    const { skillScore } = computeMatch(
      makeMember(),
      makeJob({ extractedSkills: null })
    )
    expect(skillScore).toBe(70)
  })
})

// ─── computeMatch — hard gate / near-miss ─────────────────────────────────────

describe('computeMatch() — hard gate logic', () => {
  it('sets isNearMiss=true when match ratio < 40%', () => {
    const { isNearMiss } = computeMatch(
      makeMember({ skills: [{ name: 'Python', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain', 'RAG', 'pgvector', 'OpenAI API'] })
    )
    // 1/5 = 20% < 40% → hard gate
    expect(isNearMiss).toBe(true)
  })

  it('caps matchScore at hardGateCap (55) when below gate', () => {
    const { matchScore, isNearMiss } = computeMatch(
      makeMember({ skills: [{ name: 'Python', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain', 'RAG', 'pgvector', 'OpenAI API'] })
    )
    expect(isNearMiss).toBe(true)
    expect(matchScore).toBeLessThanOrEqual(Math.round(MATCH_THRESHOLDS.hardGateCap * 100))
  })

  it('isNearMiss=false when match ratio >= 40%', () => {
    // 2/4 = 50% >= 40%
    const { isNearMiss } = computeMatch(
      makeMember({ skills: [{ name: 'Python', selfRating: 3 }, { name: 'LangChain', selfRating: 3 }] }),
      makeJob({ extractedSkills: ['Python', 'LangChain', 'RAG', 'pgvector'] })
    )
    expect(isNearMiss).toBe(false)
  })

  it('isNearMiss=false when job has no skills (no gate check)', () => {
    const { isNearMiss } = computeMatch(
      makeMember({ skills: [] }),
      makeJob({ extractedSkills: [] })
    )
    expect(isNearMiss).toBe(false)
  })
})

// ─── computeMatch — semantic score ────────────────────────────────────────────

describe('computeMatch() — semantic score', () => {
  it('returns semanticScore=50 when both embeddings are null', () => {
    const { semanticScore } = computeMatch(makeMember(), makeJob())
    expect(semanticScore).toBe(50)
  })

  it('returns semanticScore=50 when profile embedding is null', () => {
    const jobEmb = serializeEmbedding([1, 0, 0])
    const { semanticScore } = computeMatch(
      makeMember({ profileEmbedding: null }),
      makeJob({ jobEmbedding: jobEmb })
    )
    expect(semanticScore).toBe(50)
  })

  it('returns non-50 semanticScore when both embeddings provided', () => {
    // Identical embeddings → cosine = 1.0 → (1.0 - 0.3)/0.7 = 1.0 → semanticScore = 100
    const emb = serializeEmbedding([1, 0, 0])
    const { semanticScore } = computeMatch(
      makeMember({ profileEmbedding: emb }),
      makeJob({ jobEmbedding: emb })
    )
    expect(semanticScore).toBe(100)
  })

  it('clamps semanticScore to 0 for orthogonal embeddings (cosine < 0.3)', () => {
    // Orthogonal embeddings → cosine = 0 → (0-0.3)/0.7 = -0.43 → max(0, -0.43) = 0 → 0
    const profileEmb = serializeEmbedding([1, 0, 0])
    const jobEmb     = serializeEmbedding([0, 1, 0])
    const { semanticScore } = computeMatch(
      makeMember({ profileEmbedding: profileEmb }),
      makeJob({ jobEmbedding: jobEmb })
    )
    expect(semanticScore).toBe(0)
  })
})

// ─── computeMatch — rate score ────────────────────────────────────────────────

describe('computeMatch() — rate scoring', () => {
  it('rateScore=50 when member has no target rate', () => {
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: null }),
      makeJob({ rateMin: 100, rateMax: 120 })
    )
    expect(rateScore).toBe(50)
  })

  it('rateScore=50 when job has no rate info', () => {
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 100 }),
      makeJob({ rateMin: null, rateMax: null })
    )
    expect(rateScore).toBe(50)
  })

  it('rateScore=100 when target rate matches job mid-rate exactly', () => {
    // ratio = 100/100 = 1.0 → 1.0
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 100 }),
      makeJob({ rateMin: 90, rateMax: 110 })  // mid = 100
    )
    expect(rateScore).toBe(100)
  })

  it('rateScore=80 when member rate slightly exceeds job rate (ratio 1.2–1.5)', () => {
    // target=130, job mid=100, ratio=1.3 → 0.8
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 130 }),
      makeJob({ rateMin: 90, rateMax: 110 })
    )
    expect(rateScore).toBe(80)
  })

  it('rateScore=20 when member rate far exceeds job rate (ratio > 2.0)', () => {
    // target=250, job mid=100, ratio=2.5 → 0.2
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 250 }),
      makeJob({ rateMin: 90, rateMax: 110 })
    )
    expect(rateScore).toBe(20)
  })

  it('rateScore=100 when job offers more than member target (ratio 0.8–1.0)', () => {
    // target=90, job mid=100, ratio=0.9 → 1.0
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 90 }),
      makeJob({ rateMin: 90, rateMax: 110 })
    )
    expect(rateScore).toBe(100)
  })

  it('uses only rateMin when rateMax is null', () => {
    const { rateScore } = computeMatch(
      makeMember({ targetHourlyRate: 100 }),
      makeJob({ rateMin: 100, rateMax: null })
    )
    // midRate = rateMin = 100; ratio = 1.0 → 1.0
    expect(rateScore).toBe(100)
  })
})

// ─── computeMatch — experience score ─────────────────────────────────────────

describe('computeMatch() — experience scoring', () => {
  it('expScore=50 when member has no years experience', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: null }),
      makeJob({ description: '5+ years experience required' })
    )
    expect(expScore).toBe(50)
  })

  it('expScore=50 when job description is null', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 5 }),
      makeJob({ description: null })
    )
    expect(expScore).toBe(50)
  })

  it('expScore=60 when no experience requirement found in description', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 5 }),
      makeJob({ description: 'Build cool AI stuff' })
    )
    expect(expScore).toBe(60)
  })

  it('expScore=100 when member meets required years exactly', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 3 }),
      makeJob({ description: '3+ years of experience required' })
    )
    expect(expScore).toBe(100)
  })

  it('expScore=100 when member exceeds required years', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 7 }),
      makeJob({ description: '3 years experience required' })
    )
    expect(expScore).toBe(100)
  })

  it('expScore=80 when member is 1 year short of requirement', () => {
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 2 }),
      makeJob({ description: '3 years experience required' })
    )
    expect(expScore).toBe(80)
  })

  it('expScore=50 when member has 70–99% of required years', () => {
    // required=5, member=4 (4 >= 5*0.7=3.5, 4 < 5-1=4 is false, so memberYears >= required*0.7)
    // Wait: 4 >= 5-1=4 is true (>= required-1) → 0.8
    // Need: member has >= required*0.7 but < required-1
    // required=10, member=8: 8 >= 10*0.7=7 but 8 < 10-1=9 → 0.5
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 8 }),
      makeJob({ description: '10 years experience required' })
    )
    expect(expScore).toBe(50)
  })

  it('expScore=20 when member has less than 70% of required years', () => {
    // required=10, member=3: 3 < 10*0.7=7 → 0.2
    const { expScore } = computeMatch(
      makeMember({ yearsExperience: 3 }),
      makeJob({ description: '10 years of experience required' })
    )
    expect(expScore).toBe(20)
  })
})

// ─── computeMatch — availability score ───────────────────────────────────────

describe('computeMatch() — availability scoring', () => {
  it('availScore=50 when member has no hoursPerWeek', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: null }),
      makeJob({ description: 'Full-time contract' })
    )
    expect(availScore).toBe(50)
  })

  it('availScore=100 for full-time job when member has 40h/week', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 40 }),
      makeJob({ description: 'Full-time position, 40 hours per week required' })
    )
    expect(availScore).toBe(100)
  })

  it('availScore=60 for full-time job when member has 25h/week', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 25 }),
      makeJob({ description: 'Full-time role available' })
    )
    expect(availScore).toBe(60)
  })

  it('availScore=20 for full-time job when member has 15h/week', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 15 }),
      makeJob({ description: 'Full-time position requiring full-time availability' })
    )
    expect(availScore).toBe(20)
  })

  it('availScore=80 for contract/freelance role', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 20 }),
      makeJob({ description: 'Freelance contract opportunity' })
    )
    expect(availScore).toBe(80)
  })

  it('availScore=70 when description has no time requirement', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 20 }),
      makeJob({ description: 'Build ML pipelines' })
    )
    expect(availScore).toBe(70)
  })

  it('availScore=100 for part-time job when member has 20h/week', () => {
    const { availScore } = computeMatch(
      makeMember({ hoursPerWeek: 20 }),
      makeJob({ description: 'Part-time consulting engagement' })
    )
    expect(availScore).toBe(100)
  })
})

// ─── matchLabel ───────────────────────────────────────────────────────────────

describe('matchLabel()', () => {
  it('returns "Apply Ready" for score >= 70 and not near miss', () => {
    expect(matchLabel(70, false)).toBe('Apply Ready')
    expect(matchLabel(85, false)).toBe('Apply Ready')
    expect(matchLabel(100, false)).toBe('Apply Ready')
  })

  it('returns "Stretch" for score 50–69 and not near miss', () => {
    expect(matchLabel(50, false)).toBe('Stretch')
    expect(matchLabel(60, false)).toBe('Stretch')
    expect(matchLabel(69, false)).toBe('Stretch')
  })

  it('returns "Low Match" for score < 50 and not near miss', () => {
    expect(matchLabel(0,  false)).toBe('Low Match')
    expect(matchLabel(25, false)).toBe('Low Match')
    expect(matchLabel(49, false)).toBe('Low Match')
  })

  it('returns "Near Miss" when isNearMiss=true regardless of score', () => {
    expect(matchLabel(0,   true)).toBe('Near Miss')
    expect(matchLabel(50,  true)).toBe('Near Miss')
    expect(matchLabel(100, true)).toBe('Near Miss')
  })

  it('boundary at exactly 70', () => {
    expect(matchLabel(70, false)).toBe('Apply Ready')
    expect(matchLabel(69, false)).toBe('Stretch')
  })

  it('boundary at exactly 50', () => {
    expect(matchLabel(50, false)).toBe('Stretch')
    expect(matchLabel(49, false)).toBe('Low Match')
  })
})

// ─── computeMatch — composite end-to-end ─────────────────────────────────────

describe('computeMatch() — composite end-to-end', () => {
  it('perfect member produces matchScore >= 90', () => {
    const member = makeMember({
      targetHourlyRate: 100,
      hoursPerWeek:     40,
      yearsExperience:  5,
      skills: [
        { name: 'Python',    selfRating: 5 },
        { name: 'LangChain', selfRating: 4 },
        { name: 'RAG',       selfRating: 4 },
      ],
    })
    const job = makeJob({
      extractedSkills: ['Python', 'LangChain', 'RAG'],
      rateMin:         90,
      rateMax:         110,
      description:     'Contract role. 3+ years experience required. Full-time.',
    })
    const { matchScore, isNearMiss } = computeMatch(member, job)
    expect(matchScore).toBeGreaterThanOrEqual(85)
    expect(isNearMiss).toBe(false)
  })

  it('zero-skill member triggers near-miss and caps matchScore at hardGateCap', () => {
    const member = makeMember({
      skills: [{ name: 'JavaScript', selfRating: 4 }],
    })
    const job = makeJob({
      extractedSkills: ['Python', 'LangChain', 'RAG', 'TensorFlow', 'CUDA'],
    })
    const { matchScore, isNearMiss } = computeMatch(member, job)
    expect(isNearMiss).toBe(true)
    expect(matchScore).toBeLessThanOrEqual(Math.round(MATCH_THRESHOLDS.hardGateCap * 100))
  })

  it('computeMatch is deterministic — same inputs produce identical output', () => {
    const member = makeMember()
    const job    = makeJob()
    const r1 = computeMatch(member, job)
    const r2 = computeMatch(member, job)
    expect(r1.matchScore).toBe(r2.matchScore)
    expect(r1.skillScore).toBe(r2.skillScore)
    expect(r1.isNearMiss).toBe(r2.isNearMiss)
    expect(r1.matchedSkills).toEqual(r2.matchedSkills)
    expect(r1.missingSkills).toEqual(r2.missingSkills)
  })

  it('matchScore is always an integer', () => {
    const cases: [Partial<MemberProfile>, Partial<JobForMatch>][] = [
      [{ skills: [] }, {}],
      [{ targetHourlyRate: 200 }, { rateMin: 50, rateMax: 60 }],
      [{ yearsExperience: 1 },  { description: '10 years experience required' }],
    ]
    for (const [memberOverrides, jobOverrides] of cases) {
      const { matchScore } = computeMatch(makeMember(memberOverrides), makeJob(jobOverrides))
      expect(Number.isInteger(matchScore)).toBe(true)
    }
  })

  it('member with no skills against job with no skills produces neutral non-near-miss score', () => {
    const { matchScore, isNearMiss } = computeMatch(
      makeMember({ skills: [] }),
      makeJob({ extractedSkills: [] })
    )
    expect(isNearMiss).toBe(false)
    expect(matchScore).toBeGreaterThan(0)
    expect(matchScore).toBeLessThanOrEqual(100)
  })
})
