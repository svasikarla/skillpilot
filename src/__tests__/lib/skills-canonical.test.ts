import { describe, it, expect } from 'vitest'
import { canonicalizeSkill, canonicalizeSkills, expandWithUmbrellas, prepareUserSkills } from '@/lib/skills-canonical'
import { extractSkillsFromTags } from '@/lib/ingest/types'
import { getResourceForSkill } from '@/lib/learning-resources'
import { SKILLS_TAXONOMY } from '@/lib/skills-taxonomy'

describe('canonicalizeSkill', () => {
  it('maps legacy ingest labels to taxonomy names', () => {
    expect(canonicalizeSkill('LLMs / Prompt Engineering')).toBe('Prompt Engineering')
    expect(canonicalizeSkill('RAG / Vector Search')).toBe('RAG Pipelines')
    expect(canonicalizeSkill('Hugging Face')).toBe('HuggingFace Transformers')
    expect(canonicalizeSkill('TensorFlow')).toBe('TensorFlow / JAX')
  })

  it('maps common job-board tags', () => {
    expect(canonicalizeSkill('machine-learning')).toBe('Machine Learning')
    expect(canonicalizeSkill('aws')).toBe('Cloud (AWS/GCP/Azure)')
    expect(canonicalizeSkill('rag')).toBe('RAG Pipelines')
    expect(canonicalizeSkill('llm')).toBe('Prompt Engineering')
  })

  it('is identity for canonical taxonomy names (case-insensitive)', () => {
    expect(canonicalizeSkill('Python')).toBe('Python')
    expect(canonicalizeSkill('pinecone')).toBe('Pinecone')
  })

  it('returns null for unknown labels', () => {
    expect(canonicalizeSkill('underwater basket weaving')).toBeNull()
  })
})

describe('canonicalizeSkills / extractSkillsFromTags', () => {
  it('dedups aliases that canonicalize to the same skill', () => {
    expect(canonicalizeSkills(['aws', 'gcp', 'azure'])).toEqual(['Cloud (AWS/GCP/Azure)'])
  })

  it('extractSkillsFromTags emits canonical taxonomy names', () => {
    const skills = extractSkillsFromTags(['python', 'machine-learning', 'huggingface', 'docker'])
    expect(skills).toEqual(['Python', 'Machine Learning', 'HuggingFace Transformers', 'Docker'])
    // Every extracted skill must exist in the taxonomy
    const names = new Set(SKILLS_TAXONOMY.map(s => s.name))
    for (const s of skills) expect(names.has(s)).toBe(true)
  })
})

describe('expandWithUmbrellas', () => {
  it('adds cluster umbrellas for specific skills', () => {
    const expanded = expandWithUmbrellas(['Pinecone'])
    expect(expanded).toContain('Pinecone')
    expect(expanded).toContain('RAG Pipelines')
  })

  it('adds cross-cluster implications', () => {
    const expanded = expandWithUmbrellas(['Computer Vision'])
    expect(expanded).toEqual(expect.arrayContaining(['Computer Vision', 'Deep Learning', 'Machine Learning']))
  })

  it('keeps unrecognised legacy names instead of dropping them', () => {
    expect(expandWithUmbrellas(['My Custom Skill'])).toContain('My Custom Skill')
  })

  it('prepareUserSkills lets an OpenAI API user match LLM-tagged jobs', () => {
    const prepared = prepareUserSkills(['OpenAI API'])
    expect(prepared).toContain('Prompt Engineering') // jobs tagged 'llm' canonicalize to this
  })
})

describe('vocabulary alignment', () => {
  it('umbrella gap skills all have learning resources', () => {
    const umbrellas = [
      'Machine Learning', 'Deep Learning', 'Data Science', 'NLP',
      'Computer Vision', 'Data Engineering', 'MLOps / LLMOps', 'Fine-tuning',
      'Cloud (AWS/GCP/Azure)', 'Prompt Engineering', 'RAG Pipelines',
    ]
    for (const skill of umbrellas) {
      expect(getResourceForSkill(skill), `missing resource for ${skill}`).not.toBeNull()
    }
  })
})
