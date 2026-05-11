import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createAdminClient()
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const [
    { count: totalApps  },
    { count: totalWins  },
    { count: totalMembers },
    { data: platformApps },
    { data: recentReviews },
    { data: topRateApp },
  ] = await Promise.all([
    // Apps submitted this month
    admin.from('applications')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'saved')
      .gte('created_at', since),

    // Wins this month
    admin.from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'won')
      .gte('created_at', since),

    // Active members
    admin.from('members')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Apps by platform for win-rate calc (last 90 days)
    admin.from('applications')
      .select('platform_id, status')
      .gte('created_at', new Date(Date.now() - 90 * 86_400_000).toISOString())
      .not('platform_id', 'is', null),

    // Recent platform reviews
    admin.from('platform_reviews')
      .select('review_text, rating, created_at, platforms ( name )')
      .order('created_at', { ascending: false })
      .limit(5),

    // Top rate agreed
    admin.from('applications')
      .select('rate_agreed, platforms ( name )')
      .eq('status', 'won')
      .not('rate_agreed', 'is', null)
      .order('rate_agreed', { ascending: false })
      .limit(1),
  ])

  // Compute best platform by win rate
  const platStats = new Map<number, { wins: number; total: number }>()
  for (const app of (platformApps ?? [])) {
    const pid = app.platform_id as number
    if (!platStats.has(pid)) platStats.set(pid, { wins: 0, total: 0 })
    const s = platStats.get(pid)!
    s.total++
    if (app.status === 'won') s.wins++
  }

  let bestPlatformId: number | null = null
  let bestWinRate = 0
  for (const [pid, s] of platStats) {
    if (s.total >= 3) {
      const wr = s.wins / s.total
      if (wr > bestWinRate) { bestWinRate = wr; bestPlatformId = pid }
    }
  }

  // Platform name for best platform
  let bestPlatformName: string | null = null
  if (bestPlatformId !== null) {
    const { data: p } = await admin.from('platforms').select('name').eq('id', bestPlatformId).single()
    bestPlatformName = p?.name ?? null
  }

  // Reviews — handle Supabase join array
  type ReviewRow = { review_text: string; rating: number; created_at: string; platforms: { name: string } | { name: string }[] | null }
  const reviews = (recentReviews ?? []).map((r) => {
    const row = r as unknown as ReviewRow
    const plat = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms
    return { reviewText: row.review_text, rating: row.rating, createdAt: row.created_at, platformName: plat?.name ?? '—' }
  })

  // Top agreed rate
  type RateRow = { rate_agreed: string | number; platforms: { name: string } | { name: string }[] | null }
  const topRate = topRateApp?.[0] as unknown as RateRow | undefined
  const topRatePlatRaw = topRate?.platforms
  const topRatePlat = topRatePlatRaw ? (Array.isArray(topRatePlatRaw) ? topRatePlatRaw[0] : topRatePlatRaw) : null

  return NextResponse.json({
    appsThisMonth:     totalApps   ?? 0,
    winsThisMonth:     totalWins   ?? 0,
    activeMembers:     totalMembers ?? 0,
    bestPlatform:      bestPlatformName,
    bestWinRatePct:    bestPlatformName ? Math.round(bestWinRate * 100) : null,
    topRateAgreed:     topRate?.rate_agreed ? Number(topRate.rate_agreed) : null,
    topRatePlatform:   topRatePlat?.name ?? null,
    recentReviews:     reviews,
  })
}
