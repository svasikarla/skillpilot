// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PortfolioStep, { type PortfolioItem } from '@/components/onboarding/PortfolioStep'

// Controlled wrapper so onChange updates re-render the component, as in real usage.
function Harness({ initial = [] }: { initial?: PortfolioItem[] }) {
  const [items, setItems] = useState<PortfolioItem[]>(initial)
  return <PortfolioStep items={items} onChange={setItems} />
}

const emptyItem = (over: Partial<PortfolioItem> = {}): PortfolioItem => ({
  name: '', description: '', stack: [], result: '', ...over,
})

describe('PortfolioStep', () => {
  it('shows the empty state and adds the first project on click', () => {
    render(<Harness />)
    const prompt = screen.getByText('Add a project to strengthen your proposals')
    fireEvent.click(prompt)
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('caps the project list at five and hides the add button at the limit', () => {
    render(<Harness initial={Array.from({ length: 4 }, () => emptyItem())} />)
    fireEvent.click(screen.getByRole('button', { name: /add project/i }))
    expect(screen.getByText('Project 5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add project/i })).not.toBeInTheDocument()
  })

  it('edits a field through the onChange round-trip', () => {
    render(<Harness initial={[emptyItem()]} />)
    const nameInput = screen.getByPlaceholderText('RAG document search engine')
    fireEvent.change(nameInput, { target: { value: 'Vector search' } })
    expect((nameInput as HTMLInputElement).value).toBe('Vector search')
  })

  it('removes a project', () => {
    render(<Harness initial={[emptyItem(), emptyItem()]} />)
    expect(screen.getByText('Project 2')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Remove project 1'))
    expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
  })

  it('adds tech-stack tags on Enter and de-duplicates them', () => {
    render(<Harness initial={[emptyItem()]} />)
    const stack = screen.getByPlaceholderText('LangChain, pgvector…')

    fireEvent.change(stack, { target: { value: 'PyTorch' } })
    fireEvent.keyDown(stack, { key: 'Enter' })
    fireEvent.change(stack, { target: { value: 'PyTorch' } })
    fireEvent.keyDown(stack, { key: 'Enter' })

    expect(screen.getAllByText('PyTorch')).toHaveLength(1)
  })

  it('removes the last tag on Backspace when the input is empty', () => {
    render(<Harness initial={[emptyItem({ stack: ['PyTorch', 'CUDA'] })]} />)
    const stack = screen.getAllByRole('textbox').at(-1)! // the stack input is last in the card
    fireEvent.keyDown(stack, { key: 'Backspace' })
    expect(screen.queryByText('CUDA')).not.toBeInTheDocument()
    expect(screen.getByText('PyTorch')).toBeInTheDocument()
  })
})
