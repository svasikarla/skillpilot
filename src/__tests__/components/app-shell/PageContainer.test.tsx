// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sparkles } from 'lucide-react'
import { PageContainer, RailCard } from '@/components/app-shell/PageContainer'

describe('PageContainer', () => {
  it('renders children inside a main landmark', () => {
    render(<PageContainer>hello</PageContainer>)
    expect(screen.getByRole('main')).toHaveTextContent('hello')
  })

  it('omits the aside when none is provided', () => {
    const { container } = render(<PageContainer>main only</PageContainer>)
    expect(container.querySelector('aside')).toBeNull()
  })

  it('renders the aside alongside the main content', () => {
    render(<PageContainer aside={<div>rail content</div>}>main content</PageContainer>)
    expect(screen.getByRole('main')).toHaveTextContent('main content')
    expect(screen.getByText('rail content')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('applies a custom max width to the bare container', () => {
    const { container } = render(<PageContainer maxWidth="max-w-3xl">x</PageContainer>)
    expect(container.querySelector('main')?.className).toContain('max-w-3xl')
  })
})

describe('RailCard', () => {
  it('renders its title heading and children', () => {
    render(<RailCard title="Outcomes">body text</RailCard>)
    expect(screen.getByRole('heading', { name: 'Outcomes' })).toBeInTheDocument()
    expect(screen.getByText('body text')).toBeInTheDocument()
  })

  it('renders without a title', () => {
    render(<RailCard>untitled body</RailCard>)
    expect(screen.getByText('untitled body')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders an optional icon next to the title', () => {
    const { container } = render(<RailCard title="With icon" icon={Sparkles}>b</RailCard>)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
