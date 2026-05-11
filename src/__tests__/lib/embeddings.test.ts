import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  cosine,
  parseEmbedding,
  serializeEmbedding,
  buildJobEmbeddingText,
  buildProfileEmbeddingText,
  embed,
  embedBatch,
} from '@/lib/embeddings'

// ─── cosine ───────────────────────────────────────────────────────────────────

describe('cosine()', () => {
  it('returns 1.0 for identical vectors', () => {
    const v = [1, 2, 3, 4]
    expect(cosine(v, v)).toBeCloseTo(1.0, 8)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 8)
  })

  it('returns -1 for opposite vectors', () => {
    expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1, 8)
  })

  it('returns 0 for empty vectors (length 0)', () => {
    expect(cosine([], [])).toBe(0)
  })

  it('returns 0 for mismatched lengths', () => {
    expect(cosine([1, 2], [1, 2, 3])).toBe(0)
  })

  it('returns 0 when both vectors are zero vectors', () => {
    expect(cosine([0, 0, 0], [0, 0, 0])).toBe(0)
  })

  it('is symmetric: cosine(a,b) === cosine(b,a)', () => {
    const a = [0.3, 0.4, 0.8, 0.1]
    const b = [0.9, 0.2, 0.1, 0.6]
    expect(cosine(a, b)).toBeCloseTo(cosine(b, a), 10)
  })

  it('value between -1 and 1 for arbitrary vectors', () => {
    const a = [0.1, 0.5, 0.8, 0.3, 0.9]
    const b = [0.4, 0.2, 0.7, 0.6, 0.1]
    const sim = cosine(a, b)
    expect(sim).toBeGreaterThanOrEqual(-1)
    expect(sim).toBeLessThanOrEqual(1)
  })

  it('high similarity for nearly identical vectors', () => {
    const a = [1.0, 0.0, 0.0]
    const b = [0.99, 0.01, 0.0]
    expect(cosine(a, b)).toBeGreaterThan(0.99)
  })

  it('low similarity for very different directions', () => {
    const a = [1, 0, 0, 0]
    const b = [0, 0, 0, 1]
    expect(cosine(a, b)).toBeCloseTo(0, 8)
  })

  it('works with 512-dimensional vectors (spot check)', () => {
    const a = new Array(512).fill(0).map((_, i) => i % 2 === 0 ? 1 : 0)
    const b = new Array(512).fill(0).map((_, i) => i % 2 === 0 ? 1 : 0)
    expect(cosine(a, b)).toBeCloseTo(1.0, 5)
  })
})

// ─── parseEmbedding / serializeEmbedding ─────────────────────────────────────

