// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JobDescription from '@/components/feed/JobDescription'

describe('JobDescription', () => {
  it('renders nothing for an empty description', () => {
    const { container } = render(<JobDescription description="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section labels for a structured posting', () => {
    render(
      <JobDescription description={'About Us\nWe build AI.\nResponsibilities\nLead model work.'} />
    )
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Responsibilities')).toBeInTheDocument()
    expect(screen.getByText('We build AI.')).toBeInTheDocument()
  })

  it('renders bulletable sections as list items', () => {
    const raw = 'Responsibilities\n- Build models\n- Ship features\n- Talk to users'
    render(<JobDescription description={raw} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Build models')
  })

  it('truncates long bodies with an ellipsis when maxBodyChars is set', () => {
    const longBody = 'word '.repeat(80).trim() // ~400 chars, single paragraph
    render(<JobDescription description={longBody} maxBodyChars={50} />)
    const paragraph = screen.getByText(/word/)
    expect(paragraph.textContent!.endsWith('…')).toBe(true)
    expect(paragraph.textContent!.length).toBeLessThanOrEqual(51)
  })

  it('limits the number of bullets shown in compact mode', () => {
    const raw = 'Responsibilities\n' + Array.from({ length: 8 }, (_, i) => `- Task ${i + 1}`).join('\n')
    render(<JobDescription description={raw} compact />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
  })
})
