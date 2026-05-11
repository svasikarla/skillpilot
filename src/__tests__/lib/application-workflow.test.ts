import { describe, it, expect } from 'vitest'
import { buildWorkflow } from '@/lib/application-workflow'
import type { WorkflowMemberContext } from '@/lib/application-workflow'

// ─── Factories ────────────────────────────────────────────────────────────────

function makeJob(overrides = {}) {
  return {
    id:              'job-1',
    title:           'Senior ML Engineer',
    extractedSkills: ['Python', 'LangChain', 'RAG'],
    ...overrides,
  }
}

function makePlatform(overrides = {}) {
  return {
    id:               1,
    name:             'Upwork',
    slug:             'upwork',
    applicationGuide: null,
    platformTips:     null,
    ...overrides,
  }
}

function makeMember(overrides: Partial<WorkflowMemberContext> = {}): WorkflowMemberContext {
  return {
    hasAccount:          true,
    displayName:         'Alice Smith',
    targetHourlyRate:    100,
    yearsExperience:     5,
    skillsMatched:       ['Python', 'LangChain'],
    skillsMissing:       ['RAG'],
    profileCompleteness: 85,
    portfolioCount:      3,
    ...overrides,
  }
}

// ─── buildWorkflow — structure ────────────────────────────────────────────────

describe('buildWorkflow() — structure', () => {
  it('returns the expected top-level shape', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    expect(wf).toHaveProperty('platformName', 'Upwork')
    expect(wf).toHaveProperty('platformSlug', 'upwork')
    expect(wf).toHaveProperty('jobTitle', 'Senior ML Engineer')
    expect(wf).toHaveProperty('steps')
  })

  it('always returns exactly 6 steps', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    expect(wf.steps).toHaveLength(6)
  })

  it('step ids are in the correct order', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    expect(wf.steps[0].id).toBe('prereq')
    expect(wf.steps[1].id).toBe('context')
    expect(wf.steps[2].id).toBe('research')
    expect(wf.steps[3].id).toBe('generator')
    expect(wf.steps[4].id).toBe('checklist')
    expect(wf.steps[5].id).toBe('followup')
  })

  it('step types are correct', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    expect(wf.steps[0].type).toBe('prereq')
    expect(wf.steps[1].type).toBe('context')
    expect(wf.steps[2].type).toBe('instructions')
    expect(wf.steps[3].type).toBe('generator')
    expect(wf.steps[4].type).toBe('checklist')
    expect(wf.steps[5].type).toBe('followup')
  })

  it('each step has a title', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    for (const step of wf.steps) {
      expect(step.title.length).toBeGreaterThan(0)
    }
  })

  it('each step has at least one check item', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    for (const step of wf.steps) {
      expect(step.checkItems.length).toBeGreaterThan(0)
    }
  })
})

// ─── buildWorkflow — member context injection ─────────────────────────────────

describe('buildWorkflow() — member context', () => {
  it('includes platform name in prereq check items', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    const prereq = wf.steps[0]
    expect(prereq.checkItems.join(' ')).toContain('Upwork')
  })

  it('shows matched skill count in step 2 context', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      skillsMatched: ['Python', 'LangChain'],
      skillsMissing: ['RAG'],
    }))
    expect(wf.steps[1].memberContext).toContain('2')
    expect(wf.steps[1].memberContext).toContain('Python')
    expect(wf.steps[1].memberContext).toContain('LangChain')
  })

  it('shows missing skills in step 2 context', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      skillsMatched: ['Python'],
      skillsMissing: ['LangChain', 'RAG'],
    }))
    expect(wf.steps[1].memberContext).toContain('LangChain')
    expect(wf.steps[1].memberContext).toContain('RAG')
  })

  it('shows "No extracted skills matched" when skillsMatched is empty', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      skillsMatched: [],
      skillsMissing: ['Python', 'LangChain', 'RAG'],
    }))
    expect(wf.steps[1].memberContext).toContain('No extracted skills matched')
  })

  it('includes target hourly rate in step 3 context', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({ targetHourlyRate: 120 }))
    expect(wf.steps[2].memberContext).toContain('$120/hr')
  })

  it('prompts to set rate in profile when no target rate', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({ targetHourlyRate: null }))
    expect(wf.steps[2].memberContext).toContain('target hourly rate')
  })

  it('shows portfolio count in step 5 context', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({ portfolioCount: 4 }))
    expect(wf.steps[4].memberContext).toContain('4')
  })

  it('shows warning in step 5 context when no portfolio items', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({ portfolioCount: 0 }))
    expect(wf.steps[4].memberContext).toContain('no portfolio items')
  })

  it('step 6 reminds member to log application in tracker', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember())
    expect(wf.steps[5].memberContext.toLowerCase()).toContain('tracker')
  })
})

