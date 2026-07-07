import { createClient } from '@supabase/supabase-js'

export interface PlatformBenchmark {
  platform: string
  count: number
  min: number
  p25: number
  p50: number
  p75: number
  max: number
  avg: number
  /** 'community' = members' won contracts; 'market' = platform's published AI/ML range. */
  source: 'community' | 'market'
}

export interface WonRate {
  platform: string
  rate: number
}

export interface PlatformMarketRate {
  name: string
  rate_min_aiml: number | null
  rate_max_aiml: number | null
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

/** Percentile benchmarks from members' won contract rates. */
export function communityBenchmarks(rows: WonRate[]): PlatformBenchmark[] {
  const groups = new Map<string, number[]>()
  for (const { platform, rate } of rows) {
    if (!platform || !rate) continue
    if (!groups.has(platform)) groups.set(platform, [])
    groups.get(platform)!.push(rate)
  }

  return Array.from(groups.entries())
    .map(([platform, rates]) => {
      const sorted = [...rates].sort((a, b) => a - b)
      const avg = Math.round(sorted.reduce((s, v) => s + v, 0) / sorted.length)
      return {
        platform,
        count: sorted.length,
        min:   sorted[0],
        p25:   percentile(sorted, 25),
        p50:   percentile(sorted, 50),
        p75:   percentile(sorted, 75),
        max:   sorted[sorted.length - 1],
        avg,
        source: 'community' as const,
      }
    })
    .sort((a, b) => b.count - a.count)
}

/**
 * Cold-start fallback: with 25–30 members just starting out, won-contract data
 * takes months to accumulate. Until a platform has community wins, show its
 * published AI/ML rate range (platforms.rate_min_aiml/rate_max_aiml) as a
 * market estimate — clearly labelled via source: 'market'.
 */
export function withMarketFallback(
  community: PlatformBenchmark[],
  platforms: PlatformMarketRate[],
): PlatformBenchmark[] {
  const covered = new Set(community.map(b => b.platform))
  const market: PlatformBenchmark[] = platforms
    .filter(p => !covered.has(p.name) && p.rate_min_aiml && p.rate_max_aiml)
    .map(p => {
      const min = p.rate_min_aiml!
      const max = p.rate_max_aiml!
      const mid = Math.round((min + max) / 2)
      return {
        platform: p.name,
        count: 0,
        min,
        p25: Math.round(min + (max - min) * 0.25),
        p50: mid,
        p75: Math.round(min + (max - min) * 0.75),
        max,
        avg: mid,
        source: 'market' as const,
      }
    })
    .sort((a, b) => b.p50 - a.p50)
  return [...community, ...market]
}

// Uses service role to aggregate all members' won outcomes — anonymised, no PII returned
export async function computeRateBenchmarks(): Promise<PlatformBenchmark[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: won }, { data: platforms }] = await Promise.all([
    supabase
      .from('applications')
      .select('rate_agreed, jobs!inner(platform)')
      .eq('status', 'won')
      .not('rate_agreed', 'is', null),
    supabase
      .from('platforms')
      .select('name, rate_min_aiml, rate_max_aiml'),
  ])

  const rows: WonRate[] = (won ?? []).flatMap(row => {
    const platform = (row.jobs as unknown as { platform: string } | null)?.platform
    const rate = row.rate_agreed as number | null
    return platform && rate ? [{ platform, rate }] : []
  })

  return withMarketFallback(communityBenchmarks(rows), platforms ?? [])
}
