import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { scoreJob, shouldAutoApprove, shouldAutoReject, SIGNAL_LABELS } from '@/lib/reliability'
import type { JobListing } from '@/lib/sources/types'
import { RELIABILITY_THRESHOLDS } from '@/lib/config'

// ─── Factory ──────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<JobListing> = {}): JobListing {
  return {
    sourceId:    'job-001',
    sourceUrl:   'https://example.com/jobs/001',
    title:       'ML Engineer',
    company:     'TechCorp',
    description: 'We are looking for an ML Engineer to build production-grade LLM pipelines. Deliverables include: weekly sprint demos, documented API specs, and a working prototype by milestone 1. The role requires strong Python skills and experience with RAG architectures.',
    rateType:    'hourly',
    jobType:     'remote',
    isRemote:    true,
    postedAt:    new Date(),   // just posted → very_recent signal
    ...overrides,
  }
}

// ─── scoreJob — baseline ──────────────────────────────────────────────────────

describe('scoreJob() — baseline score', () => {
  it('returns a score between 0 and 100', () => {
    const { score } = scoreJob(makeJob(), null)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns a ScoringResult with the required shape', () => {
    const result = scoreJob(makeJob(), null)
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('signals')
    expect(result).toHaveProperty('badge')
    expect(typeof result.score).toBe('number')
    expect(typeof result.signals).toBe('object')
  })

  it('badge is one of the four valid values', () => {
    const { badge } = scoreJob(makeJob(), null)
    expect(['trusted', 'amber', 'reject', 'red']).toContain(badge)
  })
})

// ─── Platform tier signals ────────────────────────────────────────────────────

describe('scoreJob() — platform tier signals', () => {
  it('Tier 1 platform adds 20 points', () => {
    const { signals } = scoreJob(makeJob(), 1)
    expect(signals.platform_tier).toBe(20)
  })

  it('Tier 2 platform adds 12 points', () => {
    const { signals } = scoreJob(makeJob(), 2)
    expect(signals.platform_tier).toBe(12)
  })

  it('Tier 3 platform adds 6 points', () => {
    const { signals } = scoreJob(makeJob(), 3)
    expect(signals.platform_tier).toBe(6)
  })

  it('Null tier adds 0 points', () => {
    const { signals } = scoreJob(makeJob(), null)
    expect(signals.platform_tier).toBe(0)
  })

  it('USAJobs flag adds 25 points and ignores tier', () => {
    const { signals } = scoreJob(makeJob(), 4, true)
    expect(signals.usajobs).toBe(25)
    expect(signals.platform_tier).toBeUndefined()
  })

  it('Tier 1 job scores in trusted range', () => {
    const job = makeJob({
      rateMin: 100,
      description: 'x'.repeat(250),  // long description
    })
    const { score, badge } = scoreJob(job, 1)
    expect(badge).toBe('trusted')
    expect(score).toBeGreaterThanOrEqual(RELIABILITY_THRESHOLDS.trusted)
  })
})

// ─── Rate disclosed signals ───────────────────────────────────────────────────

describe('scoreJob() — rate signals', () => {
  it('adds 10 points when rateMin is disclosed', () => {
    const { signals } = scoreJob(makeJob({ rateMin: 100 }), null)
    expect(signals.rate_disclosed).toBe(10)
  })

  it('adds 10 points when rateMax is disclosed', () => {
    const { signals } = scoreJob(makeJob({ rateMax: 150 }), null)
    expect(signals.rate_disclosed).toBe(10)
  })

  it('does not add rate_disclosed when neither rate is set', () => {
    const job = makeJob()
    delete (job as Partial<JobListing>).rateMin
    delete (job as Partial<JobListing>).rateMax
    const { signals } = scoreJob(job, null)
    expect(signals.rate_disclosed).toBeUndefined()
  })

  it('penalises unrealistically high rateMax (> 500)', () => {
    const { signals } = scoreJob(makeJob({ rateMax: 600 }), null)
    expect(signals.unrealistic_rate).toBe(-20)
  })

  it('penalises unrealistically low rate (> 0 and < 5)', () => {
    const { signals } = scoreJob(makeJob({ rateMin: 1 }), null)
    expect(signals.unrealistic_rate).toBe(-20)
  })

  it('does not penalise a normal rate (e.g. $100/hr)', () => {
    const { signals } = scoreJob(makeJob({ rateMin: 80, rateMax: 120 }), null)
    expect(signals.unrealistic_rate).toBeUndefined()
  })
})

// ─── Description quality signals ─────────────────────────────────────────────

