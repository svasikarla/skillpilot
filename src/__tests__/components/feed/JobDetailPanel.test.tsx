// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JobDetailPanel from '@/components/feed/JobDetailPanel'
import type { JobCardData } from '@/components/feed/JobCard'

// Stub heavy sub-components and external libs
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip:         ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger:  ({ children, render: _r, ...props }: Record<string, unknown>) => <span {...props}>{children as React.ReactNode}</span>,
  TooltipContent:  ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/config', async (i) => ({ ...(await i<typeof import('@/lib/config')>()) }))
vi.mock('@/lib/reliability', async (i) => ({ ...(await i<typeof import('@/lib/reliability')>()) }))

const mockJob: JobCardData = {
  id:                 'job-xyz',
  title:              'Senior ML Engineer',
  company:            'TechCorp',
  descriptionExcerpt: 'Build production RAG pipelines.',
  sourceUrl:          'https://upwork.com/jobs/123',
  postedAt:           new Date().toISOString(),
  rateMin:            '100',
  rateMax:            '140',
  rateType:           'hourly',
  reliabilityScore:   82,
  reliabilitySignals: { platform_tier: 20, rate_disclosed: 10 },
  extractedSkills:    ['Python', 'LangChain', 'RAG'],
  matchScore:         85,
  isNearMiss:         false,
  matchedSkills:      ['Python', 'LangChain'],
  platform: { id: 1, name: 'Upwork', trustTier: 1 },
}

describe('JobDetailPanel', () => {
  it('renders nothing when job is null', () => {
    const { container } = render(
      <JobDetailPanel job={null} userId="user-1" onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the job title when job is provided', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
  })

  it('renders the company name', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
  })

  it('shows the platform badge', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText('Upwork')).toBeInTheDocument()
  })

  it('shows Description, Match, Stand Out, Reliability tabs', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Match')).toBeInTheDocument()
    expect(screen.getByText('Stand Out')).toBeInTheDocument()
    expect(screen.getByText('Reliability')).toBeInTheDocument()
  })

  it('shows the job description excerpt in Description tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText(/Build production RAG pipelines/)).toBeInTheDocument()
  })

  it('shows extracted skill badges in Description tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('LangChain')).toBeInTheDocument()
    expect(screen.getByText('RAG')).toBeInTheDocument()
  })

  it('shows standout placeholder content after clicking Stand Out tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Stand Out'))
    // Either the "Ready to generate tips" idle state OR the skeleton loader is visible
    const ready   = screen.queryAllByText(/Ready to generate tips/i)
    const loading = document.querySelectorAll('.animate-pulse')
    expect(ready.length + loading.length).toBeGreaterThan(0)
  })

  it('shows reliability score in Reliability tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Reliability'))
    // "Score: 82/100" text appears; use getAllByText to allow multiple matches
    const matches = screen.getAllByText(/82/)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('shows "Report as scam" button in Reliability tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Reliability'))
    expect(screen.getByText(/Report as scam/i)).toBeInTheDocument()
  })

  it('disables report button when userId is null', () => {
    render(<JobDetailPanel job={mockJob} userId={null} onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Reliability'))
    const reportBtn = screen.getByText(/Report as scam/i).closest('button')
    expect(reportBtn).toBeDisabled()
  })

  it('shows How to Apply link in Description tab', () => {
    render(<JobDetailPanel job={mockJob} userId="user-1" onClose={vi.fn()} />)
    expect(screen.getByText(/How to Apply/)).toBeInTheDocument()
  })

  it('shows near-miss callout in Match tab when isNearMiss=true', () => {
    const nearMissJob = { ...mockJob, isNearMiss: true, matchScore: 45 }
    render(<JobDetailPanel job={nearMissJob} userId="user-1" onClose={vi.fn()} />)
    fireEvent.click(screen.getByText('Match'))
    // Multiple "Near Miss" elements possible (badge + callout); verify at least one
    const nearMissEls = screen.getAllByText(/Near Miss/)
    expect(nearMissEls.length).toBeGreaterThan(0)
  })
})
