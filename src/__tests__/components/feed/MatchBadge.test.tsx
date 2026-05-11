// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import MatchBadge from '@/components/feed/MatchBadge'

// matchLabel and MATCH_THRESHOLDS are tested via the component output
vi.mock('@/lib/matching', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/matching')>()
  return actual
})

vi.mock('@/lib/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/config')>()
  return actual
})

describe('MatchBadge', () => {
  it('renders without crashing', () => {
    render(<MatchBadge score={75} isNearMiss={false} />)
  })

  it('displays the score number', () => {
    render(<MatchBadge score={82} isNearMiss={false} />)
    expect(screen.getByText('82')).toBeInTheDocument()
  })

  it('shows "Apply Ready" label for high scores', () => {
    render(<MatchBadge score={85} isNearMiss={false} />)
    expect(screen.getByText('Apply Ready')).toBeInTheDocument()
  })

  it('shows "Stretch" label for mid-range scores (50–69)', () => {
    render(<MatchBadge score={60} isNearMiss={false} />)
    expect(screen.getByText('Stretch')).toBeInTheDocument()
  })

  it('shows "Low Match" label for scores below 50', () => {
    render(<MatchBadge score={30} isNearMiss={false} />)
    expect(screen.getByText('Low Match')).toBeInTheDocument()
  })

  it('shows "Near Miss" label when isNearMiss=true', () => {
    render(<MatchBadge score={85} isNearMiss={true} />)
    expect(screen.getByText('Near Miss')).toBeInTheDocument()
  })

  it('shows "Near Miss" even for low scores when isNearMiss=true', () => {
    render(<MatchBadge score={20} isNearMiss={true} />)
    expect(screen.getByText('Near Miss')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<MatchBadge score={75} isNearMiss={false} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders two SVG circles (track + progress)', () => {
    const { container } = render(<MatchBadge score={75} isNearMiss={false} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(2)
  })

  it('score 0 renders without crashing', () => {
    render(<MatchBadge score={0} isNearMiss={false} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Low Match')).toBeInTheDocument()
  })

  it('score 100 renders without crashing', () => {
    render(<MatchBadge score={100} isNearMiss={false} />)
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('Apply Ready')).toBeInTheDocument()
  })

  it('boundary score 70 shows Apply Ready', () => {
    render(<MatchBadge score={70} isNearMiss={false} />)
    expect(screen.getByText('Apply Ready')).toBeInTheDocument()
  })

  it('boundary score 50 shows Stretch', () => {
    render(<MatchBadge score={50} isNearMiss={false} />)
    expect(screen.getByText('Stretch')).toBeInTheDocument()
  })
})
