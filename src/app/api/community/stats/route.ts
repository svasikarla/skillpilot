import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  // Fetch all applications in last 30 days (service role bypasses RLS to get all members' data)
  // Using anon client here — we only return aggregated anonymous data, no PII
  const { data: apps } = await supabase
    .from('applications')
    .select('status, rate_agreed, jobs(platform, rate_min, rate_max)')
    .not('applied_at', 'is', null)
    .gte('applied_at', thirtyDaysAgo)

  const total     = apps?.length ?? 0
  const wins      = apps?.filter(a => a.status === 'won').length ?? 0
  const winRate   = total > 0 ? Math.round((wins / total) * 100) : 0
  const avgWinRate = wins > 0
    ? Math.round((apps ?? []).filter(a => a.status === 'won' && a.rate_agreed).reduce((s, a) => s + (a.rate_agreed ?? 0), 0) / wins)
    : 0

  // Platform breakdown
  const platformMap = new Map<string, { applied: number; won: number }>()
  for (const app of apps ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const platform = ((app.jobs as any)?.[0]?.platform ?? (app.jobs as any)?.platform ?? 'Unknown') as string
    const entry = platformMap.get(platform) ?? { applied: 0, won: 0 }
    entry.applied += 1
    if (app.status === 'won') entry.won += 1
    platformMap.set(platform, entry)
  }

  const platformStats = Array.from(platformMap.entries())
    .map(([platform, { applied, won }]) => ({
      platform,
      applied,
      won,
      win_rate: applied > 0 ? Math.round((won / applied) * 100) : 0,
    }))
    .filter(p => p.applied >= 1)
    .sort((a, b) => b.win_rate - a.win_rate)

  const bestPlatform = platformStats[0] ?? null

  // Recent anonymous wins
  const recentWins = (apps ?? [])
    .filter(a => a.status === 'won')
    .slice(0, 5)
    .map(a => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      platform: ((a.jobs as any)?.[0]?.platform ?? (a.jobs as any)?.platform ?? 'Unknown') as string,
      rate: a.rate_agreed ?? null,
    }))

  return NextResponse.json({
    period: '30 days',
    total_applied: total,
    total_won: wins,
    win_rate: winRate,
    avg_win_rate: avgWinRate,
    best_platform: bestPlatform,
    platform_stats: platformStats,
    recent_wins: recentWins,
  })
}
