// Freshness / staleness rules for ingested jobs.
//
// Source APIs only return currently-open postings at fetch time, but the app
// stores them and never re-checks. Two mechanisms keep the feed current:
//   1. Ingest stamps `last_seen_at` on every job observed in a source feed, and
//      archives approved jobs that have gone unseen for STALE_AFTER_DAYS.
//   2. The feed query hides anything older than DEFAULT_FEED_RECENCY_DAYS.

const DAY_MS = 86_400_000

/** Feed hides jobs whose posted_at is older than this, unless overridden. */
export const DEFAULT_FEED_RECENCY_DAYS = 45

/**
 * A job is treated as stale (likely filled/closed) once it has not appeared in
 * any source feed for this many days. Ingest fetches a bounded page per source,
 * so a still-open job can briefly drop out of results — this window absorbs that.
 */
export const STALE_AFTER_DAYS = 14

export interface FetchedRef {
  url: string | null
}

/**
 * Split freshly fetched jobs into the new ones (to insert) and the URLs of those
 * that already exist (to bump `last_seen_at`). URL-less jobs are always treated
 * as new since they can't be deduped. URLs in `urlsToTouch` are de-duplicated.
 */
export function partitionFetchedJobs<T extends FetchedRef>(
  fetched: T[],
  existingUrls: Set<string>,
): { toInsert: T[]; urlsToTouch: string[] } {
  const toInsert: T[] = []
  const touch = new Set<string>()
  for (const job of fetched) {
    if (job.url == null || !existingUrls.has(job.url)) {
      toInsert.push(job)
    } else {
      touch.add(job.url)
    }
  }
  return { toInsert, urlsToTouch: [...touch] }
}

/** ISO cutoff; approved jobs with `last_seen_at` before this are stale. */
export function staleCutoffISO(now: Date = new Date(), days: number = STALE_AFTER_DAYS): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString()
}

/**
 * Resolve the feed recency cutoff as an ISO string to filter `posted_at >=`, or
 * null to apply no cutoff. A `daysParam` of null falls back to `defaultDays`;
 * a value <= 0 (param or default) disables the cutoff entirely.
 */
export function feedRecencySinceISO(
  daysParam: number | null,
  now: Date = new Date(),
  defaultDays: number = DEFAULT_FEED_RECENCY_DAYS,
): string | null {
  const days = daysParam ?? defaultDays
  if (days <= 0) return null
  return new Date(now.getTime() - days * DAY_MS).toISOString()
}
