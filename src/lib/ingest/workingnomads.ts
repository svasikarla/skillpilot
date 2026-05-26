import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

interface WorkingNomadsJob {
  id: string | number
  title: string
  company: string
  company_logo: string | null
  category: string
  tags: string[]
  url: string
  pub_date: string
  description: string
  salary?: string | null
}

// Parse "Remote" or "Worldwide" salary strings like "$80k - $120k" or "$60-90/hr"
function parseSalary(raw: string | null | undefined): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null }
  const nums = raw.match(/\$?([\d,.]+)\s*[k]?\s*[-–]\s*\$?([\d,.]+)\s*[k]?/i)
  if (!nums) return { min: null, max: null }
  let min = parseFloat(nums[1].replace(/,/g, ''))
  let max = parseFloat(nums[2].replace(/,/g, ''))
  // Annualize if looks like yearly salary
  if (raw.toLowerCase().includes('k')) { min *= 1000; max *= 1000 }
  if (min > 1000) { min = Math.round(min / 2000); max = Math.round(max / 2000) }
  return { min: min || null, max: max || null }
}

export async function fetchWorkingNomads(): Promise<RawJob[]> {
  const res = await fetch(
    'https://www.workingnomads.com/api/exposed_jobs/?category=data-science',
    {
      headers: { 'User-Agent': 'aiml-freelance-hub/1.0', Accept: 'application/json' },
      next: { revalidate: 0 },
    }
  )
  if (!res.ok) throw new Error(`Working Nomads fetch failed: ${res.status}`)
  const data = await res.json() as WorkingNomadsJob[]

  return (data ?? [])
    .filter(j => isAiMlJob(j.title, j.description ?? '', j.tags ?? []))
    .map(j => {
      const { min, max } = parseSalary(j.salary)
      return {
        source_id:   `workingnomads-${j.id}`,
        source:      'workingnomads',
        title:       j.title,
        company:     j.company || null,
        description: (j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 2000),
        platform:    'Working Nomads',
        url:         j.url,
        skills:      extractSkillsFromTags(j.tags ?? []),
        location:    'Remote',
        rate_min:    min,
        rate_max:    max,
        posted_at:   j.pub_date ? new Date(j.pub_date).toISOString() : new Date().toISOString(),
      }
    })
}
