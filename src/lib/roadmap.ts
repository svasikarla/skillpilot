import { createClient } from '@/lib/supabase/server'

export interface RoadmapSkill {
  skillName:    string
  jobsUnlocked: number
  avgRate:      number
  roi:          number
  status:       'active' | 'learning' | 'planned'
  resource: {
    title:     string
    url:       string
    provider:  string
    format:    string
    estHours:  number
    isFree:    boolean
  } | null
}

export async function getRoadmap(userId: string): Promise<RoadmapSkill[]> {
  const supabase = await createClient()

  // 1. Member's existing skills and their statuses
  const { data: allMs } = await supabase
    .from('member_skills')
    .select('skills ( name ), self_rating, status')
    .eq('member_id', userId)

  const hasSkills    = new Set<string>()
  const statusByName = new Map<string, 'active' | 'learning' | 'planned'>()

  for (const row of (allMs ?? [])) {
    const sk = row.skills as { name: string } | { name: string }[] | null
    const names = sk ? (Array.isArray(sk) ? sk.map(s => s.name) : [sk.name]) : []
    const st = (row as { status?: string }).status as 'active' | 'learning' | 'planned' | undefined
    for (const n of names) {
      if (st) statusByName.set(n, st)
      if ((row.self_rating ?? 0) >= 3 && st === 'active') hasSkills.add(n)
    }
  }

  // 2. All approved jobs with extracted skills + rates
  const { data: jobs } = await supabase
    .from('jobs')
    .select('extracted_skills, rate_min, rate_max')
    .eq('status', 'approved')
    .not('extracted_skills', 'is', null)

  // 3. Tally gap skills across jobs
  const stats = new Map<string, { count: number; totalRate: number; rateCount: number }>()

  for (const job of (jobs ?? [])) {
    const skills = (job.extracted_skills ?? []) as string[]
    for (const skill of skills) {
      if (hasSkills.has(skill)) continue
      if (!stats.has(skill)) stats.set(skill, { count: 0, totalRate: 0, rateCount: 0 })
      const s = stats.get(skill)!
      s.count++
      const lo = Number(job.rate_min ?? 0)
      const hi = Number(job.rate_max ?? 0)
      const rate = lo > 0 && hi > 0 ? (lo + hi) / 2 : lo || hi
      if (rate > 0) { s.totalRate += rate; s.rateCount++ }
    }
  }

  if (stats.size === 0) return []

  // 4. Learning resources — join through skills table
  const gapNames = Array.from(stats.keys())
  const { data: skillRows } = await supabase
    .from('skills')
    .select('id, name')
    .in('name', gapNames.slice(0, 100))

  const nameToId = new Map((skillRows ?? []).map(r => [r.name, r.id]))
  const gapIds   = Array.from(nameToId.values())

  const { data: resources } = gapIds.length > 0
    ? await supabase
        .from('learning_resources')
        .select('skill_id, title, url, provider, format, est_hours, cost')
        .in('skill_id', gapIds)
    : { data: [] }

  type ResourceRow = { skill_id: number; title: string; url: string; provider: string | null; format: string | null; est_hours: number | null; cost: string | null }
  const idToName    = new Map((skillRows ?? []).map(r => [r.id, r.name]))
  const resourceMap = new Map<string, ResourceRow>()
  for (const r of ((resources ?? []) as ResourceRow[])) {
    const name = idToName.get(r.skill_id)
    if (name && !resourceMap.has(name)) resourceMap.set(name, r)
  }

  // 5. Assemble roadmap items
  const items: RoadmapSkill[] = []
  for (const [skillName, stat] of stats) {
    if (stat.count === 0) continue
    const avgRate  = stat.rateCount > 0 ? stat.totalRate / stat.rateCount : 80
    const res      = resourceMap.get(skillName)
    const estHours = res ? Number(res.est_hours) : 10
    const roi      = (stat.count * avgRate * 0.15) / estHours

    items.push({
      skillName,
      jobsUnlocked: stat.count,
      avgRate:      Math.round(avgRate),
      roi:          Math.round(roi * 10) / 10,
      status:       statusByName.get(skillName) ?? 'planned',
      resource:     res ? {
        title:    res.title,
        url:      res.url,
        provider: res.provider ?? '',
        format:   res.format ?? 'docs',
        estHours: Number(res.est_hours),
        isFree:   res.cost === 'free',
      } : null,
    })
  }

  items.sort((a, b) => b.roi - a.roi || b.jobsUnlocked - a.jobsUnlocked)
  return items.slice(0, 20)
}
