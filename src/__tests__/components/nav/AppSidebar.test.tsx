// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AppSidebar from '@/components/nav/AppSidebar'

// Hoist mock refs above vi.mock hoisting boundary
const { mockPush, mockSignOut } = vi.hoisted(() => ({
  mockPush:    vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue({}),
}))

// next/navigation mocks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/feed'),
  useRouter:   vi.fn().mockReturnValue({ push: mockPush }),
}))

// next/link renders an <a> tag in tests
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

// Supabase client mock
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: { signOut: mockSignOut },
  }),
}))

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the brand name', () => {
    render(<AppSidebar />)
    expect(screen.getByText(/SkillPilot/i)).toBeInTheDocument()
  })

  it('renders all primary navigation links', () => {
    render(<AppSidebar />)
    expect(screen.getByText('Job Feed')).toBeInTheDocument()
    expect(screen.getByText('Tracker')).toBeInTheDocument()
    expect(screen.getByText('Platforms')).toBeInTheDocument()
    expect(screen.getByText('Roadmap')).toBeInTheDocument()
    expect(screen.getByText('Profile Audit')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
  })

  it('renders Settings and Admin links', () => {
    render(<AppSidebar />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders Sign out button', () => {
    render(<AppSidebar />)
    expect(screen.getByText(/Sign out/)).toBeInTheDocument()
  })

  it('marks /feed as active when current path is /feed', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/feed')
    render(<AppSidebar />)
    const feedLink = screen.getByText('Job Feed').closest('a')
    // Active link has bg-primary class
    expect(feedLink?.className).toContain('bg-primary')
  })

  it('calls signOut and redirects on sign-out click', async () => {
    render(<AppSidebar />)
    const signOutBtn = screen.getByText(/Sign out/)
    fireEvent.click(signOutBtn)
    // Give async signOut time to resolve
    await vi.waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it('renders the Sparkles brand icon', () => {
    const { container } = render(<AppSidebar />)
    // Lucide Sparkles renders an SVG
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('has correct href for each nav item', () => {
    render(<AppSidebar />)
    expect(screen.getByText('Job Feed').closest('a')).toHaveAttribute('href', '/feed')
    expect(screen.getByText('Tracker').closest('a')).toHaveAttribute('href', '/tracker')
    expect(screen.getByText('Platforms').closest('a')).toHaveAttribute('href', '/platforms')
    expect(screen.getByText('Roadmap').closest('a')).toHaveAttribute('href', '/roadmap')
    expect(screen.getByText('Community').closest('a')).toHaveAttribute('href', '/community')
    expect(screen.getByText('Admin').closest('a')).toHaveAttribute('href', '/admin')
  })

  it('marks Admin link as active when current path starts with /admin', async () => {
    const { usePathname } = await import('next/navigation')
    vi.mocked(usePathname).mockReturnValue('/admin/jobs')
    render(<AppSidebar />)
    const adminLink = screen.getByText('Admin').closest('a')
    expect(adminLink?.className).toContain('bg-primary')
  })
})
