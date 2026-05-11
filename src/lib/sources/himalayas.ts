import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

interface HimalayasJob {
  slug: string
  applicationUrl: string
  title: string
  companyName: string
  description: string
  minAnnualSalary?: number
  maxAnnualSalary?: number
  skills?: Array<{ title: string }>
  pubDate: string
  location?: string
}

interface HimalayasResponse {
  jobs: HimalayasJob[]
}

export async function fetchHimalayas(): Promise<JobListing[]> {
  const res = await fetch(
    'https://himalayas.app/jobs/api?limit=100&skills=machine-learning,artificial-intelligence,python,llm',
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Himalayas HTTP ${res.status}`)

  const { jobs }: HimalayasResponse = await res.json()

  return jobs
    .filter(j => isAiMlJob(j.title, j.description, (j.skills ?? []).map(s => s.title)))
    .map(j => ({
      sourceId:    `himalayas-${j.slug}`,
      sourceUrl:   j.applicationUrl,
      title:       j.title,
      company:     j.companyName,
      description: j.description,
      rateType:    j.minAnnualSalary ? 'yearly' as never : 'unknown' as const,
      rateMin:     j.minAnnualSalary ? Math.round(j.minAnnualSalary / 2000) : undefined, // rough hourly
      rateMax:     j.maxAnnualSalary ? Math.round(j.maxAnnualSalary / 2000) : undefined,
      jobType:     'remote' as const,
      isRemote:    true,
      location:    j.location,
      postedAt:    safeDate(j.pubDate),
    }))
}
