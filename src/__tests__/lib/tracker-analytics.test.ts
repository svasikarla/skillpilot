import { describe, it, expect } from 'vitest'
import { computeTrackerAnalytics, DAY_MS } from '@/lib/tracker-analytics'

const NOW = Date.UTC(2026, 5, 14) // fixed reference point for deterministic staleness

let seq = 0
function app(
  fields: { status: string; rate_agreed?: number | null },
  daysAgo = 0,
) {
  return {
    id: `app-${seq++}`,
    status: fields.status,
    rate_agreed: fields.rate_agreed ?? null,
    updated_at: new Date(NOW - daysAgo * DAY_MS).toISOString(),
  }
}

describe('computeTrackerAnalytics – empty', () => {
  it('returns zeroed stats and null rates for no applications', () => {
    const r = computeTrackerAnalytics([], NOW)
    expect(r.stats).toEqual({ saved: 0, applied: 0, won: 0, total: 0 })
    expect(r.decidedCount).toBe(0)
    expect(r.winRate).toBeNull()
    expect(r.avgWonRate).toBeNull()
    expect(r.staleApps).toEqual([])
  })
})

describe('computeTrackerAnalytics – pipeline stats', () => {
  it('counts saved, applied (excluding in_progress), won and total', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'saved' }), app({ status: 'saved' }),
      app({ status: 'submitted' }), app({ status: 'interviewing' }), app({ status: 'negotiating' }),
      app({ status: 'in_progress' }),
      app({ status: 'won' }),
      app({ status: 'lost' }),
    ], NOW)
    expect(r.stats.saved).toBe(2)
    expect(r.stats.applied).toBe(3)
    expect(r.stats.won).toBe(1)
    expect(r.stats.total).toBe(8)
  })
})

describe('computeTrackerAnalytics – win rate', () => {
  it('is the won share of decided applications, rounded', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'won' }), app({ status: 'won' }),
      app({ status: 'lost' }), app({ status: 'no_response' }),
    ], NOW)
    expect(r.decidedCount).toBe(4)
    expect(r.winRate).toBe(50)
  })

  it('rounds to the nearest whole percent', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'won' }), app({ status: 'lost' }), app({ status: 'lost' }),
    ], NOW)
    expect(r.winRate).toBe(33)
  })

  it('is null while nothing is decided (active/saved only)', () => {
    const r = computeTrackerAnalytics([app({ status: 'saved' }), app({ status: 'submitted' })], NOW)
    expect(r.winRate).toBeNull()
  })
})

describe('computeTrackerAnalytics – average won rate', () => {
  it('averages agreed rates across won apps, ignoring those without a rate', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'won', rate_agreed: 100 }),
      app({ status: 'won', rate_agreed: 150 }),
      app({ status: 'won', rate_agreed: null }),
      app({ status: 'submitted', rate_agreed: 999 }),
    ], NOW)
    expect(r.avgWonRate).toBe(125)
  })

  it('rounds the average', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'won', rate_agreed: 100 }),
      app({ status: 'won', rate_agreed: 100 }),
      app({ status: 'won', rate_agreed: 101 }),
    ], NOW)
    expect(r.avgWonRate).toBe(100)
  })

  it('is null when no won application has an agreed rate', () => {
    const r = computeTrackerAnalytics([app({ status: 'won', rate_agreed: null }), app({ status: 'lost' })], NOW)
    expect(r.avgWonRate).toBeNull()
  })
})

describe('computeTrackerAnalytics – stale follow-ups', () => {
  it('flags only active apps past the stale window, oldest first', () => {
    const r = computeTrackerAnalytics([
      app({ status: 'submitted' }, 10),
      app({ status: 'interviewing' }, 8),
      app({ status: 'in_progress' }, 3),   // fresh
      app({ status: 'negotiating' }, 20),
      app({ status: 'won' }, 30),           // not active
      app({ status: 'saved' }, 30),         // not active
    ], NOW)
    expect(r.staleApps.map(s => s.daysStale)).toEqual([20, 10, 8])
  })

  it('treats exactly the threshold as still fresh (strict greater-than)', () => {
    const r = computeTrackerAnalytics([app({ status: 'submitted' }, 7)], NOW)
    expect(r.staleApps).toEqual([])
  })

  it('caps the list with maxStale', () => {
    const r = computeTrackerAnalytics(
      [app({ status: 'submitted' }, 10), app({ status: 'submitted' }, 9), app({ status: 'submitted' }, 8)],
      NOW,
      { maxStale: 2 },
    )
    expect(r.staleApps.map(s => s.daysStale)).toEqual([10, 9])
  })

  it('honours a custom staleDays window', () => {
    const apps = [app({ status: 'submitted' }, 6)]
    expect(computeTrackerAnalytics(apps, NOW).staleApps).toHaveLength(0)
    expect(computeTrackerAnalytics(apps, NOW, { staleDays: 5 }).staleApps).toHaveLength(1)
  })

  it('returns the original application object alongside the day count', () => {
    const a = app({ status: 'submitted' }, 10)
    const r = computeTrackerAnalytics([a], NOW)
    expect(r.staleApps[0].application).toBe(a)
    expect(r.staleApps[0].daysStale).toBe(10)
  })
})
