import type { RawJob } from './ingest/types'

export interface ReliabilityResult {
  score: number       // 0-100
  tier: 'green' | 'amber' | 'red'
  flags: string[]     // human-readable signals found
}

const TIER_1_PLATFORMS = new Set(['upwork', 'toptal', 'contra', 'braintrust', 'gun.io'])
const TIER_2_PLATFORMS = new Set(['remotive', 'remoteok', 'himalayas', 'turing', 'freelancer', 'arc.dev'])

const SCAM_PHRASES = [
  'whatsapp', 'telegram', 'registration fee', 'training fee', 'joining fee',
  'pay to work', 'wire transfer', 'western union', 'moneygram', 'crypto payment',
  'bitcoin payment', 'easy money', 'no experience needed', 'work from home no experience',
  'earn $1000 a day', 'guaranteed income', 'be your own boss',
]

const QUALITY_PHRASES = [
  'github', 'portfolio', 'interview', 'technical assessment', 'take-home',
  'escrow', 'milestone payment', 'full-time', 'contract', 'part-time',
]

export function scoreReliability(job: Pick<RawJob, 'title' | 'description' | 'platform' | 'rate_min' | 'rate_max' | 'company' | 'url'>): ReliabilityResult {
  const text = `${job.title} ${job.description}`.toLowerCase()
  const platformLower = (job.platform ?? '').toLowerCase()
  const flags: string[] = []
  let score = 50 // start neutral

  // ── Positive signals ──────────────────────────────────────────────────────
  if (TIER_1_PLATFORMS.has(platformLower)) {
    score += 25
    flags.push('Tier 1 platform')
  } else if (TIER_2_PLATFORMS.has(platformLower)) {
    score += 12
    flags.push('Tier 2 platform')
  }

  if (job.rate_min || job.rate_max) {
    score += 8
    flags.push('Rate disclosed')
  }

  if (job.company && job.company.trim().length > 2) {
    score += 5
    flags.push('Company named')
  }

  if (job.description && job.description.length > 300) {
    score += 5
    flags.push('Detailed description')
  }

  if (QUALITY_PHRASES.some(p => text.includes(p))) {
    score += 5
    flags.push('Professional process mentioned')
  }

  if (job.url?.includes('linkedin.com')) {
    score += 5
    flags.push('LinkedIn listing')
  }

  // ── Negative signals ─────────────────────────────────────────────────────
  const foundScam = SCAM_PHRASES.filter(p => text.includes(p))
  if (foundScam.length > 0) {
    score -= 35 * Math.min(foundScam.length, 2)
    flags.push(`Red flag: "${foundScam[0]}"`)
  }

  if (!job.description || job.description.length < 80) {
    score -= 15
    flags.push('Too short description')
  }

  if (!job.company) {
    score -= 8
    flags.push('No company name')
  }

  // suspicious rate: > $400/hr for AI/ML (likely annual salary misrepresented)
  if (job.rate_min && job.rate_min > 400) {
    score -= 10
    flags.push('Unusually high hourly rate')
  }

  const clampedScore = Math.max(0, Math.min(100, score))
  return {
    score: clampedScore,
    tier: clampedScore >= 70 ? 'green' : clampedScore >= 40 ? 'amber' : 'red',
    flags,
  }
}

export function tierLabel(tier: 'green' | 'amber' | 'red'): string {
  return { green: 'Verified', amber: 'Review', red: 'Caution' }[tier]
}

export function tierFromScore(score: number): 'green' | 'amber' | 'red' {
  return score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red'
}
