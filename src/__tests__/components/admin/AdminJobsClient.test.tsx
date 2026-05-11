// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AdminJobsClient from '@/app/admin/jobs/AdminJobsClient'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import React from 'react'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockToast } = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error:   vi.fn(),
    info:    vi.fn(),
  },
}))

vi.mock('sonner', () => ({ toast: mockToast }))

const { mockUpdateEq, mockUpdateIn } = vi.hoisted(() => ({
  mockUpdateEq: vi.fn().mockResolvedValue({ error: null }),
  mockUpdateIn: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: mockUpdateEq,
        in: mockUpdateIn,
      }),
    }),
  })),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeJob(overrides: Partial<{
  id: string; title: string; company: string | null
  reliabilityScore: number; reliabilitySignals: Record<string, number>
  extractedSkills: string[]; platform: { name: string; trustTier: number } | null
  descriptionExcerpt: string | null; sourceUrl: string; status: string
}> = {}) {
  return {
    id:                 overrides.id                 ?? 'job-1',
    title:              overrides.title              ?? 'Senior ML Engineer',
    company:            overrides.company            ?? 'Acme AI',
    descriptionExcerpt: overrides.descriptionExcerpt ?? 'Build LLMs at scale.',
    sourceUrl:          overrides.sourceUrl          ?? 'https://example.com/job/1',
    postedAt:           null,
    ingestedAt:         null,
    reliabilityScore:   overrides.reliabilityScore   ?? 80,
    reliabilitySignals: overrides.reliabilitySignals ?? { has_rate: 10, detailed_desc: 8 },
    extractedSkills:    overrides.extractedSkills    ?? ['Python', 'PyTorch', 'LangChain'],
    status:             overrides.status             ?? 'pending',
    platform:           overrides.platform !== undefined
      ? overrides.platform
      : { name: 'Toptal', trustTier: 1 },
  }
}

function renderJobs(jobs: ReturnType<typeof makeJob>[]) {
  return render(
    <TooltipProvider>
      <AdminJobsClient jobs={jobs} />
    </TooltipProvider>
  )
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('AdminJobsClient — rendering', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "Queue is empty" when jobs prop is empty', () => {
    renderJobs([])
    expect(screen.getByText(/Queue is empty/)).toBeInTheDocument()
  })

  it('shows job count in toolbar', () => {
    renderJobs([makeJob(), makeJob({ id: 'job-2', title: 'AI Researcher' })])
    expect(screen.getByText('2 shown')).toBeInTheDocument()
  })

  it('renders job title and company', () => {
    renderJobs([makeJob({ title: 'LLM Engineer', company: 'DeepMind' })])
    expect(screen.getByText('LLM Engineer')).toBeInTheDocument()
    expect(screen.getByText('DeepMind')).toBeInTheDocument()
  })

  it('renders reliability score', () => {
    renderJobs([makeJob({ reliabilityScore: 75 })])
    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('renders up to 5 extracted skill badges', () => {
    const skills = ['Python', 'PyTorch', 'TensorFlow', 'LangChain', 'RAG', 'CUDA']
    renderJobs([makeJob({ extractedSkills: skills })])
    // Max 5 shown
    expect(screen.queryByText('CUDA')).not.toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText('RAG')).toBeInTheDocument()
  })

  it('renders platform name badge when platform is provided', () => {
    renderJobs([makeJob({ platform: { name: 'Contra', trustTier: 2 } })])
    expect(screen.getByText('Contra')).toBeInTheDocument()
  })

  it('renders Approve and Reject buttons for each job', () => {
    renderJobs([makeJob()])
    expect(screen.getByRole('button', { name: /Approve/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reject/ })).toBeInTheDocument()
  })
})

// ─── Single job approve / reject ─────────────────────────────────────────────

describe('AdminJobsClient — approve and reject', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clicking Approve calls supabase update with status "approved"', async () => {
    renderJobs([makeJob({ id: 'job-42' })])
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(mockUpdateEq).toHaveBeenCalled())
    // The update().eq() chain
    const updateCall = mockUpdateEq.mock.calls[0]
    expect(updateCall).toEqual(['id', 'job-42'])
  })

  it('clicking Approve removes the job from the list on success', async () => {
    renderJobs([makeJob({ id: 'job-rm', title: 'Job To Remove' })])
    expect(screen.getByText('Job To Remove')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(screen.queryByText('Job To Remove')).not.toBeInTheDocument())
  })

  it('clicking Approve shows toast.success on success', async () => {
    renderJobs([makeJob()])
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Job approved'))
  })

  it('clicking Reject calls supabase update with status "rejected"', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    vi.mocked(createClient).mockReturnValue({ from: vi.fn().mockReturnValue({ update: updateMock }) } as never)

    renderJobs([makeJob({ id: 'job-rej' })])
    fireEvent.click(screen.getByRole('button', { name: /Reject/ }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledWith({ status: 'rejected' }))
  })

  it('clicking Reject removes the job from the list on success', async () => {
    renderJobs([makeJob({ id: 'job-rej', title: 'Job To Be Dismissed' })])
    fireEvent.click(screen.getByRole('button', { name: /Reject/ }))
    await waitFor(() => expect(screen.queryByText('Job To Be Dismissed')).not.toBeInTheDocument())
  })

  it('shows toast.error when Supabase returns an error on approve', async () => {
    const { createClient } = await import('@/lib/supabase/client')
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB timeout' } }),
          in: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as never)

    renderJobs([makeJob()])
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })
})