describe('parseEmbedding()', () => {
  it('parses a JSON-serialized float array', () => {
    const vec = [0.1, 0.2, 0.3]
    const result = parseEmbedding(JSON.stringify(vec))
    expect(result).toEqual(vec)
  })

  it('returns null for null input', () => {
    expect(parseEmbedding(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseEmbedding(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseEmbedding('')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseEmbedding('not-valid-json')).toBeNull()
  })

  it('returns null for partial/malformed JSON', () => {
    expect(parseEmbedding('[1,2,3')).toBeNull()
  })

  it('parses a 512-element vector', () => {
    const vec = Array.from({ length: 512 }, (_, i) => i / 512)
    const result = parseEmbedding(JSON.stringify(vec))
    expect(result).toHaveLength(512)
    expect(result![0]).toBeCloseTo(0, 5)
  })
})

describe('serializeEmbedding()', () => {
  it('produces valid JSON', () => {
    const vec = [0.1, 0.2, 0.3]
    const s = serializeEmbedding(vec)
    expect(() => JSON.parse(s)).not.toThrow()
  })

  it('round-trips through parseEmbedding', () => {
    const vec = [0.123, 0.456, 0.789]
    const roundTripped = parseEmbedding(serializeEmbedding(vec))
    expect(roundTripped).toEqual(vec)
  })

  it('handles empty array', () => {
    const s = serializeEmbedding([])
    expect(s).toBe('[]')
    expect(parseEmbedding(s)).toEqual([])
  })

  it('preserves floating point precision', () => {
    const vec = [Math.PI, Math.E, Math.SQRT2]
    const result = parseEmbedding(serializeEmbedding(vec))
    for (let i = 0; i < vec.length; i++) {
      expect(result![i]).toBeCloseTo(vec[i], 10)
    }
  })
})

// ─── buildJobEmbeddingText ────────────────────────────────────────────────────

describe('buildJobEmbeddingText()', () => {
  it('includes the job title', () => {
    const text = buildJobEmbeddingText({ title: 'Senior ML Engineer', description: null })
    expect(text).toContain('Senior ML Engineer')
  })

  it('includes extracted skills when provided', () => {
    const text = buildJobEmbeddingText({
      title: 'AI Engineer',
      extractedSkills: ['Python', 'LangChain', 'RAG'],
      description: null,
    })
    expect(text).toContain('Python')
    expect(text).toContain('LangChain')
    expect(text).toContain('RAG')
  })

  it('excludes skills section when extractedSkills is empty', () => {
    const text = buildJobEmbeddingText({
      title: 'AI Engineer',
      extractedSkills: [],
      description: 'Some description',
    })
    // No comma-separated skills line
    expect(text.split('\n').length).toBe(2) // title + description
  })

  it('includes truncated description (max 500 chars)', () => {
    const longDesc = 'x'.repeat(600)
    const text = buildJobEmbeddingText({ title: 'Job', description: longDesc })
    expect(text).toContain('x'.repeat(500))
    expect(text).not.toContain('x'.repeat(501))
  })

  it('skips description when null', () => {
    const text = buildJobEmbeddingText({ title: 'Job', description: null })
    expect(text.trim()).toBe('Job')
  })

  it('separates sections with newline', () => {
    const text = buildJobEmbeddingText({
      title: 'Job',
      extractedSkills: ['Python'],
      description: 'Desc',
    })
    const lines = text.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Job')
    expect(lines[1]).toContain('Python')
    expect(lines[2]).toBe('Desc')
  })
})

// ─── buildProfileEmbeddingText ────────────────────────────────────────────────

describe('buildProfileEmbeddingText()', () => {
  it('includes skills', () => {
    const text = buildProfileEmbeddingText(
      { about: null },
      ['Python', 'RAG', 'LangChain'],
      [],
    )
    expect(text).toContain('Python')
    expect(text).toContain('RAG')
    expect(text).toContain('LangChain')
  })

  it('includes about text when provided', () => {
    const text = buildProfileEmbeddingText(
      { about: 'I build AI systems.' },
      ['Python'],
      [],
    )
    expect(text).toContain('I build AI systems.')
  })

  it('includes portfolio descriptions (up to 3)', () => {
    const items = [
      { description: 'Built RAG pipeline' },
      { description: 'Fine-tuned LLaMA' },
      { description: 'Deployed diffusion model' },
      { description: 'Fourth item — should be excluded' },
    ]
    const text = buildProfileEmbeddingText({ about: null }, [], items)
    expect(text).toContain('Built RAG pipeline')
    expect(text).toContain('Fine-tuned LLaMA')
    expect(text).toContain('Deployed diffusion model')
    expect(text).not.toContain('Fourth item')
  })

  it('returns empty string when no data', () => {
    const text = buildProfileEmbeddingText({ about: null }, [], [])
    expect(text).toBe('')
  })

  it('skips portfolio items with no description', () => {
    const items = [{ description: undefined }, { description: 'Valid' }]
    const text = buildProfileEmbeddingText({ about: null }, [], items)
    expect(text).toContain('Valid')
    expect(text.split('\n').filter(Boolean).length).toBe(1)
  })

  it('starts skills line with "Skills:"', () => {
    const text = buildProfileEmbeddingText({ about: null }, ['Python', 'RAG'], [])
    expect(text).toMatch(/^Skills:/)
  })
})

// ─── embed / embedBatch (API calls — mocked) ─────────────────────────────────

describe('embed() and embedBatch() with mocked OpenAI', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('embedBatch returns empty array for empty input', async () => {
    // embedBatch has an early-return guard before calling OpenAI
    const { embedBatch: eb } = await import('@/lib/embeddings')
    // Mock env so getClient() doesn't throw prematurely
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    // We still need to mock the OpenAI client to avoid real HTTP
    vi.mock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        embeddings: {
          create: vi.fn().mockResolvedValue({ data: [] }),
        },
      })),
    }))
    // The early return fires before the OpenAI call
    const result = await eb([])
    expect(result).toEqual([])
    vi.unstubAllEnvs()
  })
})
