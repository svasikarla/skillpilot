import { XMLParser } from 'fast-xml-parser'
import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

const PARSER = new XMLParser({ ignoreAttributes: false })

export async function fetchWellfound(): Promise<JobListing[]> {
  // Wellfound public startup jobs RSS
  const res = await fetch(
    'https://wellfound.com/jobs.rss?role=Engineer&remote=true',
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`Wellfound HTTP ${res.status}`)

  const xml = await res.text()
  const parsed = PARSER.parse(xml)
  const items: Record<string, string>[] = parsed?.rss?.channel?.item ?? []

  return items
    .filter(item => {
      const title = item.title ?? ''
      const desc  = item.description ?? ''
      return isAiMlJob(title, desc)
    })
    .map(item => {
      const url   = item.link ?? item.guid ?? ''
      const title = item.title ?? ''
      const desc  = (item.description ?? '').replace(/<[^>]+>/g, ' ').trim()
      return {
        sourceId:    `wellfound-${Buffer.from(url).toString('base64').slice(0, 24)}`,
        sourceUrl:   url,
        title,
        company:     item['dc:creator'] ?? undefined,
        description: desc,
        rateType:    'unknown' as const,
        jobType:     'remote' as const,
        isRemote:    true,
        postedAt:    safeDate(item.pubDate),
      }
    })
}
