import OpenAI from 'openai'
import { EMBEDDING } from './config'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set — embeddings are unavailable')
  }
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export async function embed(text: string): Promise<number[]> {
  const client = getClient()
  const res = await client.embeddings.create({
    model:      EMBEDDING.model,
    input:      text.slice(0, 8000),  // safety trim
    dimensions: EMBEDDING.dims,
  })
  return res.data[0].embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const client = getClient()
  const res = await client.embeddings.create({
    model:      EMBEDDING.model,
    input:      texts.map(t => t.slice(0, 8000)),
    dimensions: EMBEDDING.dims,
  })
  return res.data.map(d => d.embedding)
}

// Cosine similarity between two equal-length vectors
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

export function parseEmbedding(raw: string | null | undefined): number[] | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as number[]
  } catch {
    return null
  }
}

export function serializeEmbedding(vec: number[]): string {
  return JSON.stringify(vec)
}

// ─── Text builders ────────────────────────────────────────────────────────────

export function buildJobEmbeddingText(job: {
  title: string
  description?: string | null
  extractedSkills?: string[] | null
}): string {
  const parts = [job.title]
  if (job.extractedSkills?.length) parts.push(job.extractedSkills.join(', '))
  if (job.description)             parts.push(job.description.slice(0, 500))
  return parts.join('\n')
}

export function buildProfileEmbeddingText(member: {
  about?: string | null
  displayName?: string
}, skillNames: string[], portfolioItems: Array<{ description?: string }>): string {
  const parts: string[] = []
  if (skillNames.length)     parts.push(`Skills: ${skillNames.join(', ')}`)
  if (member.about)          parts.push(member.about)
  for (const p of portfolioItems.slice(0, 3)) {
    if (p.description) parts.push(p.description)
  }
  return parts.join('\n')
}
