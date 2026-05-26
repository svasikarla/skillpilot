import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

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
  const res = await fetch(
    'https://findwork.dev/api/jobs/?search=machine+learning+AI+LLM&remote=true&ordering=-date',
    {
      headers: { 'User-Agent': 'aiml-freelance-hub/1.0', Accept: 'application/json' },
      next: { revalidate: 0 },
    }
  )
  if (!res.ok) throw new Error(`Findwork fetch failed: ${res.status}`)
  const data = await res.json() as FindworkResponse

  return (data.results ?? [])
    .filter(j => isAiMlJob(j.role, j.text ?? '', j.keywords ?? []))
    .map(j => ({
      source_id:   `findwork-${j.id}`,
      source:      'findwork',
      title:       j.role,
      company:     j.company_name || null,
      description: (j.text ?? '').replace(/<[^>]*>/g, '').slice(0, 2000),
      platform:    'Findwork',
      url:         j.url,
      skills:      extractSkillsFromTags(j.keywords ?? []),
      location:    j.remote ? 'Remote' : (j.location || 'Remote'),
      rate_min:    null,
      rate_max:    null,
      posted_at:   j.date_posted ? new Date(j.date_posted).toISOString() : new Date().toISOString(),
    }))
}
