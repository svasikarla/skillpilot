import { describe, it, expect } from 'vitest'
import { parseSearchTerms, termToOrClause } from '@/lib/job-search'

describe('parseSearchTerms', () => {
  it('splits a multi-word query into AND-able terms', () => {
    const terms = parseSearchTerms('rag python')
    expect(terms.map(t => t.term)).toEqual(['rag', 'python'])
  })

  it('expands alias terms to canonical skills', () => {
    const [term] = parseSearchTerms('llm')
    expect(term.canonicalSkill).toBe('Prompt Engineering')
  })

  it('keeps a known skill phrase as a single term instead of word-splitting', () => {
    const terms = parseSearchTerms('machine learning')
    expect(terms).toHaveLength(1)
    expect(terms[0].term).toBe('machine learning')
    expect(terms[0].canonicalSkill).toBe('Machine Learning')
  })

  it('strips characters that would break or inject into the PostgREST or() grammar', () => {
    const terms = parseSearchTerms('py,thon) status.eq("x')
    for (const { term } of terms) {
      expect(term).not.toMatch(/[,()"'{}%_\\]/)
    }
  })

  it('drops 1-character noise and caps the number of terms at 5', () => {
    const terms = parseSearchTerms('a ml nlp rag python docker fastapi aws')
    expect(terms.length).toBe(5)
    expect(terms.map(t => t.term)).not.toContain('a')
  })

  it('returns no terms for an empty or whitespace query', () => {
    expect(parseSearchTerms('')).toEqual([])
    expect(parseSearchTerms('   ')).toEqual([])
  })
})

describe('termToOrClause', () => {
  it('matches the text columns for a plain term', () => {
    const clause = termToOrClause({ term: 'anomaly', canonicalSkill: null })
    expect(clause).toBe(
      'title.ilike.%anomaly%,company.ilike.%anomaly%,description.ilike.%anomaly%,platform.ilike.%anomaly%'
    )
  })

  it('adds a quoted skills-contains clause when the term maps to a canonical skill', () => {
    const clause = termToOrClause({ term: 'llm', canonicalSkill: 'Prompt Engineering' })
    expect(clause).toContain('skills.cs.{"Prompt Engineering"}')
  })
})
