// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppNav from '@/components/AppNav'

// Controllable pathname (vi.mock factory may only close over vars prefixed "mock")
let mockPath = '/feed'
vi.mock('next/navigation', () => ({ usePathname: () => mockPath }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

beforeEach(() => {
  mockPath = '/feed'
})

describe('AppNav', () => {
  it('renders every nav item', () => {
    render(<AppNav />)
    for (const label of ['Feed', 'Tracker', 'Platforms', 'Roadmap', 'Audit', 'Community', 'Settings']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('marks the exact-match route as active', () => {
    mockPath = '/feed'
    render(<AppNav />)
    const link = screen.getByText('Feed').closest('a')!
    expect(link.className).toContain('bg-primary/10')
  })

  it('marks a route active for nested sub-paths via startsWith', () => {
    mockPath = '/tracker/123'
    render(<AppNav />)
    const tracker = screen.getByText('Tracker').closest('a')!
    const feed = screen.getByText('Feed').closest('a')!
    expect(tracker.className).toContain('bg-primary/10')
    expect(feed.className).not.toContain('bg-primary/10')
  })

  it('shows the user initial and a sign-out control when a name is given', () => {
    render(<AppNav userName="dana" />)
    expect(screen.getByText('D')).toBeInTheDocument() // initial, upper-cased
    expect(screen.getByText('dana')).toBeInTheDocument()
    expect(screen.getByTitle('Sign out')).toBeInTheDocument()
  })

  it('omits the user section when no name is given', () => {
    render(<AppNav />)
    expect(screen.queryByTitle('Sign out')).not.toBeInTheDocument()
  })
})
