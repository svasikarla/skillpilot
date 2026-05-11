import { describe, it, expect } from 'vitest'
import {
  MATCH_WEIGHTS,
  RELIABILITY_THRESHOLDS,
  MATCH_THRESHOLDS,
  PROPOSAL,
  EMBEDDING,
  MODELS,
  FEED,
  SCAM,
  PLATFORM_GUIDE,
  GROUP,
  PROFILE,
} from '@/lib/config'

describe('MATCH_WEIGHTS', () => {
  it('all weights are positive', () => {
    for (const v of Object.values(MATCH_WEIGHTS)) {
      expect(v).toBeGreaterThan(0)
    }
  })

  it('weights sum to 1.0 (within floating-point tolerance)', () => {
    const sum = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('skill weight dominates (highest weight)', () => {
    const vals = Object.values(MATCH_WEIGHTS)
    expect(MATCH_WEIGHTS.skill).toBe(Math.max(...vals))
  })

  it('has the five expected dimensions', () => {
    expect(Object.keys(MATCH_WEIGHTS)).toEqual(
      expect.arrayContaining(['skill', 'semantic', 'rate', 'exp', 'avail'])
    )
  })
})

describe('RELIABILITY_THRESHOLDS', () => {
  it('thresholds are strictly increasing', () => {
    expect(RELIABILITY_THRESHOLDS.autoReject).toBeLessThan(RELIABILITY_THRESHOLDS.amber)
    expect(RELIABILITY_THRESHOLDS.amber).toBeLessThan(RELIABILITY_THRESHOLDS.trusted)
  })

  it('autoReject is below 40', () => {
    expect(RELIABILITY_THRESHOLDS.autoReject).toBeLessThan(40)
  })

  it('trusted is at most 100', () => {
    expect(RELIABILITY_THRESHOLDS.trusted).toBeLessThanOrEqual(100)
  })
})

describe('MATCH_THRESHOLDS', () => {
  it('nearMiss is below applyReady', () => {
    expect(MATCH_THRESHOLDS.nearMiss).toBeLessThan(MATCH_THRESHOLDS.applyReady)
  })

  it('hardGate is between 0 and 1', () => {
    expect(MATCH_THRESHOLDS.hardGate).toBeGreaterThan(0)
    expect(MATCH_THRESHOLDS.hardGate).toBeLessThan(1)
  })

  it('hardGateCap is between 0 and 1', () => {
    expect(MATCH_THRESHOLDS.hardGateCap).toBeGreaterThan(0)
    expect(MATCH_THRESHOLDS.hardGateCap).toBeLessThanOrEqual(1)
  })

  it('nearSkillCosine threshold is between 0 and 1', () => {
    expect(MATCH_THRESHOLDS.nearSkillCosine).toBeGreaterThan(0)
    expect(MATCH_THRESHOLDS.nearSkillCosine).toBeLessThan(1)
  })
})

describe('PROPOSAL', () => {
  it('daily limit is a positive integer', () => {
    expect(PROPOSAL.dailyLimit).toBeGreaterThan(0)
    expect(Number.isInteger(PROPOSAL.dailyLimit)).toBe(true)
  })

  it('variant word ranges are valid (min < max)', () => {
    for (const [, range] of Object.entries(PROPOSAL.variants)) {
      expect(range.min).toBeLessThan(range.max)
      expect(range.min).toBeGreaterThan(0)
    }
  })

  it('variants are increasingly long (concise < standard < detailed)', () => {
    expect(PROPOSAL.variants.concise.max).toBeLessThan(PROPOSAL.variants.standard.min)
    expect(PROPOSAL.variants.standard.max).toBeLessThan(PROPOSAL.variants.detailed.min)
  })
})

describe('EMBEDDING', () => {
  it('model string is non-empty', () => {
    expect(EMBEDDING.model.length).toBeGreaterThan(0)
  })

  it('dims is a positive power-of-2 friendly number', () => {
    expect(EMBEDDING.dims).toBeGreaterThan(0)
    expect(EMBEDDING.dims % 64).toBe(0)
  })
})

describe('operational constants', () => {
  it('FEED.pageSize is positive', () => {
    expect(FEED.pageSize).toBeGreaterThan(0)
  })

  it('SCAM.reportsToHide is at least 2', () => {
    expect(SCAM.reportsToHide).toBeGreaterThanOrEqual(2)
  })

  it('GROUP.maxMembers is within expected range', () => {
    expect(GROUP.maxMembers).toBeGreaterThan(0)
    expect(GROUP.maxMembers).toBeLessThanOrEqual(200)
  })

  it('PROFILE.maxPortfolioItems is positive', () => {
    expect(PROFILE.maxPortfolioItems).toBeGreaterThan(0)
  })

  it('PLATFORM_GUIDE.staleAfterDays is at least 30', () => {
    expect(PLATFORM_GUIDE.staleAfterDays).toBeGreaterThanOrEqual(30)
  })

  it('MODELS references known claude model strings', () => {
    expect(MODELS.proposals).toMatch(/claude/)
    expect(MODELS.audit).toMatch(/claude/)
    expect(MODELS.standout).toMatch(/claude/)
  })
})
