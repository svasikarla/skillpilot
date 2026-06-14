// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JobDetailSheet from '@/components/feed/JobDetailSheet'

type Job = React.ComponentProps<typeof JobDetailSheet>['job']

const baseJob = (over: Partial<NonNullable<Job>> = {}): NonNullable<Job> => ({
  id: '1',
  title: 'Senior ML Engineer',
  company: 'Acme AI',
  description: 'About Us\nWe build AI.\nResponsibilities\nLead model work.',
  platform: 'Upwork',
  url: 'https://example.com/job',
  skills: ['Python', 'PyTorch'],
  location: 'Remote',
  rate_min: 100,
  rate_max: 150,
  posted_at: new Date().toISOString(),
  ...over,
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('JobDetailSheet', () => {
  it('renders nothing when there is no job', () => {
    const { container } = render(
      <JobDetailSheet job={null} open onClose={() => {}} userSkills={[]} />
    )
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('Senior ML Engineer')).not.toBeInTheDocument()
  })

  it('renders header details and the default Details tab', () => {
    render(<JobDetailSheet job={baseJob()} open onClose={() => {}} userSkills={['Python']} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme AI')).toBeInTheDocument()
    expect(screen.getByText('$100–$150/hr')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    // skills appear in the details tab
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
  })

  it('formats a one-sided rate range', () => {
    render(<JobDetailSheet job={baseJob({ rate_min: 80, rate_max: null })} open onClose={() => {}} userSkills={[]} />)
    expect(screen.getByText('From $80/hr')).toBeInTheDocument()
  })

  it('calls onProposal from the Draft proposal button', () => {
    const onProposal = vi.fn()
    render(<JobDetailSheet job={baseJob()} open onClose={() => {}} userSkills={[]} onProposal={onProposal} />)
    fireEvent.click(screen.getByRole('button', { name: /draft proposal/i }))
    expect(onProposal).toHaveBeenCalledOnce()
  })

  it('shows match details after switching to the Match tab', () => {
    render(
      <JobDetailSheet
        job={baseJob({ match_score: 82, skill_score: 90 })}
        open onClose={() => {}} userSkills={['Python']}
      />
    )
    fireEvent.click(screen.getByRole('tab', { name: /match/i }))
    expect(screen.getByText('Overall match')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('generates interview prep on the Prep tab', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [{ q: 'Explain RAG', a: 'Retrieval augmented generation.' }] }),
    }))
    render(<JobDetailSheet job={baseJob()} open onClose={() => {}} userSkills={[]} />)

    fireEvent.click(screen.getByRole('tab', { name: /prep/i }))
    fireEvent.click(screen.getByRole('button', { name: /generate interview prep/i }))

    expect(await screen.findByText(/Explain RAG/)).toBeInTheDocument()
  })
})
