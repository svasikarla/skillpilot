export interface MatchResult {
  score: number          // 0-100 final score
  skillScore: number     // 0-100
  rateScore: number      // 0-100
  recencyScore: number   // 0-100
  semanticScore: number  // 0-100; 0 when no embedding available
  matchedSkills: string[]
  missingSkills: string[]
  isCapped: boolean      // true if skill coverage < 40% caused cap at 55
}

/**
 * Compute a multi-component match score between a user profile and a job.
 * Without semanticScore: skill 60%, rate 20%, recency 20%.
 * With semanticScore:    skill 50%, rate 15%, recency 15%, semantic 20%.
 */
export function computeMatch(params: {
  userSkills: string[]
  skillRatings: Record<string, number>  // skill_name → 1-5
  hourlyRate: number | null
  jobSkills: string[]
  jobRateMin: number | null
  jobRateMax: number | null
  jobRateType?: 'hourly' | 'fixed'  // fixed budgets aren't comparable to an hourly target
  jobPostedAt: string
  semanticScore?: number  // 0-100 cosine similarity scaled score (optional)
}): MatchResult {
  const { userSkills, skillRatings, hourlyRate, jobSkills, jobRateMin, jobRateMax, jobRateType, jobPostedAt } = params

  const userSkillsLower = new Set(userSkills.map(s => s.toLowerCase()))

  // ── Skill Score ─────────────────────────────────────────────────────────────
  const matchedSkills: string[] = []
  const missingSkills: string[] = []
  let weightedSum = 0
  let maxPossible = 0

  for (const jobSkill of jobSkills) {
    const key = jobSkill.toLowerCase()
    const hasSkill = userSkillsLower.has(key)
    maxPossible += 1

    if (hasSkill) {
      matchedSkills.push(jobSkill)
      // Find rating for this skill (match by display name, case-insensitive)
      const ratingKey = Object.keys(skillRatings).find(k => k.toLowerCase() === key)
      const rating = ratingKey ? (skillRatings[ratingKey] ?? 3) : 3
      // Rating 1-5 → contribution 0.5-1.0 (even beginner knowledge counts)
      weightedSum += 0.5 + (rating - 1) * 0.125
    } else {
      missingSkills.push(jobSkill)
    }
  }

  const rawSkillScore = maxPossible > 0 ? weightedSum / maxPossible : 0
  const coverage = jobSkills.length > 0 ? matchedSkills.length / jobSkills.length : 0
  const isCapped = coverage < 0.4 && jobSkills.length >= 3

  const skillScore = Math.round(rawSkillScore * 100)

  // ── Rate Score ───────────────────────────────────────────────────────────────
  let rateScore = 50 // neutral when no rate data, or when budget is a fixed total
  if (jobRateType !== 'fixed' && hourlyRate && (jobRateMin || jobRateMax)) {
    const jobMin = jobRateMin ?? jobRateMax ?? 0
    const jobMax = jobRateMax ?? jobRateMin ?? 0
    const jobMid = (jobMin + jobMax) / 2 || jobMin

    if (jobMid >= hourlyRate) {
      rateScore = 100
    } else if (jobMid >= hourlyRate * 0.7) {
      // Linearly scale between 70% and 100% of target
      rateScore = Math.round(((jobMid - hourlyRate * 0.7) / (hourlyRate * 0.3)) * 100)
    } else {
      rateScore = 0
    }
  }

  // ── Recency Score ────────────────────────────────────────────────────────────
  const daysOld = (Date.now() - new Date(jobPostedAt).getTime()) / 86400000
  const recencyScore = Math.round(Math.max(0, 100 - daysOld * (100 / 30)))

  // ── Weighted Final ───────────────────────────────────────────────────────────
  const hasSemantic = typeof params.semanticScore === 'number'
  const semanticScore = hasSemantic ? Math.round(params.semanticScore!) : 0
  const raw = hasSemantic
    ? skillScore * 0.50 + rateScore * 0.15 + recencyScore * 0.15 + semanticScore * 0.20
    : skillScore * 0.60 + rateScore * 0.20 + recencyScore * 0.20
  const score = isCapped ? Math.min(55, Math.round(raw)) : Math.round(raw)

  return { score, skillScore, rateScore, recencyScore, semanticScore, matchedSkills, missingSkills, isCapped }
}