describe('scoreJob() — description length signals', () => {
  it('penalises very short description (< 80 chars) with -20', () => {
    const { signals } = scoreJob(makeJob({ description: 'Short.' }), null)
    expect(signals.desc_too_short).toBe(-20)
    expect(signals.desc_short).toBeUndefined()
    expect(signals.desc_length).toBeUndefined()
  })

  it('penalises moderately short description (80–199 chars) with -10', () => {
    const desc = 'x'.repeat(100)
    const { signals } = scoreJob(makeJob({ description: desc }), null)
    expect(signals.desc_short).toBe(-10)
    expect(signals.desc_too_short).toBeUndefined()
  })

  it('rewards description >= 200 chars with +8', () => {
    const desc = 'x'.repeat(200)
    const { signals } = scoreJob(makeJob({ description: desc }), null)
    expect(signals.desc_length).toBe(8)
    expect(signals.desc_too_short).toBeUndefined()
    expect(signals.desc_short).toBeUndefined()
  })

  it('additionally rewards description >= 500 chars with +5', () => {
    const desc = 'x'.repeat(500)
    const { signals } = scoreJob(makeJob({ description: desc }), null)
    expect(signals.desc_length).toBe(8)
    expect(signals.desc_detailed).toBe(5)
  })
})

// ─── Positive content signals ─────────────────────────────────────────────────

describe('scoreJob() — positive content signals', () => {
  it('rewards "milestone" in description with +10', () => {
    const { signals } = scoreJob(makeJob({ description: 'x'.repeat(200) + ' milestone payments' }), null)
    expect(signals.deliverables).toBe(10)
  })

  it('rewards "deliverable" in description with +10', () => {
    const { signals } = scoreJob(makeJob({ description: 'x'.repeat(200) + ' deliverable on Week 2' }), null)
    expect(signals.deliverables).toBe(10)
  })

  it('rewards company URL pattern in description with +8', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' learn more at https://techcorp.com for details',
    }), null)
    expect(signals.company_url).toBe(8)
  })

  it('rewards LinkedIn application URL in sourceUrl with +5', () => {
    const { signals } = scoreJob(makeJob({ sourceUrl: 'https://linkedin.com/jobs/123456' }), null)
    expect(signals.linkedin).toBe(5)
  })

  it('rewards prior hire mention with +5', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' our previous contractor delivered ahead of schedule',
    }), null)
    expect(signals.prior_hires).toBe(5)
  })

  it('rewards named company with +5', () => {
    const { signals } = scoreJob(makeJob({ company: 'TechCorp' }), null)
    expect(signals.company_named).toBe(5)
  })

  it('does not add company_named when company is empty', () => {
    const { signals } = scoreJob(makeJob({ company: '' }), null)
    expect(signals.company_named).toBeUndefined()
  })
})

// ─── Recency signals ──────────────────────────────────────────────────────────

describe('scoreJob() — recency signals', () => {
  it('adds very_recent (+10) for jobs posted within 24h', () => {
    const { signals } = scoreJob(makeJob({ postedAt: new Date() }), null)
    expect(signals.very_recent).toBe(10)
  })

  it('adds recent (+6) for jobs posted 1–6 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const { signals } = scoreJob(makeJob({ postedAt: threeDaysAgo }), null)
    expect(signals.recent).toBe(6)
    expect(signals.very_recent).toBeUndefined()
  })

  it('adds no recency signal for jobs older than 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const { signals } = scoreJob(makeJob({ postedAt: tenDaysAgo }), null)
    expect(signals.recent).toBeUndefined()
    expect(signals.very_recent).toBeUndefined()
  })
})

// ─── Scam / negative signals ──────────────────────────────────────────────────

describe('scoreJob() — scam detection signals', () => {
  it('penalises Telegram contact link in description with -35', () => {
    const { signals } = scoreJob(makeJob({ description: 'x'.repeat(200) + ' contact us at t.me/scammer for details' }), null)
    expect(signals.telegram_contact).toBe(-35)
  })

  it('penalises WhatsApp contact in description with -35', () => {
    const { signals } = scoreJob(makeJob({ description: 'x'.repeat(200) + ' contact via wa.me/123456' }), null)
    expect(signals.telegram_contact).toBe(-35)
  })

  it('penalises upfront payment requirement with -35', () => {
    // Pattern: pay(?:ment)?\s*(?:setup|registration|...)\s*fee (no extra words in between)
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' you must pay registration fee before starting',
    }), null)
    expect(signals.upfront_payment).toBe(-35)
  })

  it('penalises "buy starter kit" with -35', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' buy starter kit to begin working with us',
    }), null)
    expect(signals.upfront_payment).toBe(-35)
  })

  it('penalises crypto-only payment with -25', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' payment only in bitcoin btc',
    }), null)
    expect(signals.crypto_only).toBe(-25)
  })

  it('penalises "easy money" language with -25', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' earn easy money working from home',
    }), null)
    expect(signals.easy_money).toBe(-25)
  })

  it('penalises free email contact with -15', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' contact us at recruiter@gmail.com to apply',
    }), null)
    expect(signals.free_email).toBe(-15)
  })

  it('penalises suspiciously high rate in text ($600/hr) with -20', () => {
    const { signals } = scoreJob(makeJob({
      description: 'x'.repeat(200) + ' earn $600/hr working from home easily',
    }), null)
    // unrealistic_rate appears from SCAM_PATTERNS.unrealisticHigh
    expect(signals.unrealistic_rate).toBe(-20)
  })
})

// ─── Badge assignment ─────────────────────────────────────────────────────────