// ─── buildWorkflow — profile completeness note ────────────────────────────────

describe('buildWorkflow() — profile completeness note (step 1)', () => {
  it('shows ready message when profile is complete', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      hasAccount:          true,
      portfolioCount:      3,
      profileCompleteness: 80,
    }))
    expect(wf.steps[0].memberContext).toContain('✅')
    expect(wf.steps[0].memberContext).toContain('no blockers')
  })

  it('warns when member has no account on platform', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      hasAccount: false,
    }))
    expect(wf.steps[0].memberContext).toContain('⚠️')
    expect(wf.steps[0].memberContext).toContain('account')
  })

  it('warns when portfolio count < 2', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      portfolioCount: 1,
    }))
    expect(wf.steps[0].memberContext).toContain('⚠️')
    expect(wf.steps[0].memberContext).toContain('portfolio')
  })

  it('warns when profile completeness < 70', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      profileCompleteness: 60,
    }))
    expect(wf.steps[0].memberContext).toContain('⚠️')
    expect(wf.steps[0].memberContext).toContain('complete your profile')
  })

  it('multiple issues are all included in the note', () => {
    const wf = buildWorkflow(makeJob(), makePlatform(), makeMember({
      hasAccount:          false,
      portfolioCount:      0,
      profileCompleteness: 40,
    }))
    const ctx = wf.steps[0].memberContext
    expect(ctx).toContain('account')
    expect(ctx).toContain('portfolio')
    expect(ctx).toContain('profile')
  })
})

// ─── buildWorkflow — platform guide injection ──────────────────────────────────

describe('buildWorkflow() — platform guide injection', () => {
  it('uses default content when applicationGuide is null', () => {
    const wf = buildWorkflow(makeJob(), makePlatform({ applicationGuide: null }), makeMember())
    // Step 1 default content mentions "Active account"
    expect(wf.steps[0].content).toContain('Active account')
  })

  it('uses parsed platform guide content when provided', () => {
    const guide = `## Step 1\nCreate your Upwork profile.\n## Step 2\nResearch the client.\n`
    const wf = buildWorkflow(
      makeJob(),
      makePlatform({ applicationGuide: guide }),
      makeMember()
    )
    expect(wf.steps[0].content).toContain('Create your Upwork profile')
    expect(wf.steps[1].content).toContain('Research the client')
  })

  it('falls back to default when a section is missing from guide', () => {
    const guide = `## Step 1\nCustom step 1 content.\n`
    const wf = buildWorkflow(
      makeJob(),
      makePlatform({ applicationGuide: guide }),
      makeMember()
    )
    // Step 1 from guide, step 2 falls back to default
    expect(wf.steps[0].content).toContain('Custom step 1 content')
    // Step 2 default mentions "read the full job description"
    expect(wf.steps[1].content.toLowerCase()).toContain('job description')
  })

  it('includes platform tips in step 4 when platformTips is provided', () => {
    const wf = buildWorkflow(
      makeJob(),
      makePlatform({ platformTips: 'Keep proposals under 150 words on this platform.' }),
      makeMember()
    )
    expect(wf.steps[3].memberContext).toContain('150 words')
  })

  it('null extractedSkills handled gracefully in skill note', () => {
    expect(() => buildWorkflow(
      makeJob({ extractedSkills: null }),
      makePlatform(),
      makeMember({ skillsMatched: [], skillsMissing: [] })
    )).not.toThrow()
  })
})
