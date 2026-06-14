// Pure pipeline analytics for the application tracker. Kept free of React/DOM so
// it can be unit-tested directly and reused server-side if needed.

export const APPLIED_STATUSES = ['submitted', 'interviewing', 'negotiating'] as const
export const ACTIVE_STATUSES = ['in_progress', 'submitted', 'interviewing', 'negotiating'] as const
export const DECIDED_STATUSES = ['won', 'lost', 'no_response'] as const

export const DAY_MS = 24 * 60 * 60 * 1000
export const DEFAULT_STALE_DAYS = 7
export const MAX_STALE_ITEMS = 5

/** Minimal application shape needed for analytics — decoupled from the full DB row. */
export interface TrackerApplication {
  status: string
  rate_agreed: number | null
  updated_at: string
}

export interface PipelineStats {
  saved: number
  applied: number
  won: number
  total: number
}

export interface StaleApplication<T> {
  application: T
  daysStale: number
}

export interface TrackerAnalytics<T> {
  stats: PipelineStats
  decidedCount: number
  /** Win rate as a 0–100 percentage, or null when no application is decided yet. */
  winRate: number | null
  /** Average agreed hourly rate across won applications, or null when none. */
  avgWonRate: number | null
  /** Active applications untouched beyond the stale window, oldest first, capped. */
  staleApps: StaleApplication<T>[]
}

function includes(list: readonly string[], status: string): boolean {
  return list.includes(status)
}

export function computeTrackerAnalytics<T extends TrackerApplication>(
  apps: T[],
  now: number,
  options: { staleDays?: number; maxStale?: number } = {},
): TrackerAnalytics<T> {
  const staleDays = options.staleDays ?? DEFAULT_STALE_DAYS
  const maxStale = options.maxStale ?? MAX_STALE_ITEMS

  const stats: PipelineStats = {
    saved:   apps.filter(a => a.status === 'saved').length,
    applied: apps.filter(a => includes(APPLIED_STATUSES, a.status)).length,
    won:     apps.filter(a => a.status === 'won').length,
    total:   apps.length,
  }

  const decidedCount = apps.filter(a => includes(DECIDED_STATUSES, a.status)).length
  const winRate = decidedCount ? Math.round((stats.won / decidedCount) * 100) : null

  const wonRates = apps
    .filter(a => a.status === 'won' && a.rate_agreed)
    .map(a => a.rate_agreed as number)
  const avgWonRate = wonRates.length
    ? Math.round(wonRates.reduce((sum, rate) => sum + rate, 0) / wonRates.length)
    : null

  const staleThreshold = staleDays * DAY_MS
  const staleApps = apps
    .filter(a => includes(ACTIVE_STATUSES, a.status) && now - new Date(a.updated_at).getTime() > staleThreshold)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    .slice(0, maxStale)
    .map(a => ({
      application: a,
      daysStale: Math.floor((now - new Date(a.updated_at).getTime()) / DAY_MS),
    }))

  return { stats, decidedCount, winRate, avgWonRate, staleApps }
}
