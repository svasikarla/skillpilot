// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSuccessState } from '@/lib/use-success-state'

describe('useSuccessState', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts with success = false', () => {
    const { result } = renderHook(() => useSuccessState())
    expect(result.current[0]).toBe(false)
  })

  it('trigger sets success to true', () => {
    const { result } = renderHook(() => useSuccessState())
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
  })

  it('resets to false after the default 1800 ms', () => {
    const { result } = renderHook(() => useSuccessState())
    act(() => result.current[1]())
    expect(result.current[0]).toBe(true)
    act(() => vi.advanceTimersByTime(1800))
    expect(result.current[0]).toBe(false)
  })

  it('stays true just before the duration elapses', () => {
    const { result } = renderHook(() => useSuccessState(500))
    act(() => result.current[1]())
    act(() => vi.advanceTimersByTime(499))
    expect(result.current[0]).toBe(true)
  })

  it('resets after a custom duration', () => {
    const { result } = renderHook(() => useSuccessState(500))
    act(() => result.current[1]())
    act(() => vi.advanceTimersByTime(500))
    expect(result.current[0]).toBe(false)
  })

  it('trigger function is stable across renders', () => {
    const { result, rerender } = renderHook(() => useSuccessState(1000))
    const firstTrigger = result.current[1]
    rerender()
    expect(result.current[1]).toBe(firstTrigger)
  })
})
