import { getResourceForSkill, type LearningResource } from './learning-resources'

export interface SkillGap {
  skill: string
  jobsUnlocked: number
  avgRate: number          // average of (rate_min + rate_max) / 2 across qualifying jobs
  roi: number              // jobsUnlocked × avgRate — simple impact score
  resource: LearningResource | null
}

interface Job {
  skills: string[]
  rate_min: number | null
  rate_max: number | null
}

export function computeRoadmap(userSkills: string[], jobs: Job[]): SkillGap[] {
  const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()))

  // For each skill missing from user, count jobs and avg rate
  const gapMap = new Map<string, { count: number; rateSum: number; rateCount: number }>()

  for (const job of jobs) {
    const jobRate = job.rate_min && job.rate_max
      ? (job.rate_min + job.rate_max) / 2
      : job.rate_min ?? job.rate_max ?? 0

    for (const skill of job.skills ?? []) {
      if (!userSkillsLower.has(skill.toLowerCase())) {
        const entry = gapMap.get(skill) ?? { count: 0, rateSum: 0, rateCount: 0 }
        entry.count += 1
        if (jobRate > 0) { entry.rateSum += jobRate; entry.rateCount += 1 }
        gapMap.set(skill, entry)
      }
    }
  }

  const gaps: SkillGap[] = []
  for (const [skill, { count, rateSum, rateCount }] of gapMap) {
    if (count < 2) continue // skip skills appearing in only 1 job
    const avgRate = rateCount > 0 ? Math.round(rateSum / rateCount) : 0
    gaps.push({
      skill,
      jobsUnlocked: count,
      avgRate,
      roi: count * avgRate,
      resource: getResourceForSkill(skill),
    })
  }

  // Sort by ROI descending
  return gaps.sort((a, b) => b.roi - a.roi).slice(0, 20)
}
