import { RawJob, isAiMlJob, extractSkillsFromTags, inferEmploymentType } from './types'

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

// HN "Who Is Hiring" comments use a rough pipe-delimited first-line format:
//   Company | Role | Remote/Location | Tech Stack
function parseComment(text: string): { title: string; company: string | null; location: string } {
  const clean = text.replace(/<[^>]*>/g, '').trim()
  const firstLine = clean.split('\n')[0] ?? ''
  const parts = firstLine.split('|').map(s => s.trim()).filter(Boolean)

  const company  = parts[0] || null
  const title    = parts[1] || 'AI/ML Engineer'
  const location = parts.find(p => /remote/i.test(p)) ? 'Remote' : (parts[2] ?? 'Remote')

  return { title, company, location }
}

function tagCandidatesFromText(text: string): string[] {
  const lower = text.toLowerCase()
  return [
    'python', 'pytorch', 'tensorflow', 'machine-learning', 'deep-learning',
    'nlp', 'computer-vision', 'huggingface', 'llm', 'rag', 'mlops',
    'fine-tuning', 'data-science', 'aws', 'docker', 'fastapi',
  ].filter(t => lower.includes(t.replace('-', ' ')))
}

export async function fetchHNWhoIsHiring(): Promise<RawJob[]> {
  // Step 1: find the latest monthly "Ask HN: Who is hiring?" thread. Must use
  // search_by_date (newest first) — relevance search returns years-old threads.
  // The whoishiring account posts several monthly threads, so match the title.
  const storyRes = await fetch(
    'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=10',
    { headers: { 'User-Agent': 'aiml-freelance-hub/1.0' }, next: { revalidate: 0 } }
  )
  if (!storyRes.ok) throw new Error(`HN Algolia story fetch failed: ${storyRes.status}`)
  const storyData = await storyRes.json() as { hits: AlgoliaStoryHit[] }
  const story = storyData.hits.find(h => /who is hiring/i.test(h.title ?? ''))
  if (!story) return []

  // Step 2: search AI/ML comments within that thread
  const commentsRes = await fetch(
    `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${story.objectID}&query=machine+learning+LLM+AI+engineer&hitsPerPage=100`,
    { headers: { 'User-Agent': 'aiml-freelance-hub/1.0' }, next: { revalidate: 0 } }
  )
  if (!commentsRes.ok) throw new Error(`HN Algolia comments fetch failed: ${commentsRes.status}`)
  const commentsData = await commentsRes.json() as { hits: AlgoliaCommentHit[] }

  return commentsData.hits
    .filter(h => h.comment_text && isAiMlJob('', h.comment_text, []))
    .map(h => {
      const text = (h.comment_text ?? '').replace(/<[^>]*>/g, '').slice(0, 2000)
      const { title, company, location } = parseComment(text)
      return {
        source_id:   `hnwih-${h.objectID}`,
        source:      'hnwih',
        title,
        company,
        description: text,
        platform:    'HN Who Is Hiring',
        url:         `https://news.ycombinator.com/item?id=${h.objectID}`,
        skills:      extractSkillsFromTags(tagCandidatesFromText(text)),
        location,
        rate_min:    null,
        rate_max:    null,
        posted_at:   h.created_at ?? new Date().toISOString(),
        employment_type: inferEmploymentType(title, text),
      }
    })
}
