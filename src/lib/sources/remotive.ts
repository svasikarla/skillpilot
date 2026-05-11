import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  description: string
  salary: string | null
  candidate_required_location: string | null
  publication_date: string
  tags: string[]
}

export async function fetchRemotive(): Promise<JobListing[]> {
  const res = await fetch(
    'https://remotive.com/api/remote-jobs?category=software-dev&limit=100',
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Remotive HTTP ${res.status}`)

  const { jobs }: { jobs: RemotiveJob[] } = await res.json()

  return jobs
    .filter(j => isAiMlJob(j.title, j.description, j.tags ?? []))
    .map(j => ({
      sourceId:    `remotive-${j.id}`,
      sourceUrl:   j.url,
      title:       j.title,
      company:     j.company_name,
      description: j.description,
      rateType:    'unknown' as const,
      jobType:     'remote' as const,
      isRemote:    true,
      location:    j.candidate_required_location ?? undefined,
      postedAt:    safeDate(j.publication_date),
    }))
}
