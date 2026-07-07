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
  'pytorch', 'tensorflow', 'hugging face', 'transformers',
  'rag', 'retrieval augmented', 'vector search', 'embeddings',
  'mlops', 'llmops', 'model deployment', 'model training',
  'fine-tuning', 'finetuning', 'reinforcement learning', 'rlhf',
  'langchain', 'llamaindex', 'openai', 'anthropic',
  'scikit-learn', 'sklearn', 'xgboost', 'lightgbm',
  'generative ai', 'gen ai', 'diffusion model', 'stable diffusion',
]

export function isAiMlJob(title: string, description: string, tags: string[]): boolean {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase()
  return AI_ML_KEYWORDS.some(kw => text.includes(kw))
}

export function extractSkillsFromTags(tags: string[]): string[] {
  const SKILL_MAP: Record<string, string> = {
    python: 'Python', pytorch: 'PyTorch', tensorflow: 'TensorFlow',
    'machine-learning': 'Machine Learning', 'machine learning': 'Machine Learning',
    'deep-learning': 'Deep Learning', 'deep learning': 'Deep Learning',
    nlp: 'NLP', 'computer-vision': 'Computer Vision', 'computer vision': 'Computer Vision',
    'hugging-face': 'Hugging Face', 'huggingface': 'Hugging Face',
    llm: 'LLMs / Prompt Engineering', 'large-language-models': 'LLMs / Prompt Engineering',
    rag: 'RAG / Vector Search', mlops: 'MLOps / LLMOps', llmops: 'MLOps / LLMOps',
    'data-science': 'Data Science', 'data science': 'Data Science',
    sql: 'SQL', docker: 'Docker', fastapi: 'FastAPI',
    aws: 'Cloud (AWS/GCP/Azure)', gcp: 'Cloud (AWS/GCP/Azure)', azure: 'Cloud (AWS/GCP/Azure)',
    'fine-tuning': 'Fine-tuning', finetuning: 'Fine-tuning',
    'data-engineering': 'Data Engineering', 'data engineering': 'Data Engineering',
  }
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const mapped = SKILL_MAP[tag.toLowerCase()]
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped)
      result.push(mapped)
    }
  }
  return result
}
