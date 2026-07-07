import { describe, it, expect } from 'vitest'
import { communityBenchmarks, withMarketFallback } from '@/lib/rate-benchmarking'
import { computeRoadmap } from '@/lib/roadmap'
import { scoreReliability } from '@/lib/reliability'

describe('communityBenchmarks', () => {
  it('computes percentiles per platform from won rates', () => {
    const rows = [80, 90, 100, 110, 120].map(rate => ({ platform: 'Upwork', rate }))
    const [b] = communityBenchmarks(rows)
    expect(b.platform).toBe('Upwork')
    expect(b.count).toBe(5)
    expect(b.min).toBe(80)
    expect(b.p50).toBe(100)
    expect(b.max).toBe(120)
    expect(b.avg).toBe(100)
    expect(b.source).toBe('community')
  })
})

describe('withMarketFallback', () => {
  const platforms = [
    { name: 'Upwork', rate_min_aiml: 60, rate_max_aiml: 120 },
    { name: 'Toptal', rate_min_aiml: 100, rate_max_aiml: 160 },
    { name: 'NoRates', rate_min_aiml: null, rate_max_aiml: null },
  ]

  it('fills platforms without community data using published ranges', () => {
    const merged = withMarketFallback([], platforms)
    expect(merged).toHaveLength(2) // NoRates has no published range
    const toptal = merged.find(b => b.platform === 'Toptal')!
    expect(toptal.source).toBe('market')
    expect(toptal.count).toBe(0)
    expect(toptal.p50).toBe(130)
  })

  it('community data wins over market estimates for the same platform', () => {
    const community = communityBenchmarks([{ platform: 'Upwork', rate: 95 }])
    const merged = withMarketFallback(community, platforms)
    const upwork = merged.filter(b => b.platform === 'Upwork')
    expect(upwork).toHaveLength(1)
    expect(upwork[0].source).toBe('community')
  })
})

describe('fixed budgets stay out of hourly-rate logic', () => {
  it('computeRoadmap counts fixed-budget jobs for demand but not $/hr averages', () => {
    const jobs = [
      { skills: ['LangChain'], rate_min: 100, rate_max: 120, rate_type: 'hourly' as const },
      { skills: ['LangChain'], rate_min: 500, rate_max: 1500, rate_type: 'fixed' as const },
    ]
    const [gap] = computeRoadmap([], [], jobs)
    expect(gap.skill).toBe('LangChain')
    expect(gap.jobsUnlocked).toBe(2)     // both jobs count as demand
    expect(gap.avgRate).toBe(110)        // but only the hourly one prices it
  })

  it('scoreReliability does not flag large fixed budgets as suspicious hourly rates', () => {
    const base = {
      title: 'Build ML pipeline', description: 'x'.repeat(300), platform: 'Freelancer',
      company: null, url: 'https://freelancer.com/p/1', rate_max: 5000,
    }
    const fixed = scoreReliability({ ...base, rate_min: 3000, rate_type: 'fixed' })
    expect(fixed.flags).not.toContain('Unusually high hourly rate')
    const hourly = scoreReliability({ ...base, rate_min: 3000, rate_type: 'hourly' })
    expect(hourly.flags).toContain('Unusually high hourly rate')
  })
})
