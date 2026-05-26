import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

interface RemoteOKJob {
  id: string
  epoch: number
  url: string
  apply_url: string
  position: string   // API sends "position", not "title"
  company: string
  location: string
  description: string
  tags: string[]
  salary_min: number
  salary_max: number
}

export async function fetchRemoteOK(): Promise<RawJob[]> {
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': 'aiml-freelance-hub/1.0' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`RemoteOK fetch failed: ${res.status}`)
  const data = await res.json() as Array<RemoteOKJob | { legal: string }>

  return (data as RemoteOKJob[])
    .filter(j => j.id && j.position)
    .filter(j => isAiMlJob(j.position, j.description ?? '', j.tags ?? []))
    .map(j => {
      const hourlyMin = j.salary_min > 1000 ? Math.round(j.salary_min / 2000) : (j.salary_min || null)
      const hourlyMax = j.salary_max > 1000 ? Math.round(j.salary_max / 2000) : (j.salary_max || null)
      return {
        source_id: `remoteok-${j.id}`,
        source: 'remoteok',
        title: j.position,
        company: j.company || null,
        description: (j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 2000),
        platform: 'RemoteOK',
        url: j.apply_url ?? j.url ?? `https://remoteok.com/remote-jobs/${j.id}`,
        skills: extractSkillsFromTags(j.tags ?? []),
        location: (j.location || 'Remote').replace(/,\s*$/, ''),
        rate_min: hourlyMin,
        rate_max: hourlyMax,
        posted_at: j.epoch ? new Date(j.epoch * 1000).toISOString() : new Date().toISOString(),
      }
    })
}
