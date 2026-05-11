import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrackerClient from './TrackerClient'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, rate_proposed, rate_agreed,
      days_to_response, notes, created_at, updated_at,
      jobs ( id, title, source_url, extracted_skills ),
      platforms ( id, name, trust_tier )
    `)
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  type AppRow = {
    id: string; status: string | null; applied_at: string | null
    rate_proposed: string | null; rate_agreed: string | null
    days_to_response: number | null; notes: string | null
    created_at: string | null; updated_at: string | null
    jobs: { id: string; title: string; source_url: string; extracted_skills: string[] | null } | null | Array<{ id: string; title: string; source_url: string; extracted_skills: string[] | null }>
    platforms: { id: number; name: string; trust_tier: number | null } | null | Array<{ id: number; name: string; trust_tier: number | null }>
  }

  const applications = (rows ?? []).map((r: AppRow) => {
    const job  = r.jobs ? (Array.isArray(r.jobs) ? r.jobs[0] : r.jobs) : null
    const plat = r.platforms ? (Array.isArray(r.platforms) ? r.platforms[0] : r.platforms) : null
    return {
      id:             r.id,
      status:         r.status ?? 'saved',
      appliedAt:      r.applied_at,
      rateProposed:   r.rate_proposed,
      rateAgreed:     r.rate_agreed,
      daysToResponse: r.days_to_response,
      notes:          r.notes,
      createdAt:      r.created_at,
      job:            job ? { id: job.id, title: job.title, sourceUrl: job.source_url } : null,
      platform:       plat ? { id: plat.id, name: plat.name, trustTier: plat.trust_tier } : null,
    }
  })

  // Stats
  const now  = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const total       = applications.length
  const appliedMonth = applications.filter(a =>
    a.status === 'applied' && a.appliedAt && a.appliedAt >= thisMonthStart
  ).length
  const won          = applications.filter(a => a.status === 'won').length
  const responded    = applications.filter(a => a.daysToResponse !== null)
  const avgDays      = responded.length
    ? Math.round(responded.reduce((s, a) => s + (a.daysToResponse ?? 0), 0) / responded.length)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Application Tracker</h1>
        <p className="text-muted-foreground mt-1">Track every opportunity from saved to won.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total saved',       value: total },
          { label: 'Applied this month', value: appliedMonth },
          { label: 'Won',                value: won },
          { label: 'Avg days to reply',  value: avgDays !== null ? `${avgDays}d` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 border rounded-lg bg-card text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <TrackerClient applications={applications} />
    </div>
  )
}
