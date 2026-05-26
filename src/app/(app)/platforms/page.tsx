import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNav'
import { Shield, Star, ExternalLink, CheckCircle2, Bookmark, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIER_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Elite',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' },
  2: { label: 'Strong',   color: 'text-blue-700 dark:text-blue-400',       bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
  3: { label: 'Emerging', color: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800' },
  4: { label: 'Risky',    color: 'text-red-700 dark:text-red-400',         bg: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' },
}

function TrustBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{score}</span>
    </div>
  )
}

export default async function PlatformsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: platforms }, { data: reviewCounts }, { data: interests }] = await Promise.all([
    supabase.from('profiles').select('name').eq('user_id', user.id).single(),
    supabase.from('platforms').select('id, slug, name, tier, trust_score, description, website, rate_min_aiml, rate_max_aiml').order('tier').order('trust_score', { ascending: false }),
    supabase.from('platform_reviews').select('platform_id'),
    supabase.from('member_platform_interests').select('platform_id, interest').eq('user_id', user.id),
  ])

  const countByPlatform = (reviewCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.platform_id] = (acc[r.platform_id] ?? 0) + 1
    return acc
  }, {})

  const interestByPlatform = (interests ?? []).reduce<Record<string, string>>((acc, i) => {
    acc[i.platform_id] = i.interest
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={profile?.name} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="page-header">Freelance Platforms</h1>
          <p className="page-subheader">Ranked by tier and trust score. Click any platform for AI/ML-specific guides and member reviews.</p>
        </div>

        {[1, 2, 3, 4].map(tier => {
          const tierPlatforms = (platforms ?? []).filter(p => p.tier === tier)
          if (!tierPlatforms.length) return null
          const cfg = TIER_CONFIG[tier]
          return (
            <section key={tier} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full border', cfg.bg, cfg.color)}>
                  Tier {tier} · {cfg.label}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {tierPlatforms.map(p => (
                  <a key={p.id} href={`/platforms/${p.slug}`}
                    className="card-interactive rounded-lg p-4 block group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm group-hover:text-primary transition-colors">{p.name}</span>
                          {(countByPlatform[p.id] ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-amber-600">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {countByPlatform[p.id]}
                            </span>
                          )}
                          {interestByPlatform[p.id] === 'have' && (
                            <span className="flex items-center gap-0.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" />Have account
                            </span>
                          )}
                          {interestByPlatform[p.id] === 'want' && (
                            <span className="flex items-center gap-0.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
                              <Bookmark className="h-2.5 w-2.5" />Want to try
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <TrustBar score={p.trust_score} />
                        </div>
                        {(p.rate_min_aiml || p.rate_max_aiml) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ${p.rate_min_aiml}–${p.rate_max_aiml}/hr for AI/ML
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 mt-0.5" />
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
