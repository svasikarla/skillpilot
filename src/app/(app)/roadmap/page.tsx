import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNav'
import RoadmapClient from './RoadmapClient'
import { computeRoadmap } from '@/lib/roadmap'
import { Sparkles, Target, TrendingUp } from 'lucide-react'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase.from('profiles').select('name, skills, skill_ratings, hourly_rate').eq('user_id', user.id).single(),
    supabase.from('jobs').select('skills, rate_min, rate_max').eq('status', 'approved').limit(500),
  ])

  if (!profile) redirect('/onboarding')

  const gaps = computeRoadmap(profile.skills ?? [], jobs ?? [])
  const topEarning = gaps.slice(0, 3).reduce((s, g) => s + g.avgRate, 0)

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={profile.name} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="page-header">Skill Roadmap</h1>
          <p className="page-subheader">Skills missing from your profile that unlock the most AI/ML gigs — ranked by earning impact.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <Target className="h-4 w-4 text-primary mb-1" />
            <p className="stat-value">{profile.skills?.length ?? 0}</p>
            <p className="stat-label">Skills in profile</p>
          </div>
          <div className="stat-card">
            <Sparkles className="h-4 w-4 text-amber-500 mb-1" />
            <p className="stat-value">{gaps.length}</p>
            <p className="stat-label">Gaps identified</p>
          </div>
          <div className="stat-card">
            <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />
            <p className="stat-value text-emerald-600">
              {topEarning > 0 ? `$${Math.round(topEarning / 3)}/hr` : '—'}
            </p>
            <p className="stat-label">Avg rate of top gaps</p>
          </div>
        </div>

        {gaps.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">Great skill coverage!</p>
            <p className="text-sm text-muted-foreground mt-1">Your profile matches well across current gigs. Check back as new jobs appear.</p>
          </div>
        ) : (
          <RoadmapClient gaps={gaps} />
        )}
      </main>
    </div>
  )
}
