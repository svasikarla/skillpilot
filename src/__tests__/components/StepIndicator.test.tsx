// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StepIndicator from '@/components/onboarding/StepIndicator'

describe('StepIndicator', () => {
  it('renders all step labels', () => {
    render(<StepIndicator current={0} />)
    for (const label of ['About you', 'Skills', 'Work prefs', 'Portfolio']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('shows numbers for the current and upcoming steps and no checkmarks at step 0', () => {
    render(<StepIndicator current={0} />)
    expect(screen.queryAllByText('✓')).toHaveLength(0)
    // current (1) + three upcoming (2,3,4)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('marks completed steps with a checkmark', () => {
    render(<StepIndicator current={2} />)
    // steps 0 and 1 are done
    expect(screen.queryAllByText('✓')).toHaveLength(2)
    // current step (index 2) shows its number
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('marks all prior steps complete on the final step', () => {
    render(<StepIndicator current={3} />)
    expect(screen.queryAllByText('✓')).toHaveLength(3)
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
