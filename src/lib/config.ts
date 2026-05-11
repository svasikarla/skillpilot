// All tunable constants — change here without touching logic files

export const MATCH_WEIGHTS = {
  skill:    0.40,
  semantic: 0.25,
  rate:     0.15,
  exp:      0.12,
  avail:    0.08,
} as const

export const RELIABILITY_THRESHOLDS = {
  autoReject: 20,  // score < 20  → auto-rejected, never shown
  amber:      40,  // score 40–69 → amber "Verify" badge
  trusted:    70,  // score >= 70 → green "Trusted" badge
} as const

export const MATCH_THRESHOLDS = {
  applyReady: 70,  // "Apply Ready" — user meets the job well
  nearMiss:   50,  // "Stretch"    — close but missing 1–2 skills
  hardGate:   0.4, // if matched_required / total_required < 0.40 → cap score at 0.55
  hardGateCap: 0.55,
  nearSkillCosine: 0.82, // cosine threshold for near-skill matching in skill embedding space
} as const

export const PROPOSAL = {
  dailyLimit: 15,
  variants: {
    concise:  { min: 140, max: 150 },
    standard: { min: 175, max: 185 },
    detailed: { min: 210, max: 220 },
  },
} as const

export const EMBEDDING = {
  model: 'text-embedding-3-small',
  dims:  512,
} as const

export const MODELS = {
  proposals:   'claude-sonnet-4-6',
  audit:       'claude-haiku-4-5-20251001',
  standout:    'claude-haiku-4-5-20251001',
  skillExtract: 'gpt-4.1-nano',
} as const

export const FEED = {
  pageSize:       50,
  maxJobAgedays:  30,  // only recompute matches for jobs posted in last N days
} as const

export const SCAM = {
  reportsToHide: 3,  // member reports before a listing is auto-hidden pending review
} as const

export const PLATFORM_GUIDE = {
  staleAfterDays: 90,  // show "may be outdated" warning on guides older than N days
} as const

export const GROUP = {
  maxMembers: 30,
} as const

export const PROFILE = {
  maxPortfolioItems: 5,
} as const
