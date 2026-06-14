// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileCompletenessCard } from '@/components/app-shell/ProfileCompletenessCard'

vi.mock('next/link', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => <a href={String(href)} {...rest}>{children}</a>,
}))

const fullProfile = {
  name: 'Dana',
  about: 'ML engineer with 5 years experience',
  skills: ['Python', 'PyTorch', 'LangChain'],
  hourly_rate: 120,
  years_experience: 5,
  work_preference: 'long_contract',
  portfolio: [{ name: 'Recommender system' }],
}

describe('ProfileCompletenessCard', () => {
  it('shows 100% and a complete message when every check passes', () => {
    render(<ProfileCompletenessCard profile={fullProfile} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText(/profile is complete/i)).toBeInTheDocument()
    // No "complete your profile" CTA when there is nothing left to do.
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('computes a partial score and links to settings to finish', () => {
    render(<ProfileCompletenessCard profile={{ name: 'Dana' }} />)
    // 1 of 7 checks done -> 14%.
    expect(screen.getByText('14%')).toBeInTheDocument()
    expect(screen.getByText('1/7 complete')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /complete your profile/i }))
      .toHaveAttribute('href', '/settings')
  })

  it('counts fewer than three skills as an incomplete skills check', () => {
    render(<ProfileCompletenessCard profile={{ name: 'Dana', skills: ['Python', 'PyTorch'] }} />)
    expect(screen.getByText('List your skills')).toBeInTheDocument()
  })

  it('treats an empty portfolio array as incomplete', () => {
    render(<ProfileCompletenessCard profile={{ ...fullProfile, portfolio: [] }} />)
    // 6 of 7 -> 86%, and the complete message is gone.
    expect(screen.getByText('86%')).toBeInTheDocument()
    expect(screen.queryByText(/profile is complete/i)).toBeNull()
  })
})
