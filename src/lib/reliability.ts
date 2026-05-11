import type { JobListing } from './sources/types'
import { RELIABILITY_THRESHOLDS } from './config'

export interface ScoringResult {
  score:   number   // 0–100
  signals: Record<string, number>
  badge:   'trusted' | 'amber' | 'reject' | 'red'
}

// ─── Regex patterns ───────────────────────────────────────────────────────────

const SCAM_PATTERNS = {
  telegramContact:   /telegram\.me|t\.me\/|@[a-z0-9_]{3,}.*contact|contact.*whatsapp|wa\.me\//i,
  upfrontPayment:    /pay(?:ment)?\s*(?:setup|registration|processing|admin|training)\s*fee|buy\s+(?:starter|kit|equipment)/i,
  cryptoOnly:        /(?:pay|payment|salary)\s+(?:only\s+)?(?:in\s+)?(?:bitcoin|btc|eth|ethereum|crypto(?:currency)?)\b/i,
  unrealisticHigh:   /\$\s*(?:[5-9]\d{2}|\d{4,})[\s/]h(?:our|r)?/i,   // >$499/hr
  easyMoney:         /easy\s+money|work\s+from\s+home\s+and\s+earn|earn\s+\$\d+\s+per\s+(?:hour|day)\s+from\s+home|no\s+experience\s+(?:required|needed)/i,
  freeEmail:         /contact\s+(?:us|me)\s+at\s+[\w.]+@(?:gmail|yahoo|hotmail|outlook)\.com/i,
}

const POSITIVE_PATTERNS = {
  deliverables:   /(?:milestone|deliverable|specification|statement\s+of\s+work|sow|scope\s+of\s+work|sprint|backlog|acceptance\s+criteria)/i,
  companyUrl:     /(?:our\s+website|company\s+url|learn\s+more\s+at|visit\s+us\s+at)\s+https?:\/\//i,
  priorHires:     /(?:previously\s+hired|worked\s+with\s+(?:contractors|freelancers)|our\s+(?:last|previous)\s+(?:engineer|developer|contractor))/i,
  linkedinApply:  /linkedin\.com\/(jobs|in)\//i,
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreJob(
  job: JobListing,
  platformTier: number | null,  // 1–4 or null for unknown source
  isUSAJobs = false,
): ScoringResult {
  const signals: Record<string, number> = {}
  let score = 50  // baseline

  // ── Platform tier ──────────────────────────────────────────────────────────
  if (isUSAJobs) {
    signals.usajobs = 25
  } else if (platformTier === 1) {
    signals.platform_tier = 20
  } else if (platformTier === 2) {
    signals.platform_tier = 12
  } else if (platformTier === 3) {
    signals.platform_tier = 6
  } else {
    signals.platform_tier = 0  // no penalty, just no bonus
  }

  // ── Rate disclosed ─────────────────────────────────────────────────────────
  if (job.rateMin !== undefined || job.rateMax !== undefined) {
    signals.rate_disclosed = 10
    // Sanity check: flag suspiciously high rates (>$499/hr for coding)
    const rate = job.rateMax ?? job.rateMin ?? 0
    if (rate > 500) signals.unrealistic_rate = -20
    if (rate < 5 && rate > 0) signals.unrealistic_rate = -20
  }

  // ── Description quality ────────────────────────────────────────────────────
  const descLen = job.description.length
  if (descLen < 80) {
    signals.desc_too_short = -20
  } else if (descLen < 200) {
    signals.desc_short = -10
  } else if (descLen >= 200) {
    signals.desc_length = 8
  }
  if (descLen >= 500) signals.desc_detailed = 5

  // ── Positive content signals ───────────────────────────────────────────────
  if (POSITIVE_PATTERNS.deliverables.test(job.description)) signals.deliverables = 10
  if (POSITIVE_PATTERNS.companyUrl.test(job.description))    signals.company_url  = 8
  if (POSITIVE_PATTERNS.priorHires.test(job.description))    signals.prior_hires  = 5
  if (POSITIVE_PATTERNS.linkedinApply.test(job.sourceUrl))   signals.linkedin     = 5

  // ── Recency ────────────────────────────────────────────────────────────────
  const ageHours = (Date.now() - job.postedAt.getTime()) / 3_600_000
  if (ageHours < 24)    signals.very_recent =  10
  else if (ageHours < 168) signals.recent    = 6   // < 7 days

  // ── Negative / scam signals ────────────────────────────────────────────────
  const text = `${job.title} ${job.description} ${job.sourceUrl}`
  if (SCAM_PATTERNS.telegramContact.test(text))  signals.telegram_contact = -35
  if (SCAM_PATTERNS.upfrontPayment.test(text))   signals.upfront_payment  = -35
  if (SCAM_PATTERNS.cryptoOnly.test(text))       signals.crypto_only      = -25
  if (SCAM_PATTERNS.easyMoney.test(text))        signals.easy_money       = -25
  if (SCAM_PATTERNS.freeEmail.test(text))        signals.free_email       = -15
  if (SCAM_PATTERNS.unrealisticHigh.test(text))  signals.unrealistic_rate = -20

  // ── Company / source credibility ───────────────────────────────────────────
  if (job.company && job.company.length > 0) signals.company_named = 5

  // ── Apply all signals ──────────────────────────────────────────────────────
  for (const v of Object.values(signals)) score += v
  score = Math.max(0, Math.min(100, Math.round(score)))

  let badge: ScoringResult['badge']
  if (score < RELIABILITY_THRESHOLDS.autoReject)       badge = 'reject'
  else if (score < RELIABILITY_THRESHOLDS.amber)       badge = 'red'
  else if (score < RELIABILITY_THRESHOLDS.trusted)     badge = 'amber'
  else                                                  badge = 'trusted'

  return { score, signals, badge }
}

export function shouldAutoApprove(result: ScoringResult, isUSAJobs = false): boolean {
  if (isUSAJobs) return result.score >= 80
  return false
}

export function shouldAutoReject(result: ScoringResult): boolean {
  return result.score < RELIABILITY_THRESHOLDS.autoReject
}

// Human-readable signal labels for UI tooltips
export const SIGNAL_LABELS: Record<string, string> = {
  usajobs:          '✅ Official US government job board',
  platform_tier:    '✅ Listed on trusted freelance platform',
  rate_disclosed:   '✅ Rate/salary disclosed',
  unrealistic_rate: '⚠️ Rate appears unrealistic',
  desc_length:      '✅ Detailed description',
  desc_detailed:    '✅ Very detailed description',
  desc_short:       '⚠️ Short description',
  desc_too_short:   '🚩 Description too short',
  deliverables:     '✅ Mentions deliverables/milestones',
  company_url:      '✅ Company URL provided',
  prior_hires:      '✅ Prior hire history mentioned',
  linkedin:         '✅ LinkedIn application link',
  very_recent:      '✅ Posted today',
  recent:           '✅ Posted this week',
  company_named:    '✅ Named company',
  telegram_contact: '🚨 Telegram/WhatsApp contact — common scam signal',
  upfront_payment:  '🚨 Mentions upfront fees — likely scam',
  crypto_only:      '🚩 Crypto-only payment',
  easy_money:       '🚩 "Easy money" language',
  free_email:       '⚠️ Contact via free email provider',
}
