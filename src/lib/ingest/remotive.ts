import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  tags: string[]
  job_type: string
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
}

function parseSalary(salary: string): { rate_min: number | null; rate_max: number | null } {
  if (!salary) return { rate_min: null, rate_max: null }
  const matches = salary.match(/\$?([\d,]+)k?\s*[-–]\s*\$?([\d,]+)k?/i)
  if (!matches) return { rate_min: null, rate_max: null }
  let min = parseInt(matches[1].replace(',', ''))
  let max = parseInt(matches[2].replace(',', ''))
  // if annual salary, convert to rough hourly (/2000 working hours)
  if (max > 1000) { min = Math.round(min / 2000); max = Math.round(max / 2000) }
  return { rate_min: min || null, rate_max: max || null }
}

export async function fetchRemotive(): Promise<RawJob[]> {
  const res = await fetch(
    'https://remotive.com/api/remote-jobs?category=software-dev&limit=100',
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error(`Remotive fetch failed: ${res.status}`)
  const data = await res.json() as { jobs: RemotiveJob[] }

  return data.jobs
    .filter(j => isAiMlJob(j.title, j.description, j.tags))
    .map(j => {
      const { rate_min, rate_max } = parseSalary(j.salary)
      return {
        source_id: `remotive-${j.id}`,
        source: 'remotive',
        title: j.title,
        company: j.company_name || null,
        description: j.description.replace(/<[^>]*>/g, '').slice(0, 2000),
        platform: 'Remotive',
        url: j.url,
        skills: extractSkillsFromTags(j.tags),
        location: j.candidate_required_location || 'Remote',
        rate_min,
        rate_max,
        posted_at: j.publication_date,
      }
    })
}
