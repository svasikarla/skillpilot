// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AppShell from '@/components/app-shell/AppShell'

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a>,
}))
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/feed') }))

import { usePathname } from 'next/navigation'

beforeEach(() => {
  vi.mocked(usePathname).mockReturnValue('/feed')
  document.cookie = 'app-sidebar-collapsed=; max-age=0'
})

describe('AppShell – chrome', () => {
  it('renders the sidebar nav and the page content for normal routes', () => {
    render(<AppShell userName="Dana">page body</AppShell>)
    expect(screen.getByText('page body')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tracker' })).toBeInTheDocument()
  })

  it('shows the active page title in the topbar', () => {
    vi.mocked(usePathname).mockReturnValue('/tracker')
    render(<AppShell userName="Dana">x</AppShell>)
    expect(screen.getByRole('heading', { name: 'Tracker' })).toBeInTheDocument()
  })

  it('shows the user initial in the menu trigger', () => {
    render(<AppShell userName="Dana">x</AppShell>)
    expect(screen.getByText('D')).toBeInTheDocument()
  })

  it('omits the user menu when there is no user name', () => {
    render(<AppShell>x</AppShell>)
    expect(screen.queryByText('Sign out')).toBeNull()
  })
})

describe('AppShell – focus routes', () => {
  it('renders only the children (no nav) on focus routes', () => {
    vi.mocked(usePathname).mockReturnValue('/onboarding')
    render(<AppShell userName="Dana">wizard step</AppShell>)
    expect(screen.getByText('wizard step')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Tracker' })).toBeNull()
  })
})

describe('AppShell – collapse preference', () => {
  it('persists the collapse choice to a cookie when toggled', () => {
    render(<AppShell userName="Dana">x</AppShell>)
    fireEvent.click(screen.getByLabelText(/collapse sidebar/i))
    expect(document.cookie).toContain('app-sidebar-collapsed=1')
  })

  it('starts collapsed when defaultCollapsed is set', () => {
    render(<AppShell userName="Dana" defaultCollapsed>x</AppShell>)
    expect(screen.getByLabelText(/expand sidebar/i)).toBeInTheDocument()
  })
})
