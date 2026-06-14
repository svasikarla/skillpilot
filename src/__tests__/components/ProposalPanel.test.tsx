// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProposalPanel from '@/components/apply/ProposalPanel'

const toast = { error: vi.fn(), success: vi.fn() }
vi.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => toast.error(...a), success: (...a: unknown[]) => toast.success(...a) } }))

const fillAllFields = () => {
  fireEvent.change(screen.getByLabelText(/specific value/i), { target: { value: 'Built RAG systems' } })
  fireEvent.change(screen.getByLabelText(/measurable past result/i), { target: { value: 'Cut latency 40%' } })
  fireEvent.change(screen.getByLabelText(/smart question/i), { target: { value: 'Who owns the pipeline?' } })
}

const variantsResponse = {
  ok: true,
  json: async () => ({ variants: { concise: 'Concise text', standard: 'Standard text', detailed: 'Detailed text' } }),
}

beforeEach(() => {
  toast.error.mockClear()
  toast.success.mockClear()
})

describe('ProposalPanel', () => {
  it('shows a platform-specific tip for a known platform', () => {
    render(<ProposalPanel jobId="1" platform="Upwork" />)
    expect(screen.getByText(/100–150 words/)).toBeInTheDocument()
  })

  it('shows no tip for an unknown platform', () => {
    render(<ProposalPanel jobId="1" platform="Fiverr" />)
    expect(screen.queryByText(/100–150 words/)).not.toBeInTheDocument()
  })

  it('validates that all three fields are filled before generating', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    render(<ProposalPanel jobId="1" platform="Upwork" />)

    fireEvent.click(screen.getByRole('button', { name: /generate 3 variants/i }))

    expect(toast.error).toHaveBeenCalledWith('Fill in all three fields')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders generated variants and switches between them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(variantsResponse))
    render(<ProposalPanel jobId="1" platform="Upwork" />)
    fillAllFields()
    fireEvent.click(screen.getByRole('button', { name: /generate 3 variants/i }))

    // Defaults to the "standard" variant
    expect(await screen.findByDisplayValue('Standard text')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^concise$/i }))
    expect(screen.getByDisplayValue('Concise text')).toBeInTheDocument()
  })

  it('returns to the form when Regenerate is clicked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(variantsResponse))
    render(<ProposalPanel jobId="1" platform="Upwork" />)
    fillAllFields()
    fireEvent.click(screen.getByRole('button', { name: /generate 3 variants/i }))
    await screen.findByDisplayValue('Standard text')

    fireEvent.click(screen.getByRole('button', { name: /regenerate/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /generate 3 variants/i })).toBeInTheDocument()
    )
  })

  it('surfaces a toast when the API responds with an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Rate limited' }) }))
    render(<ProposalPanel jobId="1" platform="Upwork" />)
    fillAllFields()
    fireEvent.click(screen.getByRole('button', { name: /generate 3 variants/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Rate limited'))
  })
})
