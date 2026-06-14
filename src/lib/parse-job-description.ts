export type SectionKey =
  | 'about'
  | 'role'
  | 'responsibilities'
  | 'requirements'
  | 'niceToHave'
  | 'benefits'
  | 'other'

export type ParsedSection = {
  key: SectionKey
  label: string
  body: string
}

const HEADINGS: Array<{ pat: RegExp; key: SectionKey; label: string }> = [
  // Match heading even when run-on into body (lookahead allows uppercase or punctuation).
  // Longer / more specific patterns first.
  // Note: "the Role" is intentionally excluded here so the dedicated "About the Role"
  // pattern below classifies it as 'role' rather than this broader 'about' pattern.
  { pat: /\bAbout\s+(?:Us|the\s+(?:Company|Team)|[A-Z][\w&.'\- ]{0,40}?)(?=[A-Z\s.,;:]|$)/, key: 'about', label: 'Company' },
  { pat: /\b(?:Company|Our)\s+(?:Overview|Description|Profile|Mission|Story|Vision)(?=[A-Z\s.,;:]|$)/, key: 'about', label: 'Company' },
  { pat: /\bWho\s+We\s+Are(?=[A-Z\s.,;:]|$)/, key: 'about', label: 'Company' },

  { pat: /\b(?:The\s+)?(?:Role|Position|Opportunity|Job)\s+(?:Summary|Overview|Description)(?=[A-Z\s.,;:]|$)/, key: 'role', label: 'The role' },
  { pat: /\bAbout\s+(?:the\s+)?Role(?=[A-Z\s.,;:]|$)/, key: 'role', label: 'The role' },

  { pat: /\bKey\s+Responsibilities(?=[A-Z\s.,;:]|$)/, key: 'responsibilities', label: 'Responsibilities' },
  { pat: /\bResponsibilities(?=[A-Z\s.,;:]|$)/, key: 'responsibilities', label: 'Responsibilities' },
  { pat: /\bWhat\s+You(?:'ll|\s+will)\s+(?:Do|Be\s+Doing)(?=[A-Z\s.,;:]|$)/, key: 'responsibilities', label: 'Responsibilities' },
  { pat: /\bYour\s+(?:Role|Responsibilities|Day[-\s]to[-\s]day)(?=[A-Z\s.,;:]|$)/, key: 'responsibilities', label: 'Responsibilities' },
  { pat: /\bDay[-\s]to[-\s]Day(?=[A-Z\s.,;:]|$)/, key: 'responsibilities', label: 'Responsibilities' },

  { pat: /\b(?:Minimum|Basic|Required)\s+Qualifications(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },
  { pat: /\bQualifications(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },
  { pat: /\bRequirements(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },
  { pat: /\bWhat\s+You(?:'ll|\s+will)?\s+(?:Bring|Need|Have)(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },
  { pat: /\bMust[-\s]Haves?(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },
  { pat: /\bRequired\s+Skills(?=[A-Z\s.,;:]|$)/, key: 'requirements', label: 'Requirements' },

  { pat: /\bNice\s+to\s+Have(?:s)?(?=[A-Z\s.,;:]|$)/, key: 'niceToHave', label: 'Nice to have' },
  { pat: /\bPreferred\s+(?:Qualifications|Skills|Experience)(?=[A-Z\s.,;:]|$)/, key: 'niceToHave', label: 'Nice to have' },
  { pat: /\bBonus\s+Points(?=[A-Z\s.,;:]|$)/, key: 'niceToHave', label: 'Nice to have' },

  { pat: /\bWhat\s+We\s+Offer(?=[A-Z\s.,;:]|$)/, key: 'benefits', label: 'Benefits' },
  { pat: /\bBenefits(?:\s+(?:&|and)\s+Perks)?(?=[A-Z\s.,;:]|$)/, key: 'benefits', label: 'Benefits' },
  { pat: /\bPerks(?=[A-Z\s.,;:]|$)/, key: 'benefits', label: 'Benefits' },
]

// 'other' leads: the only thing keyed 'other' here is the pre-heading intro ("Overview"),
// which is the lead paragraph of the posting and should render before the labelled sections.
// (The heading-less fallback returns before ORDER is applied, so it is unaffected.)
const ORDER: SectionKey[] = ['other', 'about', 'role', 'responsibilities', 'requirements', 'niceToHave', 'benefits']

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
}

function normalize(s: string): string {
  return s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export function parseJobDescription(raw: string, title?: string): ParsedSection[] {
  let text = normalize(decodeEntities(stripHtml(raw)))

  // Strip any repeated title injections from scraped content (common: title repeated mid-description).
  if (title && title.length > 4) {
    const escTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(escTitle, 'gi'), ' ')
    text = normalize(text)
  }

  type Match = { start: number; end: number; key: SectionKey; label: string }
  const matches: Match[] = []
  for (const { pat, key, label } of HEADINGS) {
    const g = new RegExp(pat.source, pat.flags.includes('g') ? pat.flags : pat.flags + 'g')
    for (const m of text.matchAll(g)) {
      matches.push({ start: m.index!, end: m.index! + m[0].length, key, label })
    }
  }

  matches.sort((a, b) => a.start - b.start || b.end - a.end)
  const dedup: Match[] = []
  for (const m of matches) {
    const last = dedup[dedup.length - 1]
    if (!last || m.start >= last.end) dedup.push(m)
  }

  if (dedup.length === 0) {
    return text ? [{ key: 'other', label: 'Description', body: text }] : []
  }

  const raw_sections: ParsedSection[] = []
  const intro = text.slice(0, dedup[0].start).trim().replace(/^[:\s.,;]+|[:\s.,;]+$/g, '')
  if (intro.length > 60) raw_sections.push({ key: 'other', label: 'Overview', body: intro })

  for (let i = 0; i < dedup.length; i++) {
    const m = dedup[i]
    const bodyEnd = i < dedup.length - 1 ? dedup[i + 1].start : text.length
    const body = text.slice(m.end, bodyEnd).trim().replace(/^[:\s.,;]+/, '').trim()
    if (body.length === 0) continue
    raw_sections.push({ key: m.key, label: m.label, body })
  }

  const byKey = new Map<SectionKey, ParsedSection>()
  for (const s of raw_sections) {
    const ex = byKey.get(s.key)
    if (ex) {
      if (!ex.body.includes(s.body) && !s.body.includes(ex.body)) ex.body += ' ' + s.body
    } else {
      byKey.set(s.key, { ...s })
    }
  }

  return ORDER.filter(k => byKey.has(k)).map(k => byKey.get(k)!)
}

const BULLETABLE: SectionKey[] = ['responsibilities', 'requirements', 'niceToHave']

export function maybeBullets(section: ParsedSection): string[] | null {
  if (!BULLETABLE.includes(section.key)) return null
  const explicit = section.body
    .split(/\s*[•·]\s+|\s*\n\s*[-–*]\s+|\s*\n+\s*/)
    // Strip a leading marker too: the split consumes markers *between* items but not
    // one at the very start of the body, so the first item would otherwise keep its "- ".
    .map(s => s.trim().replace(/^[•·*\-–]\s*/, ''))
    .filter(Boolean)
  if (explicit.length >= 3 && explicit.every(s => s.length < 280)) return explicit

  const sents = section.body
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim().replace(/^[•·*\-–]\s*/, ''))
    .filter(Boolean)
  if (sents.length >= 3 && sents.length <= 12 && sents.every(s => s.length < 220)) return sents
  return null
}
