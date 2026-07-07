import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Human-readable pay label. Hourly listings read "$80–$120/hr"; fixed-budget
 * projects (marketplace gigs) read "$500–$1,500 budget". Null when no rate data.
 */
export function formatRate(
  rateMin: number | null,
  rateMax: number | null,
  rateType: 'hourly' | 'fixed' | null | undefined,
): string | null {
  if (!rateMin && !rateMax) return null
  const fmt = (n: number) => `$${n.toLocaleString('en-US')}`
  const range =
    rateMin && rateMax ? `${fmt(rateMin)}–${fmt(rateMax)}`
    : rateMin ? `From ${fmt(rateMin)}`
    : `Up to ${fmt(rateMax!)}`
  return rateType === 'fixed' ? `${range} budget` : `${range}/hr`
}
