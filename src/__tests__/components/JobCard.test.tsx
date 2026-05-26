// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import JobCard from '@/components/JobCard'

vi.mock('@/components/apply/ProposalPanel', () => ({ default: () => null }))
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }))

const job = {
  id: '42',
  title: 'Senior ML Engineer',
  company: 'Acme AI',
  description: 'We are building AI products and need a senior ML engineer to lead model development.',
  platform: 'Upwork',
  url: 'https://upwork.com/jobs/42',
  skills: ['Python', 'TensorFlow', 'PyTorch'],
  location: 'Remote',
  rate_min: 100,
  rate_max: 150,
  posted_at: new Date().toISOString(),
  match_score: 85,
  reliability_score: 80,
  matched_skills: ['Python', 'TensorFlow'],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
})

describe('JobCard – rendering', () => {
  it('renders the job title', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
  })

  it('renders the company name', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByText('Acme AI')).toBeInTheDocument()
  })

  it('renders the platform label', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByText('Upwork')).toBeInTheDocument()
  })

  it('renders the location', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('renders the rate range', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByText('$100–$150/hr')).toBeInTheDocument()
  })

  it('renders skill badges from matched_skills when available', () => {
    render(<JobCard job={job} userSkills={['Python', 'TensorFlow']} />)
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('TensorFlow')).toBeInTheDocument()
  })

  it('renders overflow count when job has more than 6 skills', () => {
    const manySkills = { ...job, skills: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], matched_skills: [] }
    render(<JobCard job={manySkills} userSkills={[]} />)
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('shows the Proposal button', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.getByRole('button', { name: /proposal/i })).toBeInTheDocument()
  })
})

describe('JobCard – save button', () => {
  it('shows Save button when onSave is provided', () => {
    render(<JobCard job={job} userSkills={[]} onSave={() => {}} />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('does not show Save button when onSave is not provided', () => {
    render(<JobCard job={job} userSkills={[]} />)
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument()
  })

  it('calls onSave when Save button is clicked', () => {
    const onSave = vi.fn()
    render(<JobCard job={job} userSkills={[]} onSave={onSave} isSaved={false} />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('disables Save button when isSaved is true', () => {
    render(<JobCard job={job} userSkills={[]} onSave={() => {}} isSaved />)
    expect(screen.getByRole('button', { name: /saved/i })).toBeDisabled()
  })
})

describe('JobCard – expand/collapse', () => {
  it('shows expand button when description is longer than 200 chars', () => {
    const longJob = { ...job, description: 'x'.repeat(201) }
    render(<JobCard job={longJob} userSkills={[]} />)
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument()
  })

  it('does not show expand button for short descriptions', () => {
    const shortJob = { ...job, description: 'Short description.' }
    render(<JobCard job={shortJob} userSkills={[]} />)
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
  })
})

describe('JobCard – missing optional data', () => {
  it('renders without company gracefully', () => {
    render(<JobCard job={{ ...job, company: null }} userSkills={[]} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
  })

  it('renders without rate data gracefully', () => {
    render(<JobCard job={{ ...job, rate_min: null, rate_max: null }} userSkills={[]} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
    expect(screen.queryByText(/\/hr/)).not.toBeInTheDocument()
  })

  it('renders without description gracefully', () => {
    render(<JobCard job={{ ...job, description: null }} userSkills={[]} />)
    expect(screen.getByText('Senior ML Engineer')).toBeInTheDocument()
  })
})
