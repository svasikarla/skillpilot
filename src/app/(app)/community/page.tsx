import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'

import { Star } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-primary mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Call Supabase directly from server component
  const admin = await createAdminClient()
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const since90 = new Date(Date.now() - 90 * 86_400_000).toISOString()

  const [
    { count: totalApps },
    { count: totalWins },
    { count: totalMembers },
    { data: platformApps },
    { data: recentReviews },
    { data: topWin },
  ] = await Promise.all([
    admin.from('applications').select('id', { count: 'exact', head: true }).neq('status', 'saved').gte('created_at', since30),
    admin.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'won').gte('created_at', since30),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('applications').select('platform_id, status').gte('created_at', since90).not('platform_id', 'is', null),
    admin.from('platform_reviews').select('review_text, rating, created_at, platforms ( name )').order('created_at', { ascending: false }).limit(5),
    admin.from('applications').select('rate_agreed, platforms ( name )').eq('status', 'won').not('rate_agreed', 'is', null).order('rate_agreed', { ascending: false }).limit(1),
  ])

  // Best platform by win rate
  const platStats = new Map<number, { wins: number; total: number }>()
  for (const app of (platformApps ?? [])) {
    const pid = app.platform_id as number
    if (!platStats.has(pid)) platStats.set(pid, { wins: 0, total: 0 })
    const s = platStats.get(pid)!
    s.total++
    if (app.status === 'won') s.wins++
  }

  let bestPlatId: number | null = null
  let bestWinRate = 0
  for (const [pid, s] of platStats) {
    if (s.total >= 2 && s.wins / s.total > bestWinRate) {
      bestWinRate = s.wins / s.total; bestPlatId = pid
    }
  }
  let bestPlatName: string | null = null
  if (bestPlatId !== null) {
    const { data: p } = await admin.from('platforms').select('name').eq('id', bestPlatId).single()
    bestPlatName = p?.name ?? null
  }

  type ReviewRow = { review_text: string; rating: number; created_at: string; platforms: { name: string } | { name: string }[] | null }
  const reviews = (recentReviews ?? []).map(r => {
    const row = r as unknown as ReviewRow
    const plat = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms
    return { text: row.review_text, rating: row.rating, platform: plat?.name ?? '—' }
  })

  type WinRow = { rate_agreed: string | number; platforms: { name: string } | { name: string }[] | null }
  const topWinRow = topWin?.[0] as unknown as WinRow | undefined
  const topWinPlat = topWinRow?.platforms
  const topWinPlatName = topWinPlat ? (Array.isArray(topWinPlat) ? topWinPlat[0]?.name : topWinPlat.name) : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Group Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aggregated, anonymised data from all {totalMembers ?? 0} active members.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="apps this month"  value={totalApps  ?? 0} />
        <Stat label="wins this month"  value={totalWins  ?? 0} />
        <Stat label="active members"   value={totalMembers ?? 0} />
        <Stat
          label="best platform"
          value={bestPlatName ?? '—'}
          sub={bestPlatName ? `${Math.round(bestWinRate * 100)}% win rate` : undefined}
        />
      </div>

      {topWinRow && (
        <div className="border rounded-lg p-4 bg-green-50 text-green-800">
          <p className="text-sm font-medium">Highest agreed rate</p>
          <p className="text-2xl font-bold mt-0.5">${Number(topWinRow.rate_agreed).toFixed(0)}/hr</p>
          {topWinPlatName && <p className="text-xs mt-0.5">on {topWinPlatName}</p>}
        </div>
      )}

      {/* Platform reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h2 className="text-sm font-semibold">Recent platform reviews</h2>
          {reviews.map((r, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{r.platform}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Star
                      key={j}
                      className={`h-3 w-3 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No platform reviews yet. Be the first — add a review from the Platforms page.
        </p>
      )}
    </div>
  )
}
