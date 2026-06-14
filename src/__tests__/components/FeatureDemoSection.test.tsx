// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FeatureDemoSection from '@/components/landing/FeatureDemoSection'

// goTo() defers the chapter change behind a 200ms fade timeout.
const flushFade = () => act(() => { vi.advanceTimersByTime(200) })

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('FeatureDemoSection', () => {
  it('starts on the first chapter and is playing', () => {
    render(<FeatureDemoSection />)
    expect(screen.getByText('Smart job matching, not a job board')).toBeInTheDocument()
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('toggles play/pause', () => {
    render(<FeatureDemoSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('advances to the next chapter', () => {
    render(<FeatureDemoSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' })) // freeze auto-advance
    fireEvent.click(screen.getByRole('button', { name: 'Next chapter' }))
    flushFade()
    expect(screen.getByText('Every application, one pipeline')).toBeInTheDocument()
    expect(screen.getByText('2 / 6')).toBeInTheDocument()
  })

  it('wraps to the last chapter when going back from the first', () => {
    render(<FeatureDemoSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous chapter' }))
    flushFade()
    expect(screen.getByText('Know exactly what to learn next')).toBeInTheDocument()
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
  })

  it('auto-advances to the next chapter when the chapter timer elapses', () => {
    render(<FeatureDemoSection />)
    // ticker runs every 50ms; a full 5000ms chapter elapses then advances
    act(() => { vi.advanceTimersByTime(5050) })
    expect(screen.getByText('2 / 6')).toBeInTheDocument()
  })
})
