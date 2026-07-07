import { getResourceForSkill, type LearningResource } from './learning-resources'
import { canonicalizeSkill, expandWithUmbrellas } from './skills-canonical'

export interface SkillGap {
  skill: string
  jobsUnlocked: number
  avgRate: number
  roi: number            // jobs × avgRate × 0.15 / est_hours  (PRD formula)
  roiRaw: number         // jobs × avgRate (for relative bar)
  roiLabel: string       // human-readable narrative
  resource: LearningResource | null
}

interface Job {
  skills: string[]
  rate_min: number | null
  rate_max: number | null
}

export function computeRoadmap(
  userSkills: string[],
  learnedSkills: string[],
  jobs: Job[]
): SkillGap[] {
  // Umbrella expansion stops the roadmap recommending 'RAG Pipelines' to
  // someone who already knows Pinecone; canonicalizing job skills makes gap
  // names line up with the learning-resources map.
  const knownLower = new Set(
    expandWithUmbrellas([...userSkills, ...learnedSkills]).map(s => s.toLowerCase())
  )

  const gapMap = new Map<string, { count: number; rateSum: number; rateCount: number }>()

  for (const job of jobs) {
    const jobRate = job.rate_min && job.rate_max
      ? (job.rate_min + job.rate_max) / 2
      : job.rate_min ?? job.rate_max ?? 0

    const jobSkills = new Set(
      (job.skills ?? []).map(s => canonicalizeSkill(s) ?? s)
    )
    for (const skill of jobSkills) {
      if (!knownLower.has(skill.toLowerCase())) {
        const entry = gapMap.get(skill) ?? { count: 0, rateSum: 0, rateCount: 0 }
        entry.count += 1
        if (jobRate > 0) { entry.rateSum += jobRate; entry.rateCount += 1 }
        gapMap.set(skill, entry)
      }
    }
  }

  const gaps: SkillGap[] = []
  for (const [skill, { count, rateSum, rateCount }] of gapMap) {
    if (count < 2) continue
    const avgRate    = rateCount > 0 ? Math.round(rateSum / rateCount) : 0
    const resource   = getResourceForSkill(skill)
    const estHours   = resource?.est_hours ?? 8
    // PRD formula: jobs × avgRate × 0.15 (assumed win rate) / est_hours
    const roi        = avgRate > 0 ? Math.round(count * avgRate * 0.15 / estHours) : count
    const roiRaw     = count * avgRate

    const roiLabel = avgRate > 0
      ? `Adding ${skill} unlocks ${count} job${count !== 1 ? 's' : ''} averaging $${avgRate}/hr. Est. ${estHours}h to learn.`
      : `Adding ${skill} unlocks ${count} job${count !== 1 ? 's' : ''}.`

    gaps.push({ skill, jobsUnlocked: count, avgRate, roi, roiRaw, roiLabel, resource })
  }

  return gaps.sort((a, b) => b.roi - a.roi).slice(0, 20)
}
