import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn()', () => {
  it('returns a string', () => {
    expect(typeof cn('a')).toBe('string')
  })

  it('concatenates simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting tailwind classes (last wins)', () => {
    // tailwind-merge removes the first conflicting padding
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('removes conflicting text-size classes', () => {
    const result = cn('text-sm', 'text-lg')
    expect(result).toBe('text-lg')
  })

  it('handles conditional classes via clsx', () => {
    expect(cn('base', false && 'skipped', 'kept')).toBe('base kept')
  })

  it('handles object syntax from clsx', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })

  it('handles array input', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('handles empty input gracefully', () => {
    expect(cn()).toBe('')
  })

  it('handles undefined and null without crashing', () => {
    expect(() => cn(undefined, null as unknown as string, 'x')).not.toThrow()
    expect(cn(undefined, null as unknown as string, 'x')).toContain('x')
  })

  it('preserves non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'gap-4')
    expect(result).toBe('flex items-center gap-4')
  })

  it('merges complex combinations correctly', () => {
    const result = cn('bg-red-500 hover:bg-red-600', 'bg-blue-500')
    // bg-blue-500 should override bg-red-500; hover stays
    expect(result).toContain('bg-blue-500')
    expect(result).toContain('hover:bg-red-600')
    expect(result).not.toContain('bg-red-500 ')
  })
})
