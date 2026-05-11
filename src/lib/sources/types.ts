export type RateType = 'hourly' | 'daily' | 'fixed' | 'monthly' | 'unknown'
export type JobType = 'remote' | 'hybrid' | 'onsite'

export interface JobListing {
  sourceId: string        // unique ID from the source system
  platformId?: number     // our platforms.id if identifiable; null for generic boards
  sourceUrl: string
  title: string
  company?: string
  description: string
  rateMin?: number
  rateMax?: number
  rateType: RateType
  jobType: JobType
  isRemote: boolean
  location?: string
  postedAt: Date
}

// Shared AI/ML keyword filter — applies to title + description + tags
export const AIML_REGEX =
  /\b(LLM|AI\b|ML\b|machine.?learning|deep.?learning|NLP|RAG|LangChain|PyTorch|TensorFlow|OpenAI|Anthropic|fine.?tun|vector.?(?:db|database|store|embed)|embedding|GPT|transformer|diffusion|computer.?vision|reinforcement.?learning|RLHF|prompt.?engineer|LangGraph|LlamaIndex|HuggingFace|hugging.?face|BERT|stable.?diffusion|Llama|Mistral|Gemini|Cohere|vLLM|Ollama|MLOps|data.?science|data.?scientist|scikit|sklearn|XGBoost|LightGBM|MLflow|Weights.?&.?Biases|wandb|SageMaker|Vertex.?AI|Databricks|generative.?AI|gen.?ai)\b/i

export function isAiMlJob(title: string, description: string, tags: string[] = []): boolean {
  const text = `${title} ${description} ${tags.join(' ')}`
  return AIML_REGEX.test(text)
}

export function safeDate(raw: string | number | undefined | null): Date {
  if (!raw) return new Date()
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date() : d
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
