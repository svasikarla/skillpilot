import { XMLParser } from 'fast-xml-parser'
import type { JobListing } from './types'
import { isAiMlJob, safeDate } from './types'

const PARSER = new XMLParser({ ignoreAttributes: false })

export async function fetchWeWorkRemotely(): Promise<JobListing[]> {
  const res = await fetch(
    'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    { signal: AbortSignal.timeout(10_000) }
  )
  if (!res.ok) throw new Error(`WWR HTTP ${res.status}`)

  const xml = await res.text()
  const parsed = PARSER.parse(xml)
  const items: Record<string, string>[] = parsed?.rss?.channel?.item ?? []

  return items
    .filter(item => {
      const title = item.title ?? ''
      const desc  = item.description ?? item['content:encoded'] ?? ''
      return isAiMlJob(title, desc)
    })
    .map(item => {
      const url   = item.link ?? item.guid ?? ''
      const title = item.title ?? ''
      const desc  = item.description ?? item['content:encoded'] ?? ''
      return {
        sourceId:    `wwr-${Buffer.from(url).toString('base64').slice(0, 24)}`,
        sourceUrl:   url,
        title,
        company:     item['dc:creator'] ?? undefined,
        description: desc.replace(/<[^>]+>/g, ' ').trim(),
        rateType:    'unknown' as const,
        jobType:     'remote' as const,
        isRemote:    true,
        postedAt:    safeDate(item.pubDate),
      }
    })
}
