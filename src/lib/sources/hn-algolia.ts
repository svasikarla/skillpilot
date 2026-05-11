import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

interface AlgoliaHit {
  objectID: string
  story_text?: string
  comment_text?: string
  title?: string
  author: string
  created_at: string
  story_id?: number
}

interface AlgoliaResponse {
  hits: AlgoliaHit[]
}

// Fetch current month's "Ask HN: Who is hiring?" thread and extract AI/ML listings
export async function fetchHNWhoIsHiring(): Promise<JobListing[]> {
  const now    = new Date()
  const year   = now.getFullYear()
  const month  = now.getMonth() + 1
  const query  = encodeURIComponent(`Ask HN: Who is hiring? (${now.toLocaleString('en-US', { month: 'long' })} ${year})`)

  // Find the monthly thread
  const searchRes = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=1`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!searchRes.ok) throw new Error(`HN Algolia search HTTP ${searchRes.status}`)

  const { hits: threads }: AlgoliaResponse = await searchRes.json()
  if (!threads.length) {
    // fallback: previous month
    console.warn(`[hn-algolia] No hiring thread found for ${month}/${year}`)
    return []
  }

  const threadId = threads[0].objectID

  // Fetch all top-level comments on that thread
  const commentsRes = await fetch(
    `https://hn.algolia.com/api/v1/search?tags=comment,story_${threadId}&hitsPerPage=200`,
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!commentsRes.ok) throw new Error(`HN Algolia comments HTTP ${commentsRes.status}`)

  const { hits }: AlgoliaResponse = await commentsRes.json()

  return hits
    .filter(hit => {
      const text = hit.comment_text ?? hit.story_text ?? ''
      return isAiMlJob('', text)
    })
    .map(hit => {
      const text  = hit.comment_text ?? hit.story_text ?? ''
      const lines = text.split('\n').filter(Boolean)
      const title = lines[0]?.replace(/<[^>]+>/g, '').slice(0, 120) ?? 'HN Hiring Post'
      return {
        sourceId:    `hn-${hit.objectID}`,
        sourceUrl:   `https://news.ycombinator.com/item?id=${hit.objectID}`,
        title,
        description: text.replace(/<[^>]+>/g, ' ').trim(),
        rateType:    'unknown' as const,
        jobType:     'remote' as const,
        isRemote:    true,
        postedAt:    safeDate(hit.created_at),
      }
    })
}
