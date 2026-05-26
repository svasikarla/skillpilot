import { describe, it, expect } from 'vitest'
import { computeMatch } from '@/lib/matching'

const NOW = new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const base = {
  userSkills: [] as string[],
  skillRatings: {} as Record<string, number>,
  hourlyRate: null as number | null,
  jobSkills: [] as string[],
  jobRateMin: null as number | null,
  jobRateMax: null as number | null,
  jobPostedAt: NOW,
}

// ── Skill scoring ────────────────────────────────────────────────────────────

describe('computeMatch – skill scoring', () => {
  it('returns skillScore 0 and isCapped when user has no skills and job has 3+', () => {
    const r = computeMatch({ ...base, jobSkills: ['Python', 'ML', 'TensorFlow'] })
    expect(r.skillScore).toBe(0)
    expect(r.isCapped).toBe(true)
    expect(r.matchedSkills).toHaveLength(0)
    expect(r.missingSkills).toHaveLength(3)
  })

  it('is not capped when skill coverage >= 40%', () => {
    const r = computeMatch({
      ...base,
      userSkills: ['Python', 'ML'],
      skillRatings: { Python: 5, ML: 5 },
      jobSkills: ['Python', 'ML', 'TensorFlow'],
    })
    expect(r.isCapped).toBe(false)
    expect(r.matchedSkills).toEqual(expect.arrayContaining(['Python', 'ML']))
    expect(r.missingSkills).toEqual(['TensorFlow'])
  })

  it('caps final score at 55 when coverage < 40% and raw exceeds cap', () => {
    // 1/3 skills covered = 33% → isCapped; high rate + recency push raw > 55
    const r = computeMatch({
      ...base,
      userSkills: ['Python'],
      skillRatings: { Python: 5 },
      hourlyRate: 50,
      jobSkills: ['Python', 'ML', 'TensorFlow'],
      jobRateMin: 200,
      jobRateMax: 200,
    })
    expect(r.isCapped).toBe(true)
    expect(r.score).toBeLessThanOrEqual(55)
  })

  it('isCapped is false when job has fewer than 3 skills', () => {
    const r = computeMatch({
      ...base,
      jobSkills: ['Python', 'ML'], // only 2 skills → cap rule does not apply
    })
    expect(r.isCapped).toBe(false)
  })

  it('returns skillScore 100 for a single fully matched skill at rating 5', () => {
    // rating 5 → contribution = 0.5 + (5-1)*0.125 = 1.0 → rawSkillScore = 1.0 → 100
    const r = computeMatch({
      ...base,
      userSkills: ['Python'],
      skillRatings: { Python: 5 },
      jobSkills: ['Python'],
    })
    expect(r.skillScore).toBe(100)
  })

  it('returns skillScore 50 for a single matched skill at rating 1', () => {
    // rating 1 → contribution = 0.5 + 0 = 0.5 → rawSkillScore = 0.5 → 50
    const r = computeMatch({
      ...base,
      userSkills: ['Python'],
      skillRatings: { Python: 1 },
      jobSkills: ['Python'],
    })
    expect(r.skillScore).toBe(50)
  })

  it('higher rating produces higher skill score', () => {
    const low = computeMatch({ ...base, userSkills: ['Python'], skillRatings: { Python: 1 }, jobSkills: ['Python'] })
    const high = computeMatch({ ...base, userSkills: ['Python'], skillRatings: { Python: 5 }, jobSkills: ['Python'] })
    expect(high.skillScore).toBeGreaterThan(low.skillScore)
  })

  it('matches skills case-insensitively', () => {
    const r = computeMatch({
      ...base,
      userSkills: ['python', 'machine learning'],
      skillRatings: {},
      jobSkills: ['Python', 'Machine Learning'],
    })
    expect(r.matchedSkills).toHaveLength(2)
    expect(r.missingSkills).toHaveLength(0)
  })

  it('uses default rating 3 when skill is matched but not in skillRatings', () => {
    // rating 3 → contribution = 0.5 + 2*0.125 = 0.75 → skillScore = 75
    const r = computeMatch({
      ...base,
      userSkills: ['Python'],
      skillRatings: {},
      jobSkills: ['Python'],
    })
    expect(r.skillScore).toBe(75)
  })
})

