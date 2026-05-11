import { createClient } from '@/lib/supabase/server'
import FeedClient from './FeedClient'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch matched jobs for this member, ordered by match score
  const { data: matchRows } = await supabase
    .from('member_job_matches')
    .select(`
      match_score, is_near_miss, matched_skills, missing_skills,
      jobs (
        id, title, company, description_excerpt, source_url,
        posted_at, rate_min, rate_max, rate_type,
        reliability_score, reliability_signals, extracted_skills,
        platforms ( id, name, trust_tier )
      )
    `)
    .eq('member_id', user.id)
    .order('match_score', { ascending: false })
    .limit(50)

  type RawJob = {
    id: string; title: string; company: string | null
    description_excerpt: string | null; source_url: string
    posted_at: string | null; rate_min: string | null; rate_max: string | null
    rate_type: string | null; reliability_score: number | null
    reliability_signals: unknown; extracted_skills: string[] | null
    platforms: { id: number; name: string; trust_tier: number | null } | null | Array<{ id: number; name: string; trust_tier: number | null }>
  }

  // Normalise rows into a flat shape the client expects
  const jobs = (matchRows ?? [])
    .filter(r => r.jobs)
    .map(r => {
      const j = r.jobs as unknown as RawJob
      const plat = j.platforms
        ? (Array.isArray(j.platforms) ? j.platforms[0] : j.platforms)
        : null
      return {
        id:                  j.id,
        title:               j.title,
        company:             j.company,
        descriptionExcerpt:  j.description_excerpt,
        sourceUrl:           j.source_url,
        postedAt:            j.posted_at,
        rateMin:             j.rate_min,
        rateMax:             j.rate_max,
        rateType:            j.rate_type,
        reliabilityScore:    j.reliability_score,
        reliabilitySignals:  j.reliability_signals as Record<string, number> | null,
        extractedSkills:     j.extracted_skills,
        matchScore:          r.match_score !== null ? Number(r.match_score) : null,
        isNearMiss:          r.is_near_miss ?? false,
        matchedSkills:       r.matched_skills as string[] | null,
        platform:            plat
          ? { id: plat.id, name: plat.name, trustTier: plat.trust_tier }
          : null,
      }
    })

  // Get distinct platforms for filter bar
  const platforms = Array.from(
    new Map(
      jobs.filter(j => j.platform).map(j => [j.platform!.id, j.platform!])
    ).values()
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Job Feed</h1>
        <p className="text-muted-foreground mt-1">
          {jobs.length > 0
            ? `${jobs.length} AI/ML jobs ranked by your match score`
            : 'No matched jobs yet — check back after the next ingestion run.'}
        </p>
      </div>

      <FeedClient initialJobs={jobs} platforms={platforms} userId={user.id} />
    </div>
  )
}
