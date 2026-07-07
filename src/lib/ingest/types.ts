import { canonicalizeSkills } from '@/lib/skills-canonical'

export type EmploymentType = 'contract' | 'full_time' | 'unknown'
export type RateType = 'hourly' | 'fixed'

export interface RawJob {
  source_id: string        // unique ID from the source platform
  source: string           // 'remotive' | 'remoteok' | 'himalayas'
  title: string
  company: string | null
  description: string
  platform: string         // display name shown in feed
  url: string | null
  skills: string[]
  location: string
  rate_min: number | null
  rate_max: number | null
  posted_at: string        // ISO datetime
  employment_type: EmploymentType
  rate_type?: RateType     // how to read rate_min/max: $/hr or total project budget
  duration?: string | null // stated engagement length, e.g. "3 months"
}

const CONTRACT_TERMS = [
  'contract', 'contractor', 'freelance', 'freelancer', 'consultant',
  '1099', 'c2c', 'corp-to-corp', 'corp to corp',
  'project-based', 'project based', 'short-term engagement',
  'fixed-term', 'fixed term', 'hourly rate', 'per hour',
  '/hr', '/hour', 'contract-to-hire',
  'fixed price', 'fixed-price', 'milestone payment', 'statement of work',
  'seeking freelancer',
]

const FULL_TIME_TERMS = [
  'full-time', 'full time', 'permanent position', 'permanent role',
  'salaried', 'annual salary', 'equity grant', 'stock options',
  '401(k)', 'paid time off', 'health insurance', 'dental', 'base salary',
  'annual compensation',
]

export function inferEmploymentType(
  title: string,
  description: string,
  hint?: string,
): EmploymentType {
  const hintLower = (hint ?? '').toLowerCase().trim()
  if (hintLower === 'contract' || hintLower === 'freelance' || hintLower === 'temporary') return 'contract'
  if (hintLower === 'full_time' || hintLower === 'full-time' || hintLower === 'fulltime') return 'full_time'

  const text = `${title}\n${description}`.toLowerCase()
  const contractHits = CONTRACT_TERMS.some(t => text.includes(t))
  const fullTimeHits = FULL_TIME_TERMS.some(t => text.includes(t))

  if (contractHits && !fullTimeHits) return 'contract'
  if (fullTimeHits && !contractHits) return 'full_time'
  // Tied or unsure → unknown (UI shows under "All types" but not under "Contract only")
  return 'unknown'
}

export const AI_ML_KEYWORDS = [
  'machine learning', 'ml engineer', 'deep learning', 'neural network',
  'llm', 'large language model', 'gpt', 'claude', 'gemini', 'mistral',
  'nlp', 'natural language', 'computer vision', 'cv engineer',
  'data scientist', 'ai engineer', 'artificial intelligence',
  'ai', 'chatbot', 'prompt engineer', 'ai agent',
  'pytorch', 'tensorflow', 'hugging face', 'transformers',
  'rag', 'retrieval augmented', 'vector search', 'embeddings',
  'mlops', 'llmops', 'model deployment', 'model training',
  'fine-tuning', 'finetuning', 'reinforcement learning', 'rlhf',
  'langchain', 'llamaindex', 'openai', 'anthropic',
  'scikit-learn', 'sklearn', 'xgboost', 'lightgbm',
  'generative ai', 'gen ai', 'diffusion model', 'stable diffusion',
]

// Word-boundary matchers, precomputed once. Substring matching caused false
// positives like 'storage' → 'rag' and 'scv engineer' → 'cv engineer'.
const KEYWORD_RES = AI_ML_KEYWORDS.map(kw => ({
  kw,
  re: new RegExp(`(^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`, 'i'),
}))

function keywordHits(text: string): number {
  let hits = 0
  for (const { re } of KEYWORD_RES) if (re.test(text)) hits++
  return hits
}

/**
 * A listing counts as AI/ML when the signal is in the title or tags, or when
 * the description mentions at least two distinct AI/ML terms. One passing
 * mention buried in company boilerplate ("we use machine learning") is not
 * enough — that let travel-agent and sales roles into the feed.
 */
export function isAiMlJob(title: string, description: string, tags: string[]): boolean {
  if (keywordHits(`${title} ${tags.join(' ')}`) >= 1) return true
  return keywordHits(description) >= 2
}

// Job tags → canonical taxonomy skill names, so job skills, user profile
// skills, and learning resources all share one vocabulary (skills-canonical.ts).
export function extractSkillsFromTags(tags: string[]): string[] {
  return canonicalizeSkills(tags)
}
