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

// ── Fit-unknown fallback (job lists no skills) ───────────────────────────────

describe('computeMatch – jobs with no extracted skills', () => {
  it('uses a neutral fit prior instead of skillScore 0 (no semantic)', () => {
    // fit=50, rate=50 (neutral), recency=100 → 50*0.6 + 50*0.2 + 100*0.2 = 60
    const r = computeMatch(base)
    expect(r.skillScore).toBe(0)
    expect(r.score).toBe(60)
  })

  it('uses the semantic score as the fit signal when available', () => {
    // fit=semantic=80 → 80*0.5 + 50*0.15 + 100*0.15 + 80*0.2 = 78.5 → 79
    const r = computeMatch({ ...base, semanticScore: 80 })
    expect(r.score).toBe(79)
  })

  it('still uses real skillScore when the job lists skills', () => {
    // skillScore 0 with listed skills is a genuine mismatch, not fit-unknown
    const r = computeMatch({ ...base, jobSkills: ['Python', 'ML'] })
    expect(r.score).toBe(30) // 0*0.6 + 50*0.2 + 100*0.2
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

  it('stays neutral for fixed-budget projects (total budget ≠ hourly rate)', () => {
    // A $500 fixed budget must not be read as $500/hr…
    const high = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 500, jobRateMax: 1500, jobRateType: 'fixed' })
    expect(high.rateScore).toBe(50)
    // …nor a $50 budget as an insultingly low hourly rate.
    const low = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 30, jobRateMax: 50, jobRateType: 'fixed' })
    expect(low.rateScore).toBe(50)
  })

  it('scores hourly listings normally when jobRateType is explicitly hourly', () => {
    const r = computeMatch({ ...base, hourlyRate: 100, jobRateMin: 100, jobRateMax: 120, jobRateType: 'hourly' })
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

// ── Semantic scoring ─────────────────────────────────────────────────────────
describe('computeMatch – semantic scoring', () => {
  it('reports semanticScore 0 when none is supplied', () => {
    expect(computeMatch(base).semanticScore).toBe(0)
  })

  it('rounds the supplied semanticScore', () => {
    // Job lists no skills → fit falls back to semantic (79.6→80).
    // raw = 80*0.5 + 50*0.15 + 100*0.15 + 80*0.20 = 40 + 7.5 + 15 + 16 = 78.5 → 79
    const r = computeMatch({ ...base, semanticScore: 79.6 })
    expect(r.semanticScore).toBe(80)
    expect(r.score).toBe(79)
  })

  it('applies semantic weights: skill 50%, rate 15%, recency 15%, semantic 20%', () => {
    // skill=0, rate=100, recency=0 (30d), semantic=80
    // raw = 0*0.5 + 100*0.15 + 0*0.15 + 80*0.20 = 15 + 16 = 31
    const r = computeMatch({
      ...base,
      hourlyRate: 100, jobSkills: ['Python'], jobRateMin: 100, jobRateMax: 100,
      jobPostedAt: daysAgo(30),
      semanticScore: 80,
    })
    expect(r.score).toBe(31)
  })

  it('reaches 100 when every component including semantic is perfect', () => {
    const r = computeMatch({
      ...base,
      userSkills: ['Python'], skillRatings: { Python: 5 }, jobSkills: ['Python'],
      hourlyRate: 100, jobRateMin: 100, jobRateMax: 100,
      jobPostedAt: NOW,
      semanticScore: 100,
    })
    expect(r.score).toBe(100)
  })

  it('treats an explicit semanticScore of 0 as "semantic available" and shifts the weights', () => {
    const common = { ...base, userSkills: ['Python'], skillRatings: { Python: 5 }, jobSkills: ['Python'] }
    // skill=100, rate=50, recency=100 for both.
    // with semantic:    100*0.5 + 50*0.15 + 100*0.15 + 0*0.20 = 72.5 → 73
    // without semantic: 100*0.6 + 50*0.20 + 100*0.20           = 90
    expect(computeMatch({ ...common, semanticScore: 0 }).score).toBe(73)
    expect(computeMatch(common).score).toBe(90)
  })
})
