import { describe, it, expect } from 'vitest'
import {
  NAV_ITEMS, NAV_FOOTER_ITEMS, isFocusRoute, isActiveRoute,
} from '@/components/app-shell/nav-items'

describe('nav-items config', () => {
  it('exposes the primary nav routes in order', () => {
    expect(NAV_ITEMS.map(i => i.href)).toEqual([
      '/feed', '/tracker', '/platforms', '/roadmap', '/audit', '/community',
    ])
  })

  it('pins settings to the footer', () => {
    expect(NAV_FOOTER_ITEMS.map(i => i.href)).toEqual(['/settings'])
  })

  it('gives every item a label and an icon', () => {
    for (const item of [...NAV_ITEMS, ...NAV_FOOTER_ITEMS]) {
      expect(item.label.length).toBeGreaterThan(0)
      expect(item.icon).toBeTruthy()
    }
  })
})

describe('isFocusRoute', () => {
  it('treats onboarding (and nested) as focus mode', () => {
    expect(isFocusRoute('/onboarding')).toBe(true)
    expect(isFocusRoute('/onboarding/step-2')).toBe(true)
  })

  it('treats the apply flow as focus mode', () => {
    expect(isFocusRoute('/jobs/abc-123/apply')).toBe(true)
    expect(isFocusRoute('/jobs/abc-123/apply/')).toBe(true)
  })

  it('treats normal routes as non-focus', () => {
    expect(isFocusRoute('/feed')).toBe(false)
    expect(isFocusRoute('/jobs/abc-123')).toBe(false)
    expect(isFocusRoute('/platforms/upwork')).toBe(false)
  })
})

describe('isActiveRoute', () => {
  it('matches the exact path', () => {
    expect(isActiveRoute('/feed', '/feed')).toBe(true)
  })

  it('matches nested child paths', () => {
    expect(isActiveRoute('/platforms/upwork', '/platforms')).toBe(true)
  })

  it('does not match prefix-colliding or unrelated paths', () => {
    expect(isActiveRoute('/feedback', '/feed')).toBe(false)
    expect(isActiveRoute('/tracker', '/feed')).toBe(false)
  })
})
