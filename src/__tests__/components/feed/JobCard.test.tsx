// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JobCard from '@/components/feed/JobCard'
import type { JobCardData } from '@/components/feed/JobCard'

// Tooltip requires a provider — mock it to render children directly
vi.mock('@/components/ui/tooltip', () => ({
  Tooltip:        ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, render: _r, ...props }: Record<string, unknown>) => <span {...props}>{children as React.ReactNode}</span>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function makeJob(overrides: Partial<JobCardData> = {}): JobCardData {
  return {
    id:                 'job-abc',
    title:              'Senior ML Engineer',
    company:            'TechCorp',
    descriptionExcerpt: 'Build production ML pipelines using LangChain and RAG.',
    sourceUrl:          'https://upwork.com/jobs/123',
    postedAt:           new Date().toISOString(),
    rateMin:            '90',
    rateMax:            '120',
    rateType:           'hourly',
    reliabilityScore:   80,
    reliabilitySignals: { platform_tier: 20 },
    extractedSkills:    ['Python', 'LangChain', 'RAG', 'pgvector'],
    matchScore:         85,
    isNearMiss:         false,
    matchedSkills:      ['Python', 'LangChain'],
    platform: {
      id:        1,
      name:      'Upwork',
      trustTier: 1,
    },
    ...overrides,
  }
}

describe('JobCard', () => {
  describe('content rendering', () => {
    it('renders the job title', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
    })

    it('renders the company name', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText('TechCorp')).toBeInTheDocument()
    })

    it('renders the description excerpt', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText(/Build production ML pipelines/)).toBeInTheDocument()
    })

    it('renders formatted rate range', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText('$90–$120/hr')).toBeInTheDocument()
    })

    it('renders fixed rate format', () => {
      render(<JobCard job={makeJob({ rateType: 'fixed', rateMin: '5000', rateMax: null })} />)
      expect(screen.getByText(/\$5000/)).toBeInTheDocument()
    })

    it('renders platform name', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText('Upwork')).toBeInTheDocument()
    })

    it('renders up to 3 matched skill pills', () => {
      render(<JobCard job={makeJob({ matchedSkills: ['Python', 'LangChain', 'RAG'] })} />)
      expect(screen.getByText('Python')).toBeInTheDocument()
      expect(screen.getByText('LangChain')).toBeInTheDocument()
      expect(screen.getByText('RAG')).toBeInTheDocument()
    })

    it('renders only 3 skills even when more are available', () => {
      render(<JobCard job={makeJob({
        matchedSkills: ['Python', 'LangChain', 'RAG', 'pgvector', 'OpenAI'],
      })} />)
      // Only 3 should appear (slice(0,3) in component)
      // The 4th and 5th should NOT be rendered as skill pills
      const pills = screen.queryAllByText('pgvector')
      expect(pills.length).toBe(0)
    })
  })

  describe('optional fields', () => {
    it('does not render company section when company is null', () => {
      render(<JobCard job={makeJob({ company: null })} />)
      expect(screen.queryByText('TechCorp')).not.toBeInTheDocument()
    })

    it('does not render rate when no rate is provided', () => {
      const { container } = render(<JobCard job={makeJob({ rateMin: null, rateMax: null })} />)
      expect(container.textContent).not.toContain('$90')
    })

    it('does not render match score number when matchScore is null', () => {
      render(<JobCard job={makeJob({ matchScore: null })} />)
      // MatchBadge shows the numeric score — should not appear when null
      expect(screen.queryByText('85')).not.toBeInTheDocument()
    })

    it('renders match score number when matchScore is provided', () => {
      render(<JobCard job={makeJob({ matchScore: 85 })} />)
      // MatchBadge renders the score as text inside the SVG
      expect(screen.getByText('85')).toBeInTheDocument()
    })

    it('does not render excerpt when descriptionExcerpt is null', () => {
      render(<JobCard job={makeJob({ descriptionExcerpt: null })} />)
      expect(screen.queryByText(/Build production ML pipelines/)).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onClick when card is clicked', () => {
      const handleClick = vi.fn()
      render(<JobCard job={makeJob()} onClick={handleClick} />)
      fireEvent.click(screen.getByText('Senior ML Engineer'))
      expect(handleClick).toHaveBeenCalledOnce()
    })

    it('does not throw when onClick is not provided', () => {
      expect(() => {
        render(<JobCard job={makeJob()} />)
        fireEvent.click(screen.getByText('Senior ML Engineer'))
      }).not.toThrow()
    })

    it('shows "Details" expand hint', () => {
      render(<JobCard job={makeJob()} />)
      expect(screen.getByText('Details')).toBeInTheDocument()
    })
  })

  describe('time display', () => {
    it('shows "today" for a job just posted', () => {
      render(<JobCard job={makeJob({ postedAt: new Date().toISOString() })} />)
      expect(screen.getByText('today')).toBeInTheDocument()
    })

    it('shows "1d ago" for a job posted yesterday', () => {
      const yesterday = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
      render(<JobCard job={makeJob({ postedAt: yesterday })} />)
      expect(screen.getByText('1d ago')).toBeInTheDocument()
    })

    it('does not crash for null postedAt', () => {
      expect(() =>
        render(<JobCard job={makeJob({ postedAt: null })} />)
      ).not.toThrow()
    })
  })
})
