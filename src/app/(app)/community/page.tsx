import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Users, Target, TrendingUp, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer, RailCard } from '@/components/app-shell/PageContainer'

type PlatformStat = { platform: string; applied: number; won: number; win_rate: number }
type RecentWin = { platform: string; rate: number | null }

async function fetchStats(siteUrl: string) {
  try {
    const res = await fetch(`${siteUrl}/api/community/stats`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stats = await fetchStats(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001')

  const hasData = stats && stats.total_applied > 0

  const aside = (
    <>
      <RailCard title="Contribute" icon={Trophy}>
        <p className="mb-3 text-sm text-muted-foreground">
          These numbers are built from members&apos; tracked applications — fully anonymised.
          Log yours to sharpen the group&apos;s intelligence.
        </p>
        <Link
          href="/tracker"
          className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open your tracker
        </Link>
      </RailCard>
      <RailCard title="How it works">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Outcomes are aggregated across the whole group.</li>
          <li>Only anonymised counts and rates are shown.</li>
          <li>Refreshed over a rolling 30-day window.</li>
        </ul>
      </RailCard>
    </>
  )

  return (
    <div className="bg-background">
      <PageContainer aside={aside} className="space-y-8">
        <div>
          <h1 className="page-header">Group Intelligence</h1>
          <p className="page-subheader">Anonymised outcomes from the group — last 30 days. Log applications in your tracker to contribute.</p>
        </div>

        {!hasData ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">No group data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking applications in the <a href="/tracker" className="text-primary underline">tracker</a> and mark outcomes to see collective stats here.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users,     label: 'Applications', value: String(stats.total_applied), sub: 'submitted this month', color: 'text-primary' },
                { icon: Trophy,    label: 'Wins',          value: String(stats.total_won),     sub: 'contracts landed',     color: 'text-emerald-600' },
                { icon: Target,    label: 'Win rate',      value: `${stats.win_rate}%`,         sub: 'of applications',      color: 'text-amber-600' },
                { icon: TrendingUp, label: 'Avg win rate',  value: stats.avg_win_rate > 0 ? `$${stats.avg_win_rate}/hr` : '—', sub: 'when won', color: 'text-blue-600' },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="stat-card">
                  <Icon className={cn('h-4 w-4 mb-1', color)} />
                  <p className="stat-value">{value}</p>
                  <p className="stat-label">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Best platform */}
            {stats.best_platform && (
              <div className="card-base rounded-xl p-5 surface-brand border border-primary/15">
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Best platform this month</span>
                </div>
                <p className="text-xl font-bold">{stats.best_platform.platform}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.best_platform.applied} applied · {stats.best_platform.won} won · <span className="text-emerald-700 font-medium">{stats.best_platform.win_rate}% win rate</span>
                </p>
              </div>
            )}

            {/* Recent wins */}
            {stats.recent_wins?.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-emerald-600" />Recent group wins
                </h2>
                <div className="space-y-2">
                  {(stats.recent_wins as RecentWin[]).map((win, i) => (
                    <div key={i} className="card-base rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contract on <strong className="text-foreground">{win.platform}</strong></span>
                      {win.rate && <span className="font-semibold text-emerald-700">${win.rate}/hr</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform leaderboard */}
            {stats.platform_stats?.length > 0 && (
              <div>
                <h2 className="font-semibold mb-3">Platform breakdown</h2>
                <div className="card-base rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applied</th>
                        <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Won</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(stats.platform_stats as PlatformStat[]).map(p => (
                        <tr key={p.platform} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{p.platform}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{p.applied}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{p.won}</td>
                          <td className="px-4 py-3 text-right font-semibold">
                            <span className={p.win_rate >= 30 ? 'text-emerald-700' : p.win_rate >= 15 ? 'text-amber-700' : 'text-muted-foreground'}>
                              {p.win_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </div>
  )
}
