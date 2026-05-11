import { createAdminClient } from '@/lib/supabase/server'
import AdminJobsClient from './AdminJobsClient'

export default async function AdminJobsPage() {
  const supabase = await createAdminClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id, title, company, description_excerpt, source_url,
      posted_at, reliability_score, reliability_signals, status,
      extracted_skills, ingested_at,
      platforms ( name, trust_tier )
    `)
    .eq('status', 'pending')
    .order('reliability_score', { ascending: false })
    .limit(200)

  const { count: totalPending } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Job Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          {totalPending ?? 0} pending — sorted by reliability score
        </p>
      </div>

      <AdminJobsClient jobs={(jobs ?? []).map((j: {
        id: string; title: string; company: string | null
        description_excerpt: string | null; source_url: string
        posted_at: string | null; ingested_at: string | null
        reliability_score: number | null; reliability_signals: unknown
        extracted_skills: string[] | null; status: string | null
        platforms: { name: string; trust_tier: number | null } | null | Array<{ name: string; trust_tier: number | null }>
      }) => ({
        id:                  j.id,
        title:               j.title,
        company:             j.company,
        descriptionExcerpt:  j.description_excerpt,
        sourceUrl:           j.source_url,
        postedAt:            j.posted_at,
        ingestedAt:          j.ingested_at,
        reliabilityScore:    j.reliability_score,
        reliabilitySignals:  j.reliability_signals as Record<string, number> | null,
        extractedSkills:     j.extracted_skills,
        status:              j.status,
        platform:            j.platforms
          ? {
              name:      Array.isArray(j.platforms) ? j.platforms[0]?.name : j.platforms.name,
              trustTier: Array.isArray(j.platforms) ? j.platforms[0]?.trust_tier : j.platforms.trust_tier,
            }
          : null,
      }))} />
    </div>
  )
}
