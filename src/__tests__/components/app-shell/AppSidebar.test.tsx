// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SidebarNav, AppSidebar } from '@/components/app-shell/AppSidebar'

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a>,
}))
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/feed') }))

import { usePathname } from 'next/navigation'

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue('/feed')
})

describe('SidebarNav', () => {
  it('renders every primary label plus settings when expanded', () => {
    render(<SidebarNav />)
    for (const label of ['Feed', 'Tracker', 'Platforms', 'Roadmap', 'Audit', 'Community', 'Settings']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('marks the current route as the active link', () => {
    vi.mocked(usePathname).mockReturnValue('/tracker')
    render(<SidebarNav />)
    expect(screen.getByRole('link', { name: 'Tracker' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Feed' })).not.toHaveAttribute('aria-current')
  })

  it('hides text labels when collapsed', () => {
    render(<SidebarNav collapsed />)
    expect(screen.queryByText('Feed')).toBeNull()
    expect(screen.queryByText('Community')).toBeNull()
  })

  it('keeps destinations reachable as links when collapsed', () => {
    render(<SidebarNav collapsed />)
    // brand + 6 primary + 1 footer
    expect(screen.getAllByRole('link').length).toBeGreaterThanOrEqual(7)
  })
})

describe('AppSidebar', () => {
  it('renders an expanded rail at full width', () => {
    const { container } = render(<AppSidebar collapsed={false} />)
    expect(container.querySelector('aside')?.className).toContain('w-60')
  })

  it('renders a narrow rail when collapsed', () => {
    const { container } = render(<AppSidebar collapsed />)
    expect(container.querySelector('aside')?.className).toContain('w-[68px]')
  })
})
