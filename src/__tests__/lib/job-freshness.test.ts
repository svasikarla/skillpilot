import { describe, it, expect } from 'vitest'
import {
  partitionFetchedJobs,
  staleCutoffISO,
  feedRecencySinceISO,
  STALE_AFTER_DAYS,
  DEFAULT_FEED_RECENCY_DAYS,
} from '@/lib/job-freshness'

const DAY_MS = 86_400_000

describe('partitionFetchedJobs', () => {
  it('routes unseen URLs to insert and seen URLs to touch', () => {
    const existing = new Set(['https://a.com/1'])
    const fetched = [
      { url: 'https://a.com/1', n: 'seen' },
      { url: 'https://a.com/2', n: 'new' },
    ]
    const { toInsert, urlsToTouch } = partitionFetchedJobs(fetched, existing)
    expect(toInsert.map(j => j.n)).toEqual(['new'])
    expect(urlsToTouch).toEqual(['https://a.com/1'])
  })

  it('always inserts URL-less jobs (cannot be deduped)', () => {
    const { toInsert, urlsToTouch } = partitionFetchedJobs(
      [{ url: null }, { url: null }],
      new Set(['https://a.com/1']),
    )
    expect(toInsert).toHaveLength(2)
    expect(urlsToTouch).toHaveLength(0)
  })

  it('de-duplicates repeated seen URLs in the touch list', () => {
    const existing = new Set(['https://a.com/1'])
    const { urlsToTouch } = partitionFetchedJobs(
      [{ url: 'https://a.com/1' }, { url: 'https://a.com/1' }],
      existing,
    )
    expect(urlsToTouch).toEqual(['https://a.com/1'])
  })
})

describe('staleCutoffISO', () => {
  it('returns the timestamp STALE_AFTER_DAYS before now by default', () => {
    const now = new Date('2026-06-14T00:00:00.000Z')
    const expected = new Date(now.getTime() - STALE_AFTER_DAYS * DAY_MS).toISOString()
    expect(staleCutoffISO(now)).toBe(expected)
  })

  it('honours a custom window', () => {
    const now = new Date('2026-06-14T00:00:00.000Z')
    expect(staleCutoffISO(now, 1)).toBe('2026-06-13T00:00:00.000Z')
  })
})

describe('feedRecencySinceISO', () => {
  const now = new Date('2026-06-14T00:00:00.000Z')

  it('falls back to the default window when no param is given', () => {
    const expected = new Date(now.getTime() - DEFAULT_FEED_RECENCY_DAYS * DAY_MS).toISOString()
    expect(feedRecencySinceISO(null, now)).toBe(expected)
  })

  it('uses an explicit day count', () => {
    expect(feedRecencySinceISO(7, now)).toBe(new Date(now.getTime() - 7 * DAY_MS).toISOString())
  })

  it('returns null when the resolved window is zero or negative', () => {
    expect(feedRecencySinceISO(0, now)).toBeNull()
    expect(feedRecencySinceISO(-5, now)).toBeNull()
  })

  it('returns null when the default is disabled and no param is given', () => {
    expect(feedRecencySinceISO(null, now, 0)).toBeNull()
  })
})
