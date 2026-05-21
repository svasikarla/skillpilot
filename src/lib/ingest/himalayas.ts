import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

interface HimalayasJob {
  id: string
  title: string
  applicationUrl: string
  description: string
  company: { name: string }
  skills: Array<{ title: string }>
  categories: Array<{ title: string; slug: string }>
  salary: { minimum: number; maximum: number; currency: string } | null
  createdAt: string
  locationPolicy: string
}

export async function fetchHimalayas(): Promise<RawJob[]> {
  const res = await fetch('https://himalayas.app/api/jobs?limit=100', {
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Himalayas fetch failed: ${res.status}`)
  const data = await res.json() as { jobs: HimalayasJob[] }

  return (data.jobs ?? [])
    .filter(j => {
      const cats = (j.categories ?? []).map(c => c.slug)
      return isAiMlJob(j.title, j.description ?? '', cats)
    })
    .map(j => {
      const skillTags = (j.skills ?? []).map(s => s.title)
      const hourlyMin = j.salary?.minimum
        ? (j.salary.minimum > 1000 ? Math.round(j.salary.minimum / 2000) : j.salary.minimum)
        : null
      const hourlyMax = j.salary?.maximum
        ? (j.salary.maximum > 1000 ? Math.round(j.salary.maximum / 2000) : j.salary.maximum)
        : null
      return {
        source_id: `himalayas-${j.id}`,
        source: 'himalayas',
        title: j.title,
        company: j.company?.name ?? null,
        description: (j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 2000),
        platform: 'Himalayas',
        url: j.applicationUrl ?? `https://himalayas.app/jobs/${j.id}`,
        skills: extractSkillsFromTags(skillTags),
        location: j.locationPolicy === 'remote' ? 'Remote' : (j.locationPolicy ?? 'Remote'),
        rate_min: hourlyMin,
        rate_max: hourlyMax,
        posted_at: j.createdAt ?? new Date().toISOString(),
      }
    })
}
