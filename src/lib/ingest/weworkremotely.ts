import { XMLParser } from 'fast-xml-parser'
import { RawJob, EmploymentType, isAiMlJob, extractSkillsFromTags, inferEmploymentType } from './types'

interface WWRItem {
  title: string
  link: string
  pubDate?: string
  description?: string
  guid?: string | { '#text': string }
}

interface WWRFeed {
  rss: { channel: { item: WWRItem | WWRItem[] } }
}

function parseTitle(raw: string): { title: string; company: string | null } {
  const clean = raw.replace(/<[^>]*>/g, '').trim()
  // WWR format: "Company: Role Title" — colon is the separator
  const colonIdx = clean.indexOf(':')
  if (colonIdx > 0 && colonIdx < 60) {
    return {
      company: clean.slice(0, colonIdx).trim() || null,
      title:   clean.slice(colonIdx + 1).trim() || clean,
    }
  }
  return { title: clean, company: null }
}

function tagCandidatesFromText(text: string): string[] {
  const lower = text.toLowerCase()
  return [
    'python', 'pytorch', 'tensorflow', 'machine-learning', 'deep-learning',
    'nlp', 'computer-vision', 'huggingface', 'llm', 'rag', 'mlops',
    'fine-tuning', 'data-science', 'aws', 'docker', 'fastapi',
  ].filter(t => lower.includes(t.replace('-', ' ')))
}

async function fetchFeed(url: string, forcedType: EmploymentType | null): Promise<RawJob[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'aiml-freelance-hub/1.0' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`We Work Remotely RSS fetch failed (${url}): ${res.status}`)

  const xml = await res.text()
  const parser = new XMLParser({ ignoreAttributes: false, cdataPropName: '__cdata' })
  const parsed = parser.parse(xml) as WWRFeed

  const rawItems = parsed.rss?.channel?.item
  const items: WWRItem[] = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

  return items
    .filter(j => {
      const desc = (j.description ?? '').replace(/<[^>]*>/g, '')
      return isAiMlJob(j.title ?? '', desc, [])
    })
    .map((j, i) => {
      const desc = (j.description ?? '').replace(/<[^>]*>/g, '').slice(0, 2000)
      const { title, company } = parseTitle(j.title ?? '')
      const guidRaw = typeof j.guid === 'string' ? j.guid : (j.guid?.['#text'] ?? `wwr-${i}`)

      return {
        source_id:   `wwr-${Buffer.from(guidRaw).toString('base64').slice(0, 20)}`,
        source:      'weworkremotely',
        title,
        company,
        description: desc,
        platform:    'We Work Remotely',
        url:         j.link ?? `https://weworkremotely.com`,
        skills:      extractSkillsFromTags(tagCandidatesFromText(desc)),
        location:    'Remote',
        rate_min:    null,
        rate_max:    null,
        posted_at:   j.pubDate ? new Date(j.pubDate).toISOString() : new Date().toISOString(),
        employment_type: forcedType ?? inferEmploymentType(title, desc),
      } satisfies RawJob
    })
}

export async function fetchWeWorkRemotely(): Promise<RawJob[]> {
  const [programming, contracts] = await Promise.all([
    fetchFeed('https://weworkremotely.com/categories/remote-programming-jobs.rss', null),
    fetchFeed('https://weworkremotely.com/categories/remote-contract-jobs.rss', 'contract').catch(err => {
      console.warn('[ingest] WWR contracts feed failed:', err)
      return []
    }),
  ])

  // Dedup by source_id (a job can appear in both feeds)
  const seen = new Set<string>()
  const merged: RawJob[] = []
  for (const job of [...contracts, ...programming]) {
    if (seen.has(job.source_id)) continue
    seen.add(job.source_id)
    merged.push(job)
  }
  return merged
}
