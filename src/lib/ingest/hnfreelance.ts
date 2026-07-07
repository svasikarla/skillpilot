import { RawJob, isAiMlJob, extractSkillsFromTags } from './types'

// HN runs a monthly "Ask HN: Freelancer? Seeking freelancer?" thread alongside
// "Who is hiring?". Comments starting with SEEKING FREELANCER are clients with
// real project/contract work — exactly the inventory this app is for. Comments
// starting with SEEKING WORK are freelancers advertising themselves; skip those.

interface AlgoliaStoryHit {
  objectID: string
  title: string
  created_at: string
}

interface AlgoliaCommentHit {
  objectID: string
  comment_text: string | null
  created_at: string
}

const SEEKING_FREELANCER_RE = /^\s*seeking\s*[\[(]?\s*freelancer/i

// Convention: "SEEKING FREELANCER | Location/Remote | Short description"
function parseComment(text: string): { title: string; location: string } {
  const firstLine = text.split('\n')[0] ?? ''
  const parts = firstLine.split('|').map(s => s.trim()).filter(Boolean)
    .filter(p => !SEEKING_FREELANCER_RE.test(p))

  const location = parts.find(p => /remote/i.test(p)) ? 'Remote' : (parts[0] || 'Remote')
  const titlePart = parts.find(p => !/remote/i.test(p) && p.length > 8)
  return {
    title: titlePart ? titlePart.slice(0, 120) : 'AI/ML freelance project',
    location,
  }
}

function tagCandidatesFromText(text: string): string[] {
  const lower = text.toLowerCase()
  return [
    'python', 'pytorch', 'tensorflow', 'machine-learning', 'deep-learning',
    'nlp', 'computer-vision', 'huggingface', 'llm', 'rag', 'mlops',
    'fine-tuning', 'data-science', 'aws', 'docker', 'fastapi',
  ].filter(t => lower.includes(t.replace('-', ' ')))
}

/** Threads older than this are treated as discontinued, not current inventory. */
const MAX_THREAD_AGE_DAYS = 40

export async function fetchHNFreelance(): Promise<RawJob[]> {
  // Step 1: latest monthly "Freelancer? Seeking freelancer?" thread. Must use
  // search_by_date (newest first) — relevance search returns years-old threads.
  // HN paused this thread after October 2025; the freshness guard keeps stale
  // gigs out while letting the adapter revive automatically if it returns.
  const storyRes = await fetch(
    'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10',
    { headers: { 'User-Agent': 'aiml-freelance-hub/1.0' }, next: { revalidate: 0 } }
  )
  if (!storyRes.ok) throw new Error(`HN Algolia freelance story fetch failed: ${storyRes.status}`)
  const storyData = await storyRes.json() as { hits: AlgoliaStoryHit[] }
  const story = storyData.hits.find(h => /seeking freelancer/i.test(h.title ?? ''))
  if (!story) return []
  const ageDays = (Date.now() - new Date(story.created_at).getTime()) / 86_400_000
  if (ageDays > MAX_THREAD_AGE_DAYS) return []

  // Step 2: SEEKING FREELANCER comments within that thread
  const commentsRes = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${story.objectID}&query=SEEKING+FREELANCER&hitsPerPage=100`,
    { headers: { 'User-Agent': 'aiml-freelance-hub/1.0' }, next: { revalidate: 0 } }
  )
  if (!commentsRes.ok) throw new Error(`HN Algolia freelance comments fetch failed: ${commentsRes.status}`)
  const commentsData = await commentsRes.json() as { hits: AlgoliaCommentHit[] }

  return commentsData.hits
    .map(h => ({ hit: h, text: (h.comment_text ?? '').replace(/<[^>]*>/g, ' ').trim() }))
    .filter(({ text }) => SEEKING_FREELANCER_RE.test(text) && isAiMlJob('', text, []))
    .map(({ hit, text }) => {
      const clipped = text.slice(0, 2000)
      const { title, location } = parseComment(clipped)
      return {
        source_id:   `hnfreelance-${hit.objectID}`,
        source:      'hnfreelance',
        title,
        company:     null,
        description: clipped,
        platform:    'HN Freelance Thread',
        url:         `https://news.ycombinator.com/item?id=${hit.objectID}`,
        skills:      extractSkillsFromTags(tagCandidatesFromText(clipped)),
        location,
        rate_min:    null,
        rate_max:    null,
        posted_at:   hit.created_at ?? new Date().toISOString(),
        employment_type: 'contract' as const,
      } satisfies RawJob
    })
}
