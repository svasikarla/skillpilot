import { useState, useCallback } from 'react'

export function useSuccessState(durationMs = 1800) {
  const [success, setSuccess] = useState(false)

  const trigger = useCallback(() => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), durationMs)
  }, [durationMs])

  return [success, trigger] as const
}
