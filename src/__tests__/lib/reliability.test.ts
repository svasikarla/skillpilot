import { describe, it, expect } from 'vitest'
import { scoreReliability, tierLabel, tierFromScore } from '@/lib/reliability'

const longDesc = (extras = '') =>
  `We are hiring an ML engineer with github skills. Technical interview required. Full-time contract with milestone payment. ${extras}`.padEnd(310, ' ')

// ── scoreReliability ─────────────────────────────────────────────────────────

describe('scoreReliability', () => {
  it('gives a green score for a well-formed tier-1 job', () => {
    const result = scoreReliability({
      title: 'Senior ML Engineer',
      description: longDesc(),
      platform: 'upwork',
      rate_min: 100,
      rate_max: 150,
      company: 'Acme Corp',
      url: null,
    })
    // 50 + 25(t1) + 8(rate) + 5(company) + 5(desc>300) + 5(quality) = 98
    expect(result.score).toBe(98)
    expect(result.tier).toBe('green')
    expect(result.flags).toContain('Tier 1 platform')
    expect(result.flags).toContain('Rate disclosed')
    expect(result.flags).toContain('Company named')
    expect(result.flags).toContain('Detailed description')
    expect(result.flags).toContain('Professional process mentioned')
  })

  it('gives an amber score for a tier-2 job with company but no rate', () => {
    const result = scoreReliability({
      title: 'ML Engineer',
      description: 'We are hiring an ML engineer to work on data pipelines. Remote position. Strong Python skills required. Apply today.',
      platform: 'remotive',
      rate_min: null,
      rate_max: null,
      company: 'DataCo',
      url: null,
    })
    // 50 + 12(t2) + 5(company) = 67; no rate, no >300 desc, no quality, desc>80 so no penalty
    expect(result.score).toBe(67)
    expect(result.tier).toBe('amber')
    expect(result.flags).toContain('Tier 2 platform')
  })

  it('gives a red score for a scam job with multiple red-flag phrases', () => {
    const result = scoreReliability({
      title: 'Easy money job',
      description: 'Contact us on whatsapp or telegram to start earning.',
      platform: 'unknown',
      rate_min: null,
      rate_max: null,
      company: null,
      url: null,
    })
    // scam phrases: 'easy money', 'whatsapp', 'telegram' → 3 found → -35*2 = -70
    // no company → -8; short desc → -15; start 50 → 50-70-8-15 = -43 → 0
    expect(result.score).toBe(0)
    expect(result.tier).toBe('red')
    expect(result.flags.some(f => f.startsWith('Red flag:'))).toBe(true)
  })

  it('applies a single-scam-phrase penalty of -35', () => {
    const result = scoreReliability({
      title: 'ML Job',
      description: 'Send us a wire transfer to begin. We are a legitimate company with real projects.'.padEnd(85, ' '),
      platform: 'unknown',
      rate_min: null,
      rate_max: null,
      company: 'LegitCo',
      url: null,
    })
    // 50 + 5(company) - 35(1 scam) = 20 → clamped 20
    expect(result.score).toBe(20)
    expect(result.tier).toBe('red')
  })

  it('penalises jobs with no company name', () => {
    const withCompany = scoreReliability({
      title: 'ML Engineer', description: 'Good job.', platform: 'unknown',
      rate_min: null, rate_max: null, company: 'Acme', url: null,
    })
    const withoutCompany = scoreReliability({
      title: 'ML Engineer', description: 'Good job.', platform: 'unknown',
      rate_min: null, rate_max: null, company: null, url: null,
    })
    expect(withCompany.score).toBeGreaterThan(withoutCompany.score)
    expect(withoutCompany.flags).toContain('No company name')
  })

  it('penalises jobs with short description (<80 chars)', () => {
    const result = scoreReliability({
      title: 'ML Job',
      description: 'Short.',
      platform: 'unknown',
      rate_min: null,
      rate_max: null,
      company: null,
      url: null,
    })
    expect(result.flags).toContain('Too short description')
  })

  it('penalises unusually high hourly rate (>$400)', () => {
    const result = scoreReliability({
      title: 'ML Job',
      description: longDesc(),
      platform: 'upwork',
      rate_min: 500,
      rate_max: null,
      company: 'Acme',
      url: null,
    })
    expect(result.flags).toContain('Unusually high hourly rate')
  })

  it('adds LinkedIn signal for linkedin.com URLs', () => {
    const without = scoreReliability({
      title: 'ML Job', description: longDesc(), platform: 'unknown',
      rate_min: null, rate_max: null, company: 'Acme', url: null,
    })
    const with_ = scoreReliability({
      title: 'ML Job', description: longDesc(), platform: 'unknown',
      rate_min: null, rate_max: null, company: 'Acme', url: 'https://linkedin.com/jobs/123',
    })
    expect(with_.score).toBe(without.score + 5)
    expect(with_.flags).toContain('LinkedIn listing')
  })

  it('clamps score to 0 minimum', () => {
    const result = scoreReliability({
      title: 'guaranteed income be your own boss earn $1000 a day',
      description: 'crypto payment bitcoin payment western union moneygram.',
      platform: 'unknown',
      rate_min: null,
      rate_max: null,
      company: null,
      url: null,
    })
    expect(result.score).toBe(0)
  })

  it('clamps score to 100 maximum', () => {
    // Even with all signals stacked, score should not exceed 100
    const result = scoreReliability({
      title: 'Senior ML Engineer',
      description: longDesc('interview github portfolio take-home technical assessment full-time contract'),
      platform: 'upwork',
      rate_min: 100,
      rate_max: 150,
      company: 'Acme Corp',
      url: 'https://linkedin.com/jobs/123',
    })
    expect(result.score).toBeLessThanOrEqual(100)
  })
})

// ── tierLabel ────────────────────────────────────────────────────────────────

describe('tierLabel', () => {
  it('returns Verified for green', () => expect(tierLabel('green')).toBe('Verified'))
  it('returns Review for amber', () => expect(tierLabel('amber')).toBe('Review'))
  it('returns Caution for red', () => expect(tierLabel('red')).toBe('Caution'))
})

// ── tierFromScore ────────────────────────────────────────────────────────────

describe('tierFromScore', () => {
  it.each<[number, 'green' | 'amber' | 'red']>([
    [100, 'green'],
    [70, 'green'],
    [69, 'amber'],
    [40, 'amber'],
    [39, 'red'],
    [0, 'red'],
  ])('score %i → %s', (score, expected) => {
    expect(tierFromScore(score)).toBe(expected)
  })
})
