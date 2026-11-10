import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

// r/forhire is a moderated subreddit where clients post real freelance gigs
// under a [Hiring] flair — a genuine project-work source, unlike the remote
// job boards. Reddit throttles its public JSON endpoint for datacenter IPs,
// so when REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are configured we use the
// application-only OAuth flow (oauth.reddit.com); otherwise we fall back to
// the public endpoint, and a throttled run simply reports an adapter error.

const SUBREDDIT = 'forhire'
const UA = 'web:aiml-freelance-hub:1.0 (job aggregator)'

interface RedditPost {
  id: string
  title: string
  selftext: string | null
  permalink: string
  created_utc: number
  link_flair_text: string | null
  author?: string
}

interface RedditListing {
  data?: { children?: Array<{ data: RedditPost }> }
}

async function getOAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
    },
    body: 'grant_type=client_credentials',
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`Reddit OAuth token fetch failed: ${res.status}`)
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('Reddit OAuth token missing in response')
  return data.access_token
}

async function fetchListing(): Promise<RedditPost[]> {
  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  let url = `https://www.reddit.com/r/${SUBREDDIT}/new.json?limit=100&raw_json=1`
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: 'application/json' }

  if (clientId && clientSecret) {
    const token = await getOAuthToken(clientId, clientSecret)
    url = `https://oauth.reddit.com/r/${SUBREDDIT}/new?limit=100&raw_json=1`
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Reddit r/${SUBREDDIT} fetch failed: ${res.status}`)
  const data = await res.json() as RedditListing
  return (data.data?.children ?? []).map(c => c.data)
}

// Clients post as [Hiring]; freelancers advertise as [For Hire]. Flair is the
// reliable signal; the title prefix is the fallback when flair is unset.
function isHiringPost(post: RedditPost): boolean {
  if (post.link_flair_text) return /hiring/i.test(post.link_flair_text)
  return /^\s*\[hiring\]/i.test(post.title)
}

/** "$40-60/hr" | "$50 per hour" → hourly; "budget … $500(-800)" | "$500 budget" → fixed. */
export function parseRedditRates(text: string): {
  rate_min: number | null; rate_max: number | null; rate_type: 'hourly' | 'fixed'
} {
  const num = (s: string) => parseInt(s.replace(/,/g, ''), 10) || null

  const hourly = text.match(/\$(\d[\d,]*)(?:\s*[-–]\s*\$?(\d[\d,]*))?\s*(?:\/\s*|per\s+)h(?:ou)?r/i)
  if (hourly) {
    const min = num(hourly[1])
    return { rate_min: min, rate_max: hourly[2] ? num(hourly[2]) : min, rate_type: 'hourly' }
  }

  const fixed =
    text.match(/budget[^$\n]{0,24}\$(\d[\d,]*)(?:\s*[-–]\s*\$?(\d[\d,]*))?/i) ??
    text.match(/\$(\d[\d,]*)(?:\s*[-–]\s*\$?(\d[\d,]*))?\s*(?:budget|fixed|total|flat)/i)
  if (fixed) {
    const min = num(fixed[1])
    return { rate_min: min, rate_max: fixed[2] ? num(fixed[2]) : min, rate_type: 'fixed' }
  }

  // No stated rate — the type carries no signal, so use the system default.
  return { rate_min: null, rate_max: null, rate_type: 'hourly' }
}

function tagCandidatesFromText(text: string): string[] {
  const lower = text.toLowerCase()
  return [
    'python', 'pytorch', 'tensorflow', 'machine-learning', 'deep-learning',
    'nlp', 'computer-vision', 'huggingface', 'llm', 'rag', 'mlops',
    'fine-tuning', 'data-science', 'aws', 'docker', 'fastapi', 'chatbot',
  ].filter(t => lower.includes(t.replace('-', ' ')))
}

function cleanTitle(title: string): string {
  return title.replace(/^\s*\[hiring\]\s*/i, '').trim().slice(0, 140) || 'AI/ML freelance project'
}

export async function fetchRedditForhire(): Promise<RawJob[]> {
  const posts = await fetchListing()

  return posts
    .filter(p => p.id && p.title && isHiringPost(p))
    .filter(p => isAiMlJob(p.title, p.selftext ?? '', []))
    .map(p => {
      const body = (p.selftext ?? '').replace(/&amp;/g, '&').slice(0, 2000)
      const { rate_min, rate_max, rate_type } = parseRedditRates(`${p.title}\n${body}`)
      return {
        source_id:   `reddit-forhire-${p.id}`,
        source:      'reddit-forhire',
        title:       cleanTitle(p.title),
        company:     null, // clients post pseudonymously
        description: body,
        platform:    'Reddit r/forhire',
        url:         p.permalink ? `https://www.reddit.com${p.permalink}` : null,
        skills:      extractSkillsFromTags(tagCandidatesFromText(`${p.title} ${body}`)),
        location:    'Remote',
        rate_min,
        rate_max,
        posted_at:   p.created_utc ? new Date(p.created_utc * 1000).toISOString() : new Date().toISOString(),
        employment_type: 'contract' as const,
        rate_type,
      } satisfies RawJob
    })
}