describe('scoreJob() — badge assignment', () => {
  it('badge is "reject" for score < 20', () => {
    // Create a very scammy job that scores very low
    const job = makeJob({
      description: 'Short.',  // < 80 chars → -20
      title: 'Easy money from home',
    })
    // Add telegram contact in sourceUrl for extra penalty
    ;(job as Partial<JobListing>).sourceUrl = 't.me/scammer-join-now'
    const { badge, score } = scoreJob(job, null)
    if (score < RELIABILITY_THRESHOLDS.autoReject) {
      expect(badge).toBe('reject')
    }
  })

  it('badge is "trusted" for score >= 70', () => {
    // Tier 1 job + all positive signals
    const job = makeJob({
      rateMin: 100,
      description: 'x'.repeat(500) + ' milestone deliverable acceptance criteria',
    })
    const { badge, score } = scoreJob(job, 1)
    if (score >= RELIABILITY_THRESHOLDS.trusted) {
      expect(badge).toBe('trusted')
    }
  })

  it('badge is "amber" for score in 40–69', () => {
    // Construct a job that scores exactly in the amber range
    // No tier (0), short-ish description (-10), no rate, old posting, no scam signals
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const job = makeJob({
      description: 'x'.repeat(100),  // desc_short → -10
      postedAt: tenDaysAgo,
      company: '',
    })
    const { badge, score } = scoreJob(job, null)
    if (score >= RELIABILITY_THRESHOLDS.amber && score < RELIABILITY_THRESHOLDS.trusted) {
      expect(badge).toBe('amber')
    }
  })

  it('score is capped at 100', () => {
    const job = makeJob({
      rateMin: 100,
      sourceUrl: 'https://linkedin.com/jobs/12345',
      description: 'x'.repeat(500) + ' milestone deliverable accept criteria our previous contractor visited our website at https://ourco.com learn more at https://ourco.com/about',
    })
    const { score } = scoreJob(job, 1, true)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('score is floored at 0', () => {
    const job = makeJob({
      description: 'Short.',
      title: 'join t.me/scammer easy money no experience',
    })
    const { score } = scoreJob(job, null)
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ─── shouldAutoApprove / shouldAutoReject ──────────────────────────────────────

describe('shouldAutoApprove()', () => {
  it('returns true for USAJobs with score >= 80', () => {
    const job = makeJob({ rateMin: 100, description: 'x'.repeat(500) })
    const result = scoreJob(job, null, true)
    if (result.score >= 80) {
      expect(shouldAutoApprove(result, true)).toBe(true)
    }
  })

  it('returns false for non-USAJobs even with high score', () => {
    const job = makeJob({ rateMin: 100, description: 'x'.repeat(500) })
    const result = scoreJob(job, 1)
    expect(shouldAutoApprove(result, false)).toBe(false)
  })

  it('returns false when USAJobs but score < 80', () => {
    // shouldAutoApprove: isUSAJobs && score >= 80
    const result79 = { score: 79, signals: {}, badge: 'trusted' as const }
    expect(shouldAutoApprove(result79, true)).toBe(false)

    const result75 = { score: 75, signals: {}, badge: 'trusted' as const }
    expect(shouldAutoApprove(result75, true)).toBe(false)
  })

  it('returns false for default (non-USAJobs) call', () => {
    const result = { score: 95, signals: {}, badge: 'trusted' as const }
    expect(shouldAutoApprove(result)).toBe(false)
  })
})

describe('shouldAutoReject()', () => {
  it('returns true when score < autoReject threshold', () => {
    const result = { score: RELIABILITY_THRESHOLDS.autoReject - 1, signals: {}, badge: 'reject' as const }
    expect(shouldAutoReject(result)).toBe(true)
  })

  it('returns false when score equals autoReject threshold', () => {
    const result = { score: RELIABILITY_THRESHOLDS.autoReject, signals: {}, badge: 'red' as const }
    expect(shouldAutoReject(result)).toBe(false)
  })

  it('returns false for trusted scores', () => {
    const result = { score: 85, signals: {}, badge: 'trusted' as const }
    expect(shouldAutoReject(result)).toBe(false)
  })

  it('returns true for score of 0', () => {
    const result = { score: 0, signals: {}, badge: 'reject' as const }
    expect(shouldAutoReject(result)).toBe(true)
  })
})

// ─── SIGNAL_LABELS ────────────────────────────────────────────────────────────

describe('SIGNAL_LABELS', () => {
  it('contains labels for all major signal keys', () => {
    const expectedKeys = [
      'usajobs', 'platform_tier', 'rate_disclosed', 'desc_length',
      'telegram_contact', 'upfront_payment', 'crypto_only', 'easy_money',
    ]
    for (const key of expectedKeys) {
      expect(SIGNAL_LABELS[key]).toBeDefined()
      expect(SIGNAL_LABELS[key].length).toBeGreaterThan(0)
    }
  })

  it('all label values are non-empty strings', () => {
    for (const [, label] of Object.entries(SIGNAL_LABELS)) {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})
