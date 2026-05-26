import { pipeline, env } from '@xenova/transformers'

// Cache models in /tmp so Vercel warm lambdas reuse them across invocations
env.cacheDir = '/tmp/.cache/transformers'
env.allowLocalModels = false

type FeatureExtractionPipeline = Awaited<ReturnType<typeof pipeline<'feature-extraction'>>>
let _pipe: FeatureExtractionPipeline | null = null

async function getPipeline(): Promise<FeatureExtractionPipeline> {
  if (!_pipe) {
    _pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return _pipe
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getPipeline()
  // Truncate to 512 tokens worth of chars; model max is 256 tokens
  const output = await pipe(text.slice(0, 2000), { pooling: 'mean', normalize: true })
  return Array.from(output.data as Float32Array)
}

// Both vectors must be L2-normalized (normalize: true above) — dot product equals cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return Math.max(-1, Math.min(1, dot))
}

// Canonical text representations for consistent embedding inputs
export function jobEmbeddingText(job: {
  title: string
  skills: string[]
  description: string
}): string {
  return `${job.title} ${job.skills.join(' ')} ${job.description}`.slice(0, 2000)
}

export function profileEmbeddingText(profile: {
  name?: string | null
  about?: string | null
  skills: string[]
}): string {
  return `${profile.name ?? ''} ${profile.about ?? ''} ${profile.skills.join(' ')}`.slice(0, 2000)
}
