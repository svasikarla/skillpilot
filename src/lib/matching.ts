import { cosine, parseEmbedding } from './embeddings'
import { MATCH_WEIGHTS, MATCH_THRESHOLDS } from './config'

export interface MemberProfile {
  id:              string
  targetHourlyRate: number | null
  hoursPerWeek:    number | null
  yearsExperience: number | null
  profileEmbedding: string | null
  skills: Array<{ name: string; selfRating: number }>
}

export interface JobForMatch {
  id:           string
  extractedSkills: string[] | null
  jobEmbedding: string | null
  rateMin:      number | null
  rateMax:      number | null
  description:  string | null
}

export interface MatchResult {
  memberId:      string
  jobId:         string
  matchScore:    number   // 0–100
  skillScore:    number
  semanticScore: number
  rateScore:     number
  expScore:      number
  availScore:    number
  matchedSkills: string[]
  missingSkills: string[]
  isNearMiss:    boolean
}

// ─── Component scorers ────────────────────────────────────────────────────────

function skillScore(memberSkills: string[], jobSkills: string[]): {
  score: number; matched: string[]; missing: string[]
} {
  if (!jobSkills.length) return { score: 0.7, matched: [], missing: [] }  // no required skills → neutral

  const memberSet = new Set(memberSkills.map(s => s.toLowerCase()))
  const matched: string[] = []
  const missing: string[] = []

  for (const skill of jobSkills) {
    if (memberSet.has(skill.toLowerCase())) {
      matched.push(skill)
    } else {
      missing.push(skill)
    }
  }

  const score = matched.length / jobSkills.length
  return { score, matched, missing }
}

function semanticScore(profileEmb: number[] | null, jobEmb: number[] | null): number {
  if (!profileEmb || !jobEmb) return 0.5  // no embeddings → neutral
  const sim = cosine(profileEmb, jobEmb)
  // cosine is typically 0.5–1.0 for related texts; normalise to 0–1
  return Math.max(0, (sim - 0.3) / 0.7)
}

function rateScore(targetRate: number | null, rateMin: number | null, rateMax: number | null): number {
  if (!targetRate) return 0.5  // no preference → neutral
  if (!rateMin && !rateMax) return 0.5  // no rate info

  const midRate = rateMax
    ? (rateMin ? (rateMin + rateMax) / 2 : rateMax)
    : (rateMin ?? 0)

  if (midRate === 0) return 0.5

  const ratio = targetRate / midRate
  // perfect: ratio 0.8–1.2; penalise if rate too low or we're way over budget
  if (ratio >= 0.8 && ratio <= 1.2) return 1.0
  if (ratio >= 0.6 && ratio < 0.8)  return 0.7
  if (ratio > 1.2 && ratio <= 1.5)  return 0.8  // we're a little over, but ok
  if (ratio > 1.5 && ratio <= 2.0)  return 0.5  // we're expensive
  if (ratio > 2.0)                  return 0.2  // too expensive
  return 0.4  // rate too low for our target
}

function experienceScore(memberYears: number | null, description: string | null): number {
  if (!memberYears || !description) return 0.5

  // Extract years required from description
  const match = description.match(/(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)/i)
  if (!match) return 0.6  // no requirement found → slight positive
  const required = parseInt(match[1], 10)

  if (memberYears >= required)       return 1.0
  if (memberYears >= required - 1)   return 0.8
  if (memberYears >= required * 0.7) return 0.5
  return 0.2
}

function availabilityScore(memberHours: number | null, description: string | null): number {
  if (!memberHours) return 0.5

  // Extract hours/week or time commitment from description
  const fullTime  = /full.?time|40\s*hours?\s*(?:per\s*)?week|40h\/w/i.test(description ?? '')
  const partTime  = /part.?time|20\s*hours?\s*(?:per\s*)?week|20h\/w/i.test(description ?? '')
  const contract  = /contract|freelance|consulting/i.test(description ?? '')

  if (fullTime && memberHours >= 35) return 1.0
  if (fullTime && memberHours >= 20) return 0.6
  if (fullTime && memberHours < 20)  return 0.2
  if (partTime && memberHours >= 15) return 1.0
  if (partTime && memberHours >= 10) return 0.7
  if (contract)                       return 0.8  // flexible — we're good
  return 0.7  // no specific requirement
}

// ─── Main match function ──────────────────────────────────────────────────────

export function computeMatch(member: MemberProfile, job: JobForMatch): MatchResult {
  const memberSkillNames = member.skills
    .filter(s => s.selfRating >= 2)
    .map(s => s.name)

  const jobSkills = job.extractedSkills ?? []
  const { score: rawSkill, matched, missing } = skillScore(memberSkillNames, jobSkills)

  const profileEmb = parseEmbedding(member.profileEmbedding)
  const jobEmb     = parseEmbedding(job.jobEmbedding)

  const rawSemantic = semanticScore(profileEmb, jobEmb)
  const rawRate     = rateScore(member.targetHourlyRate, job.rateMin ? Number(job.rateMin) : null, job.rateMax ? Number(job.rateMax) : null)
  const rawExp      = experienceScore(member.yearsExperience, job.description)
  const rawAvail    = availabilityScore(member.hoursPerWeek, job.description)

  // Weighted composite
  let composite =
    rawSkill    * MATCH_WEIGHTS.skill    +
    rawSemantic * MATCH_WEIGHTS.semantic +
    rawRate     * MATCH_WEIGHTS.rate     +
    rawExp      * MATCH_WEIGHTS.exp      +
    rawAvail    * MATCH_WEIGHTS.avail

  // Hard gate: < 40% of required skills matched → cap score
  let isNearMiss = false
  if (jobSkills.length > 0) {
    const matchRatio = matched.length / jobSkills.length
    if (matchRatio < MATCH_THRESHOLDS.hardGate) {
      composite  = Math.min(composite, MATCH_THRESHOLDS.hardGateCap)
      isNearMiss = true
    }
  }

  const matchScore = Math.max(0, Math.min(100, Math.round(composite * 100)))

  return {
    memberId:      member.id,
    jobId:         job.id,
    matchScore,
    skillScore:    Math.round(rawSkill    * 100),
    semanticScore: Math.round(rawSemantic * 100),
    rateScore:     Math.round(rawRate     * 100),
    expScore:      Math.round(rawExp      * 100),
    availScore:    Math.round(rawAvail    * 100),
    matchedSkills: matched,
    missingSkills: missing,
    isNearMiss,
  }
}

export function matchLabel(score: number, isNearMiss: boolean): string {
  if (isNearMiss) return 'Near Miss'
  if (score >= MATCH_THRESHOLDS.applyReady) return 'Apply Ready'
  if (score >= MATCH_THRESHOLDS.nearMiss)   return 'Stretch'
  return 'Low Match'
}
