// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApplicationStepper from '@/components/apply/ApplicationStepper'
import type { Workflow } from '@/lib/application-workflow'

const toastSuccess = vi.fn()
vi.mock('sonner', () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a) } }))
vi.mock('@/components/apply/ProposalPanel', () => ({
  default: ({ platform }: { platform: string }) => <div>proposal-panel:{platform}</div>,
}))

const workflow: Workflow = {
  platform: 'Upwork',
  steps: [
    { id: 's1', title: 'Step One', description: 'First step desc', checks: ['Check A', 'Check B'], tip: 'A tip', actionLabel: 'Audit', actionHref: '/audit' },
    { id: 's2', title: 'Step Two', description: 'Second step desc', checks: ['Check C'], isProposalStep: true },
  ],
}

const renderStepper = (over: Partial<React.ComponentProps<typeof ApplicationStepper>> = {}) =>
  render(
    <ApplicationStepper
      workflow={workflow}
      jobId="job1"
      jobTitle="ML Engineer"
      jobUrl="https://example.com/job"
      applicationId="app1"
      initialChecklist={{}}
      {...over}
    />
  )

beforeEach(() => {
  toastSuccess.mockClear()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
})

describe('ApplicationStepper', () => {
  it('renders the first step with progress at zero and Back disabled', () => {
    renderStepper()
    expect(screen.getByText('First step desc')).toBeInTheDocument()
    expect(screen.getByText('0% complete')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled()
  })

  it('updates progress and persists when a check is toggled', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchSpy)
    renderStepper()

    fireEvent.click(screen.getAllByRole('checkbox')[0])

    // 1 of 3 total checks across both steps -> 33%
    expect(await screen.findByText('33% complete')).toBeInTheDocument()
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith('/api/applications/app1', expect.objectContaining({ method: 'PATCH' }))
    )
  })

  it('does not call the API when there is no application id', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderStepper({ applicationId: null })

    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('navigates to the next step', () => {
    renderStepper()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Second step desc')).toBeInTheDocument()
    // "Step 2 of 2" appears twice (progress header + mobile counter)
    expect(screen.getAllByText('Step 2 of 2').length).toBeGreaterThan(0)
  })

  it('toggles the proposal generator on the proposal step', () => {
    renderStepper()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.queryByText('proposal-panel:Upwork')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /generate proposal/i }))
    expect(screen.getByText('proposal-panel:Upwork')).toBeInTheDocument()
  })

  it('marks the application submitted on the last step', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchSpy)
    renderStepper()
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByRole('link', { name: /apply on upwork/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /mark submitted/i }))

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith('Application marked as Submitted!'))
  })
})
