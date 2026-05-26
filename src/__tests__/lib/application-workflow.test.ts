import { describe, it, expect } from 'vitest'
import { getWorkflow } from '@/lib/application-workflow'

const KNOWN_PLATFORMS = ['Upwork', 'Toptal', 'Contra'] as const

describe('getWorkflow', () => {
  it.each(KNOWN_PLATFORMS)('returns %s-specific workflow', (platform) => {
    const w = getWorkflow(platform)
    expect(w.platform).toBe(platform)
  })

  it('returns a default workflow for an unknown platform', () => {
    const w = getWorkflow('SomePlatform')
    expect(w.platform).toBe('SomePlatform')
    expect(w.steps.length).toBeGreaterThan(0)
  })

  it('injects platform name into default workflow step descriptions', () => {
    const w = getWorkflow('HireMeNow')
    const prereqs = w.steps.find(s => s.id === 'prereqs')
    expect(prereqs?.description).toContain('HireMeNow')
    expect(prereqs?.checks?.some(c => c.includes('HireMeNow'))).toBe(true)
  })

  it.each(KNOWN_PLATFORMS)('%s workflow has exactly 6 steps', (platform) => {
    const w = getWorkflow(platform)
    expect(w.steps).toHaveLength(6)
  })

  it('default workflow has exactly 6 steps', () => {
    expect(getWorkflow('AnyPlatform').steps).toHaveLength(6)
  })

  it.each(KNOWN_PLATFORMS)('%s workflow has a proposal step with isProposalStep=true', (platform) => {
    const w = getWorkflow(platform)
    const proposalSteps = w.steps.filter(s => s.isProposalStep)
    expect(proposalSteps).toHaveLength(1)
    expect(proposalSteps[0].id).toBe('proposal')
  })

  it('default workflow has a proposal step', () => {
    const w = getWorkflow('AnyPlatform')
    const proposalSteps = w.steps.filter(s => s.isProposalStep)
    expect(proposalSteps).toHaveLength(1)
  })

  it('every step has id, title, description, and checks', () => {
    const w = getWorkflow('Upwork')
    for (const step of w.steps) {
      expect(step.id).toBeTruthy()
      expect(step.title).toBeTruthy()
      expect(step.description).toBeTruthy()
      expect(Array.isArray(step.checks)).toBe(true)
      expect(step.checks.length).toBeGreaterThan(0)
    }
  })

  it('Upwork profile_check step links to /audit', () => {
    const w = getWorkflow('Upwork')
    const profileStep = w.steps.find(s => s.id === 'profile_check')
    expect(profileStep?.actionHref).toBe('/audit')
  })

  it('Toptal accepts approximately 3% of applicants (tip content check)', () => {
    const w = getWorkflow('Toptal')
    const prereqs = w.steps.find(s => s.id === 'prereqs')
    expect(prereqs?.tip).toContain('3%')
  })

  it('returns a different object each call for the default workflow', () => {
    const a = getWorkflow('PlatformX')
    const b = getWorkflow('PlatformX')
    expect(a).not.toBe(b) // different object references (factory function)
  })

  it('known platform workflows are stable references', () => {
    expect(getWorkflow('Upwork')).toBe(getWorkflow('Upwork'))
  })
})
