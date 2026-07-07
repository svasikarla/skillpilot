import { RawJob, isAiMlJob, extractSkillsFromTags, inferEmploymentType } from './types'

interface FindworkJob {
  id: string | number
  role: string
  company_name: string
  text: string
  url: string
  remote: boolean
  keywords: string[]
  date_posted: string
  location: string
}

interface FindworkResponse {
  results: FindworkJob[]
}

export async function fetchFindwork(): Promise<RawJob[]> {
  // Findwork's API always requires token auth (anonymous requests 401).
  // Free key from https://findwork.dev/developers/ — skip cleanly without one.
  const apiKey = process.env.FINDWORK_API_KEY
  if (!apiKey) {
    console.warn('[ingest] findwork skipped: FINDWORK_API_KEY not set')
    return []
  }
  const res = await fetch(
    'https://findwork.dev/api/jobs/?search=machine+learning+AI+LLM&remote=true&ordering=-date',
    {
      headers: {
        'User-Agent': 'aiml-freelance-hub/1.0',
        Accept: 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      next: { revalidate: 0 },
    }
  )
  if (!res.ok) throw new Error(`Findwork fetch failed: ${res.status}`)
  const data = await res.json() as FindworkResponse

  return (data.results ?? [])
    .filter(j => isAiMlJob(j.role, j.text ?? '', j.keywords ?? []))
    .map(j => {
      const cleanDesc = (j.text ?? '').replace(/<[^>]*>/g, '').slice(0, 2000)
      return {
        source_id:   `findwork-${j.id}`,
        source:      'findwork',
        title:       j.role,
        company:     j.company_name || null,
        description: cleanDesc,
        platform:    'Findwork',
        url:         j.url,
        skills:      extractSkillsFromTags(j.keywords ?? []),
        location:    j.remote ? 'Remote' : (j.location || 'Remote'),
        rate_min:    null,
        rate_max:    null,
        posted_at:   j.date_posted ? new Date(j.date_posted).toISOString() : new Date().toISOString(),
        employment_type: inferEmploymentType(j.role, cleanDesc),
      }
    })
}