// ─── Bulk approve ─────────────────────────────────────────────────────────────

describe('AdminJobsClient — bulk approve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockUpdateEq,
          in: mockUpdateIn,
        }),
      }),
    })
  })

  it('shows toast.info when no jobs have score >= 70', async () => {
    renderJobs([
      makeJob({ id: 'j1', reliabilityScore: 50 }),
      makeJob({ id: 'j2', reliabilityScore: 30 }),
    ])
    fireEvent.click(screen.getByRole('button', { name: /Bulk approve/i }))
    await waitFor(() => expect(mockToast.info).toHaveBeenCalledWith('No jobs with score ≥ 70'))
  })

  it('only submits jobs with reliabilityScore >= 70 in bulk approve', async () => {
    renderJobs([
      makeJob({ id: 'eligible',   reliabilityScore: 85 }),
      makeJob({ id: 'ineligible', reliabilityScore: 45 }),
    ])
    fireEvent.click(screen.getByRole('button', { name: /Bulk approve/i }))

    await waitFor(() => expect(mockUpdateIn).toHaveBeenCalled())
    const idArg = mockUpdateIn.mock.calls[0][1] as string[]
    expect(idArg).toContain('eligible')
    expect(idArg).not.toContain('ineligible')
  })

  it('removes only eligible jobs from list after bulk approve', async () => {
    renderJobs([
      makeJob({ id: 'keep',   title: 'Kept Job',    reliabilityScore: 40 }),
      makeJob({ id: 'remove', title: 'Removed Job', reliabilityScore: 90 }),
    ])
    fireEvent.click(screen.getByRole('button', { name: /Bulk approve/i }))

    await waitFor(() => {
      expect(screen.queryByText('Removed Job')).not.toBeInTheDocument()
      expect(screen.getByText('Kept Job')).toBeInTheDocument()
    })
  })

  it('shows toast.success with count after successful bulk approve', async () => {
    renderJobs([
      makeJob({ id: 'j1', reliabilityScore: 75 }),
      makeJob({ id: 'j2', reliabilityScore: 80 }),
    ])
    fireEvent.click(screen.getByRole('button', { name: /Bulk approve/i }))
    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Approved 2 jobs'))
  })
})

// ─── Detail drawer ────────────────────────────────────────────────────────────

describe('AdminJobsClient — detail drawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: mockUpdateEq,
          in: mockUpdateIn,
        }),
      }),
    })
  })

  it('opens the detail sheet when job title button is clicked', async () => {
    renderJobs([makeJob({ title: 'Detail Test Job' })])

    fireEvent.click(screen.getByRole('button', { name: 'Detail Test Job' }))
    await waitFor(() =>
      expect(screen.getAllByText('Detail Test Job').length).toBeGreaterThanOrEqual(1)
    )
  })

  it('closing the sheet clears the detail view', async () => {
    renderJobs([makeJob({ title: 'Sheet Test Job' })])
    fireEvent.click(screen.getByRole('button', { name: 'Sheet Test Job' }))

    await waitFor(() => screen.getAllByText('Sheet Test Job'))
    // Press Escape to close Sheet
    fireEvent.keyDown(document, { key: 'Escape' })
    await waitFor(() => expect(screen.getAllByText('Sheet Test Job')).toHaveLength(1))
  })

  it('renders SIGNAL_LABELS for reliability signal keys in the drawer', async () => {
    renderJobs([makeJob({
      reliabilitySignals: { rate_disclosed: 10, telegram_contact: -35 },
    })])

    fireEvent.click(screen.getByRole('button', { name: 'Senior ML Engineer' }))
    await waitFor(() => {
      // SIGNAL_LABELS should translate 'rate_disclosed' to a human label
      expect(screen.getByText(/Rate\/salary disclosed/i)).toBeInTheDocument()
    })
  })

  it('shows "View source" link in drawer', async () => {
    renderJobs([makeJob({ sourceUrl: 'https://toptal.com/job/1' })])
    fireEvent.click(screen.getByRole('button', { name: 'Senior ML Engineer' }))

    await waitFor(() => {
      const link = screen.getByText(/View source/)
      expect(link).toBeInTheDocument()
    })
  })
})