// ── Rate scoring ─────────────────────────────────────────────────────────────

describe('computeMatch – rate scoring', () => {
  it('returns rateScore 50 when no rate data is provided', () => {
    const r = computeMatch(base)
    expect(r.rateScore).toBe(50)
  })

  it('returns rateScore 50 when only userRate is given (no job rate)', () => {
    const r = computeMatch({ ...base, hourlyRate: 100 })
    expect(r.rateScore).toBe(50)
  })

  it('returns rateScore 100 when job mid-rate equals user rate', () => {
    const r = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 100, jobRateMax: 100 })
    expect(r.rateScore).toBe(100)
  })

  it('returns rateScore 100 when job rate exceeds user rate', () => {
    const r = computeMatch({ ...base, hourlyRate: 80, jobRateMin: 100, jobRateMax: 120 })
    expect(r.rateScore).toBe(100)
  })

  it('returns rateScore 0 when job mid-rate is below 70% of user rate', () => {
    // hourlyRate=100, jobMid=60 → 60 < 70 → 0
    const r = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 60, jobRateMax: 60 })
    expect(r.rateScore).toBe(0)
  })

  it('linearly scales rateScore between 70%–100% of user rate', () => {
    // hourlyRate=100, jobMid=85 → (85-70)/30 * 100 = 50
    const r = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 85, jobRateMax: 85 })
    expect(r.rateScore).toBe(50)
  })

  it('uses jobRateMin as jobMid when jobRateMax is null', () => {
    const r = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 100, jobRateMax: null })
    expect(r.rateScore).toBe(100)
  })

  it('uses jobRateMax as jobMid when jobRateMin is null', () => {
    const r = computeMatch({ ...base, hourlyRate: 80, jobRateMin: null, jobRateMax: 100 })
    expect(r.rateScore).toBe(100)
  })
})

// ── Recency scoring ──────────────────────────────────────────────────────────

describe('computeMatch – recency scoring', () => {
  it('returns recencyScore 100 for a job posted right now', () => {
    const r = computeMatch(base) // jobPostedAt = NOW
    expect(r.recencyScore).toBe(100)
  })

  it('returns recencyScore 50 for a job posted 15 days ago', () => {
    // 100 - 15*(100/30) = 100 - 50 = 50
    const r = computeMatch({ ...base, jobPostedAt: daysAgo(15) })
    expect(r.recencyScore).toBe(50)
  })

  it('returns recencyScore 0 for a job posted 30 days ago', () => {
    const r = computeMatch({ ...base, jobPostedAt: daysAgo(30) })
    expect(r.recencyScore).toBe(0)
  })

  it('floors recencyScore at 0 for jobs older than 30 days', () => {
    const r = computeMatch({ ...base, jobPostedAt: daysAgo(45) })
    expect(r.recencyScore).toBe(0)
  })
})

// ── Weighted final score ─────────────────────────────────────────────────────

describe('computeMatch – weighted final score', () => {
  it('returns 100 when all components are perfect', () => {
    const r = computeMatch({
      userSkills: ['Python'],
      skillRatings: { Python: 5 },
      hourlyRate: 100,
      jobSkills: ['Python'],
      jobRateMin: 100,
      jobRateMax: 100,
      jobPostedAt: NOW,
    })
    // skillScore=100, rateScore=100, recencyScore=100 → 100
    expect(r.score).toBe(100)
  })

  it('applies weights: skill 60%, rate 20%, recency 20%', () => {
    // skillScore=0 (no skills matched), rateScore=100, recencyScore=50
    // raw = 0*0.6 + 100*0.2 + 50*0.2 = 0 + 20 + 10 = 30
    const r = computeMatch({
      ...base,
      hourlyRate: 100,
      jobSkills: ['Python'],
      jobRateMin: 100,
      jobRateMax: 100,
      jobPostedAt: daysAgo(15), // recencyScore=50
    })
    expect(r.score).toBe(30)
    expect(r.isCapped).toBe(false) // < 3 job skills → no cap
  })
})
