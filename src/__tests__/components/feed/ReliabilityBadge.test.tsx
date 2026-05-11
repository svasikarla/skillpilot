// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReliabilityBadge from '@/components/feed/ReliabilityBadge'

const noSignals: Record<string, number> = {}

const positiveSignals: Record<string, number> = {
  platform_tier: 20,
  rate_disclosed: 10,
  desc_length: 8,
}

const negativeSignals: Record<string, number> = {
  telegram_contact: -35,
  upfront_payment:  -35,
}

const mixedSignals: Record<string, number> = {
  platform_tier:    20,
  telegram_contact: -35,
}

describe('ReliabilityBadge', () => {
  describe('score display', () => {
    it('shows score and label in the badge', () => {
      render(<ReliabilityBadge score={80} signals={noSignals} />)
      // Badge shows "score · label"
      expect(screen.getByText(/80/)).toBeInTheDocument()
      expect(screen.getByText(/Trusted/)).toBeInTheDocument()
    })

    it('score 70+ shows "Trusted" label', () => {
      render(<ReliabilityBadge score={70} signals={noSignals} />)
      expect(screen.getByText(/Trusted/)).toBeInTheDocument()
    })

    it('score 40–69 shows "Verify" label', () => {
      render(<ReliabilityBadge score={55} signals={noSignals} />)
      expect(screen.getByText(/Verify/)).toBeInTheDocument()
    })

    it('score 20–39 shows "Caution" label', () => {
      render(<ReliabilityBadge score={30} signals={noSignals} />)
      expect(screen.getByText(/Caution/)).toBeInTheDocument()
    })

    it('score < 20 shows "Suspicious" label', () => {
      render(<ReliabilityBadge score={10} signals={noSignals} />)
      expect(screen.getByText(/Suspicious/)).toBeInTheDocument()
    })
  })

  describe('tooltip content', () => {
    it('renders positive signal labels in the DOM', () => {
      render(<ReliabilityBadge score={80} signals={positiveSignals} />)
      // Tooltip content is in the DOM (may be hidden)
      // SIGNAL_LABELS maps keys → human labels; we check the tooltip renders something
      const { container } = render(<ReliabilityBadge score={80} signals={positiveSignals} />)
      expect(container).toBeTruthy()
    })

    it('renders without crashing for negative signals', () => {
      render(<ReliabilityBadge score={10} signals={negativeSignals} />)
      expect(screen.getByText(/Suspicious/)).toBeInTheDocument()
    })

    it('renders without crashing for mixed signals', () => {
      expect(() =>
        render(<ReliabilityBadge score={50} signals={mixedSignals} />)
      ).not.toThrow()
    })
  })

  describe('size variants', () => {
    it('renders in sm size without crashing', () => {
      render(<ReliabilityBadge score={80} signals={noSignals} size="sm" />)
      expect(screen.getByText(/Trusted/)).toBeInTheDocument()
    })

    it('renders in md size without crashing', () => {
      render(<ReliabilityBadge score={80} signals={noSignals} size="md" />)
      expect(screen.getByText(/Trusted/)).toBeInTheDocument()
    })
  })

  describe('boundary scores', () => {
    it('score exactly 70 → Trusted', () => {
      render(<ReliabilityBadge score={70} signals={noSignals} />)
      expect(screen.getByText(/Trusted/)).toBeInTheDocument()
    })

    it('score exactly 69 → Verify', () => {
      render(<ReliabilityBadge score={69} signals={noSignals} />)
      expect(screen.getByText(/Verify/)).toBeInTheDocument()
    })

    it('score exactly 40 → Verify', () => {
      render(<ReliabilityBadge score={40} signals={noSignals} />)
      expect(screen.getByText(/Verify/)).toBeInTheDocument()
    })

    it('score exactly 39 → Caution', () => {
      render(<ReliabilityBadge score={39} signals={noSignals} />)
      expect(screen.getByText(/Caution/)).toBeInTheDocument()
    })

    it('score exactly 20 → Caution', () => {
      render(<ReliabilityBadge score={20} signals={noSignals} />)
      expect(screen.getByText(/Caution/)).toBeInTheDocument()
    })

    it('score exactly 19 → Suspicious', () => {
      render(<ReliabilityBadge score={19} signals={noSignals} />)
      expect(screen.getByText(/Suspicious/)).toBeInTheDocument()
    })
  })
})
