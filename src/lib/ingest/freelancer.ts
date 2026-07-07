import { RawJob, RateType, isAiMlJob, extractSkillsFromTags } from './types'

// Freelancer.com is a true project marketplace: listings are client projects
// with fixed or hourly budgets, not employment ads. The active-projects search
// API is public (no auth) — https://developers.freelancer.com/docs.

interface FreelancerProject {
  id: number
  title: string
  seo_url: string
  preview_description: string | null
  description?: string | null
  type: 'fixed' | 'hourly' | string
  submitdate?: number       // epoch seconds
  time_submitted?: number   // epoch seconds
  budget?: { minimum?: number | null; maximum?: number | null } | null
  currency?: { code?: string; exchange_rate?: number | null } | null
  jobs?: Array<{ name?: string | null }> | null
  hourly_project_info?: {
    commitment?: { hours?: number | null; interval?: string | null } | null
  } | null
}

interface FreelancerResponse {
  status: string
  result?: { projects?: FreelancerProject[] }
}

// Budgets come back in the project's own currency; exchange_rate converts to USD.
function toUsd(amount: number | null | undefined, rate: number | null | undefined): number | null {
  if (amount == null || amount <= 0) return null
  const usd = Math.round(amount * (rate ?? 1))
  return usd > 0 ? usd : null
}

function skillTags(project: FreelancerProject): string[] {
  return (project.jobs ?? [])
    .map(j => (j.name ?? '').replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase())
    .filter(Boolean)
}

function commitment(project: FreelancerProject): string | null {
  const c = project.hourly_project_info?.commitment
  if (!c?.hours || !c.interval) return null
  return `${c.hours} hrs/${c.interval}`
}

export async function fetchFreelancer(): Promise<RawJob[]> {
  const params = new URLSearchParams({
    query: 'machine learning AI LLM',
    limit: '100',
    full_description: 'true',
    job_details: 'true',
    compact: 'true',
  })
  const res = await fetch(
    `https://www.freelancer.com/api/projects/0.1/projects/active/?${params}`,
    { headers: { 'User-Agent': 'aiml-freelance-hub/1.0', Accept: 'application/json' }, next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Freelancer fetch failed: ${res.status}`)
  const data = await res.json() as FreelancerResponse

  return (data.result?.projects ?? [])
    .filter(p => p.id && p.title)
    .filter(p => isAiMlJob(p.title, p.description ?? p.preview_description ?? '', skillTags(p)))
    .map(p => {
      const cleanDesc = (p.description ?? p.preview_description ?? '')
        .replace(/<[^>]*>/g, '').slice(0, 2000)
      const fx = p.currency?.exchange_rate
      const rateType: RateType = p.type === 'hourly' ? 'hourly' : 'fixed'
      const postedEpoch = p.time_submitted ?? p.submitdate
      return {
        source_id:   `freelancer-${p.id}`,
        source:      'freelancer',
        title:       p.title,
        company:     null, // marketplace clients are anonymous until you bid
        description: cleanDesc,
        platform:    'Freelancer',
        url:         p.seo_url ? `https://www.freelancer.com/projects/${p.seo_url}` : null,
        skills:      extractSkillsFromTags(skillTags(p)),
        location:    'Remote',
        rate_min:    toUsd(p.budget?.minimum, fx),
        rate_max:    toUsd(p.budget?.maximum, fx),
        posted_at:   postedEpoch ? new Date(postedEpoch * 1000).toISOString() : new Date().toISOString(),
        employment_type: 'contract' as const,
        rate_type:   rateType,
        duration:    commitment(p),
      } satisfies RawJob
    })
}
