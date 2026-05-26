import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

interface HimalayasJob {
  guid: string
  title: string
  excerpt: string
  applicationLink: string
  description: string
  companyName: string
  companySlug: string
  categories: string[]
  parentCategories: string[]
  minSalary: number | null
  maxSalary: number | null
  currency: string
  pubDate: number
  locationRestrictions: string[]
  seniority: string[]
}

interface HimalayasResponse {
  jobs: HimalayasJob[]
  totalCount: number
  offset: number
  limit: number
}

async function fetchPage(offset: number): Promise<HimalayasJob[]> {
  const res = await fetch(`https://himalayas.app/jobs/api?limit=20&offset=${offset}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Himalayas fetch failed: ${res.status}`)
  const data = await res.json() as HimalayasResponse
  return data.jobs ?? []
}

export async function fetchHimalayas(): Promise<RawJob[]> {
  // Fetch 3 pages (60 jobs) in parallel; max limit is now 20 per request
  const pages = await Promise.all([0, 20, 40].map(fetchPage))
  const allJobs = pages.flat()

  return allJobs
    .filter(j => {
      const cats = [
        ...(j.categories ?? []),
        ...(j.parentCategories ?? []),
      ].map(c => c.toLowerCase().replace(/-/g, ' '))
      return isAiMlJob(j.title, j.description ?? j.excerpt ?? '', cats)
    })
    .map(j => {
      const slugId = j.guid.split('/').filter(Boolean).pop() ?? j.companySlug + '-' + Date.now()
      const hourlyMin = j.minSalary
        ? (j.minSalary > 1000 ? Math.round(j.minSalary / 2000) : j.minSalary)
        : null
      const hourlyMax = j.maxSalary
        ? (j.maxSalary > 1000 ? Math.round(j.maxSalary / 2000) : j.maxSalary)
        : null
      const isRemote =
        !j.locationRestrictions?.length ||
        j.locationRestrictions.some(l =>
          l.toLowerCase().includes('worldwide') || l.toLowerCase().includes('remote')
        )

      return {
        source_id:   `himalayas-${slugId}`,
        source:      'himalayas',
        title:       j.title,
        company:     j.companyName ?? null,
        description: (j.description ?? j.excerpt ?? '').replace(/<[^>]*>/g, '').slice(0, 2000),
        platform:    'Himalayas',
        url:         j.applicationLink ?? j.guid,
        skills:      extractSkillsFromTags([
          ...(j.categories ?? []),
          ...(j.parentCategories ?? []),
        ]),
        location:    isRemote ? 'Remote' : (j.locationRestrictions?.[0] ?? 'Remote'),
        rate_min:    hourlyMin,
        rate_max:    hourlyMax,
        posted_at:   j.pubDate
          ? new Date(j.pubDate * 1000).toISOString()
          : new Date().toISOString(),
      }
    })
}
