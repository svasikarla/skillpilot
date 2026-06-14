// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ReliabilityExplainer from '@/components/feed/ReliabilityExplainer'

describe('ReliabilityExplainer', () => {
  it('renders nothing when the score is at or above the safe threshold', () => {
    const { container } = render(
      <ReliabilityExplainer score={70} signals={{ telegram_contact: true }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when there are no negative signals', () => {
    const { container } = render(
      <ReliabilityExplainer score={40} signals={{ tier1_platform: true, rate_disclosed: true }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('lists only the negative signals when flagged', () => {
    render(
      <ReliabilityExplainer
        score={40}
        signals={{
          telegram_contact: true,   // negative -> shown
          upfront_fee: true,        // negative -> shown
          tier1_platform: true,     // positive -> hidden
          rate_disclosed: false,    // false -> hidden
        }}
      />
    )
    expect(screen.getByText('Why this listing is flagged')).toBeInTheDocument()
    expect(screen.getByText('Requests contact via Telegram/WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Upfront payment or registration fee required')).toBeInTheDocument()
    expect(screen.queryByText('Posted on Tier 1 verified platform')).not.toBeInTheDocument()
  })

  it('ignores unknown signal keys', () => {
    const { container } = render(
      <ReliabilityExplainer score={10} signals={{ some_future_signal: true }} />
    )
    expect(container.firstChild).toBeNull()
  })
})
