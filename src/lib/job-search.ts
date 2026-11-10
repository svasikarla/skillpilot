import { canonicalizeSkill } from './skills-canonical'

// Turns a free-text feed query into per-term PostgREST `or()` clauses.
//
// The previous search was a single `ilike %<whole query>%` over three text
// columns, so "rag python" only matched listings containing that literal
// phrase, and a search for "llm" missed jobs tagged 'Prompt Engineering'
// whose text never says "llm". Here each term must match somewhere
// (AND across terms), a term matches text columns OR the skills array, and
// terms are expanded through the canonical skill vocabulary.

export interface SearchTerm {
  term: string             // sanitized raw term, for ilike patterns
  canonicalSkill: string | null // taxonomy name the term maps to, if any
}

// PostgREST's or() grammar splits on commas and parens; quotes and braces
// delimit values. Stripping them keeps user input from breaking (or
// injecting into) the filter expression. % and _ are ilike wildcards.
function sanitize(raw: string): string {
  return raw.replace(/[,()"'{}%_\\]/g, '').trim()
}

/** Split a query into sanitized search terms (max 5; longer queries add noise, not precision). */
export function parseSearchTerms(q: string): SearchTerm[] {
  // A query that is itself a known skill phrase ("machine learning", "vector
  // search") searches as one unit — phrase match or skill-tag match — rather
  // than demanding every word appear independently.
  const whole = sanitize(q)
  const wholeSkill = canonicalizeSkill(whole)
  if (whole.length >= 2 && wholeSkill) return [{ term: whole, canonicalSkill: wholeSkill }]

  return q
    .split(/\s+/)
    .map(sanitize)
    .filter(t => t.length >= 2)
    .slice(0, 5)
    .map(term => ({ term, canonicalSkill: canonicalizeSkill(term) }))
}

/**
 * One PostgREST or() clause per term — chaining them ANDs the terms.
 * A term matches when it appears in title/company/description/platform, or
 * when its canonical skill is in the job's skills array (quoted: taxonomy
 * names contain spaces, slashes and parens, never commas or quotes).
 */
export function termToOrClause({ term, canonicalSkill }: SearchTerm): string {
  const parts = [
    `title.ilike.%${term}%`,
    `company.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `platform.ilike.%${term}%`,
  ]
  if (canonicalSkill) parts.push(`skills.cs.{"${canonicalSkill}"}`)
  return parts.join(',')
}
