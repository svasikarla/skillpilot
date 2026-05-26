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
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

// Uses service role to aggregate all members' won outcomes — anonymised, no PII returned
export async function computeRateBenchmarks(): Promise<PlatformBenchmark[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('applications')
    .select('rate_agreed, jobs!inner(platform)')
    .eq('status', 'won')
    .not('rate_agreed', 'is', null)

  if (error || !data?.length) return []

  const groups = new Map<string, number[]>()
  for (const row of data) {
    const platform = (row.jobs as unknown as { platform: string } | null)?.platform
    const rate = row.rate_agreed as number | null
    if (!platform || !rate) continue
    if (!groups.has(platform)) groups.set(platform, [])
    groups.get(platform)!.push(rate)
  }

  return Array.from(groups.entries())
    .filter(([, rates]) => rates.length >= 1)
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
      }
    })
    .sort((a, b) => b.count - a.count)
}
