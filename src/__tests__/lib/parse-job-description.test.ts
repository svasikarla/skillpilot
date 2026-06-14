import { describe, it, expect } from 'vitest'
import { parseJobDescription, maybeBullets, type ParsedSection } from '@/lib/parse-job-description'

const keys = (sections: ParsedSection[]) => sections.map(s => s.key)
const byKey = (sections: ParsedSection[], key: string) =>
  sections.find(s => s.key === key)

// ── parseJobDescription: basic input handling ────────────────────────────────

describe('parseJobDescription — edge cases', () => {
  it('returns an empty array for empty input', () => {
    expect(parseJobDescription('')).toEqual([])
  })

  it('returns an empty array for whitespace/HTML that strips to nothing', () => {
    expect(parseJobDescription('<div>  </div>')).toEqual([])
  })

  it('wraps heading-less text in a single "other" / Description section', () => {
    const result = parseJobDescription(
      'Just a plain description with no headings whatsoever here at all.'
    )
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('other')
    expect(result[0].label).toBe('Description')
    expect(result[0].body).toContain('plain description')
  })
})

// ── HTML stripping & entity decoding ─────────────────────────────────────────

describe('parseJobDescription — HTML and entities', () => {
  it('strips tags and decodes named entities', () => {
    const result = parseJobDescription('<p>About Us</p><p>We build &amp; ship AI.</p>')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('about')
    expect(result[0].body).toBe('We build & ship AI.')
  })

  it('converts <br> and block tags into line breaks', () => {
    const result = parseJobDescription('Line one<br>Line two<br/>Line three')
    expect(result[0].body).toBe('Line one\nLine two\nLine three')
  })

  it('decodes numeric and common symbol entities', () => {
    const result = parseJobDescription('Pay is &#36;100&ndash;150 per hour &mdash; great&hellip;')
    expect(result[0].body).toBe('Pay is $100–150 per hour — great…')
  })
})

// ── Heading detection & classification ───────────────────────────────────────

describe('parseJobDescription — section detection', () => {
  it('classifies a full multi-section posting and orders sections canonically', () => {
    const raw = [
      'About Us',
      'Great company.',
      'Responsibilities',
      '- Build',
      '- Ship',
      'Requirements',
      '- Python',
      '- ML',
      'What We Offer',
      '- Health',
      '- Remote',
    ].join('\n')

    const result = parseJobDescription(raw)
    expect(keys(result)).toEqual(['about', 'responsibilities', 'requirements', 'benefits'])
    expect(byKey(result, 'about')!.body).toBe('Great company.')
    expect(byKey(result, 'benefits')!.body).toContain('Health')
  })

  it('reorders sections into canonical ORDER regardless of source order', () => {
    const raw = 'What We Offer\nHealth, remote.\nAbout Us\nWe build AI.'
    const result = parseJobDescription(raw)
    // "about" must precede "benefits" even though benefits appeared first
    expect(keys(result)).toEqual(['about', 'benefits'])
  })

  it('classifies "About the Role" as role, not company (regression)', () => {
    const result = parseJobDescription('About the Role\nYou will build models and ship features.')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('role')
    expect(result[0].label).toBe('The role')
  })

  it('still classifies "About the Team" as company', () => {
    const result = parseJobDescription('About the Team\nWe are 30 engineers.')
    expect(result[0].key).toBe('about')
  })

  it('maps a variety of requirement headings to the requirements key', () => {
    for (const heading of ['Requirements', 'Qualifications', 'Minimum Qualifications', 'Must-Haves', 'Required Skills']) {
      const result = parseJobDescription(`${heading}\nFive years of experience.`)
      expect(result[0].key).toBe('requirements')
    }
  })

  it('maps preferred/bonus headings to niceToHave', () => {
    for (const heading of ['Nice to Have', 'Preferred Qualifications', 'Bonus Points']) {
      const result = parseJobDescription(`${heading}\nKubernetes experience.`)
      expect(result[0].key).toBe('niceToHave')
    }
  })

  it('merges two sections that share the same key', () => {
    const raw = 'Requirements\nPython.\nRequired Skills\nSQL.'
    const result = parseJobDescription(raw)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('requirements')
    expect(result[0].body).toContain('Python')
    expect(result[0].body).toContain('SQL')
  })

  it('captures pre-heading intro text as an Overview when long enough', () => {
    const intro = 'This is a sufficiently long introductory paragraph describing the company mission and team. '
    const result = parseJobDescription(`${intro}\nResponsibilities\nBuild things.`)
    expect(result[0].key).toBe('other')
    expect(result[0].label).toBe('Overview')
    expect(keys(result)).toContain('responsibilities')
  })

  it('drops a short intro that is below the length threshold', () => {
    const result = parseJobDescription('Hello there.\nResponsibilities\nBuild things.')
    expect(keys(result)).toEqual(['responsibilities'])
  })
})

// ── Title injection stripping ────────────────────────────────────────────────

describe('parseJobDescription — title stripping', () => {
  it('removes repeated title injections from the body', () => {
    const result = parseJobDescription(
      'Senior ML Engineer We need a Senior ML Engineer to join us building models.',
      'Senior ML Engineer'
    )
    expect(result[0].body).not.toContain('Senior ML Engineer')
    expect(result[0].body).toContain('to join us building models')
  })

  it('ignores very short titles (<= 4 chars)', () => {
    const result = parseJobDescription('Dev Dev Dev plain body content here that is long enough.', 'Dev')
    expect(result[0].body).toContain('Dev')
  })
})

// ── maybeBullets ─────────────────────────────────────────────────────────────

describe('maybeBullets', () => {
  it('returns null for non-bulletable section keys', () => {
    expect(maybeBullets({ key: 'about', label: 'A', body: '- a\n- b\n- c' })).toBeNull()
  })

  it('splits explicit dash bullets and strips the leading marker on every item (regression)', () => {
    const result = maybeBullets({
      key: 'responsibilities',
      label: 'R',
      body: '- Build models\n- Ship features\n- Talk to users',
    })
    expect(result).toEqual(['Build models', 'Ship features', 'Talk to users'])
  })

  it('splits bullets delimited by • characters', () => {
    const result = maybeBullets({
      key: 'requirements',
      label: 'R',
      body: '• Python • SQL • Communication skills',
    })
    expect(result).toEqual(['Python', 'SQL', 'Communication skills'])
  })

  it('falls back to sentence splitting when there are no explicit bullets', () => {
    const result = maybeBullets({
      key: 'requirements',
      label: 'R',
      body: 'You have five years of experience. You know Python well. You communicate clearly.',
    })
    expect(result).toEqual([
      'You have five years of experience.',
      'You know Python well.',
      'You communicate clearly.',
    ])
  })

  it('returns null when there are fewer than three items', () => {
    expect(
      maybeBullets({ key: 'responsibilities', label: 'R', body: 'Just one short line.' })
    ).toBeNull()
  })
})
