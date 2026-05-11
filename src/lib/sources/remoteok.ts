import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

interface RemoteOkJob {
  id: string
  url: string
  position: string
  company: string
  description: string
  salary_min?: number
  salary_max?: number
  tags?: string[]
  date: string
  location?: string
}

export async function fetchRemoteOK(): Promise<JobListing[]> {
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': 'aiml-freelance-hub/1.0' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`RemoteOK HTTP ${res.status}`)

  const data: (RemoteOkJob | { legal: string })[] = await res.json()
  const jobs = data.filter((j): j is RemoteOkJob => 'id' in j && 'position' in j)

  const aimlTags = ['ai', 'ml', 'python', 'llm', 'machine-learning', 'deep-learning', 'nlp', 'data-science']

  return jobs
    .filter(j => {
      const hasAimlTag = (j.tags ?? []).some(t => aimlTags.includes(t.toLowerCase()))
      return hasAimlTag || isAiMlJob(j.position, j.description ?? '', j.tags)
    })
    .map(j => ({
      sourceId:    `remoteok-${j.id}`,
      sourceUrl:   j.url,
      title:       j.position,
      company:     j.company,
      description: j.description ?? '',
      rateMin:     j.salary_min,
      rateMax:     j.salary_max,
      rateType:    j.salary_min ? 'yearly' as never : 'unknown' as const,
      jobType:     'remote' as const,
      isRemote:    true,
      location:    j.location,
      postedAt:    safeDate(j.date),
    }))
}
