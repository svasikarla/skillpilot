import { describe, it, expect } from 'vitest'
import { formatRate } from '@/lib/utils'
import { inferEmploymentType } from '@/lib/ingest/types'

describe('formatRate', () => {
  it('returns null when no rate data', () => {
    expect(formatRate(null, null, 'hourly')).toBeNull()
  })

  it('formats hourly ranges with /hr', () => {
    expect(formatRate(80, 120, 'hourly')).toBe('$80–$120/hr')
    expect(formatRate(80, null, 'hourly')).toBe('From $80/hr')
    expect(formatRate(null, 120, 'hourly')).toBe('Up to $120/hr')
  })

  it('defaults to hourly when rate_type is missing (pre-migration rows)', () => {
    expect(formatRate(80, 120, undefined)).toBe('$80–$120/hr')
  })

  it('formats fixed budgets as a total with thousands separators', () => {
    expect(formatRate(750, 1500, 'fixed')).toBe('$750–$1,500 budget')
    expect(formatRate(500, null, 'fixed')).toBe('From $500 budget')
  })
})

describe('inferEmploymentType – project-work signals', () => {
  it('classifies fixed-price and milestone language as contract', () => {
    expect(inferEmploymentType('ML model tuning', 'Fixed price project, milestone payment on delivery')).toBe('contract')
    expect(inferEmploymentType('Data pipeline', 'Work under a statement of work with our team')).toBe('contract')
  })

  it('classifies benefits-heavy postings as full-time', () => {
    expect(inferEmploymentType('ML Engineer', 'Base salary plus health insurance and dental')).toBe('full_time')
  })
})
