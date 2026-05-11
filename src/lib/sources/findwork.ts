import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

interface FindworkJob {
  id: number
  url: string
  role: string
  company_name: string
  text: string
  employment_type: string | null
  location: string | null
  remote: boolean
  date_posted: string
}

interface FindworkResponse {
  results: FindworkJob[]
}

export async function fetchFindwork(): Promise<JobListing[]> {
  const key = process.env.FINDWORK_API_KEY
  if (!key) {
    console.warn('[findwork] FINDWORK_API_KEY not set, skipping')
    return []
  }

  const res = await fetch(
    'https://findwork.dev/api/jobs/?order_by=-date&keywords=machine+learning+AI',
    {
      headers: { Authorization: `Token ${key}` },
      signal:  AbortSignal.timeout(10_000),
    }
  )
  if (!res.ok) throw new Error(`Findwork HTTP ${res.status}`)

  const { results }: FindworkResponse = await res.json()

  return results
    .filter(j => isAiMlJob(j.role, j.text ?? ''))
    .map(j => ({
      sourceId:    `findwork-${j.id}`,
      sourceUrl:   j.url,
      title:       j.role,
      company:     j.company_name,
      description: j.text ?? '',
      rateType:    'unknown' as const,
      jobType:     j.remote ? 'remote' : 'onsite' as const,
      isRemote:    j.remote,
      location:    j.location ?? undefined,
      postedAt:    safeDate(j.date_posted),
    }))
}
