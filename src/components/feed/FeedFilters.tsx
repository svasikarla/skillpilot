'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { JobCardData } from './JobCard'

export interface Filters {
  search:      string
  minMatch:    number
  minRel:      number
  maxRateMin:  number    // lower bound on rateMin (filter jobs below this)
  platform:    string
  nearMissOnly: boolean
  postedDays:  number   // 0 = any
}

const DEFAULT_FILTERS: Filters = {
  search:       '',
  minMatch:     0,
  minRel:       0,
  maxRateMin:   0,
  platform:     '',
  nearMissOnly: false,
  postedDays:   0,
}

interface Props {
  jobs:      JobCardData[]
  platforms: Array<{ id: number; name: string }>
  onChange:  (filtered: JobCardData[]) => void
}

function applyFilters(jobs: JobCardData[], f: Filters): JobCardData[] {
  return jobs.filter(j => {
    if (f.search) {
      const q = f.search.toLowerCase()
      const hay = `${j.title} ${j.company ?? ''} ${(j.extractedSkills ?? []).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (f.minMatch  > 0 && (j.matchScore ?? 0) < f.minMatch)           return false
    if (f.minRel    > 0 && (j.reliabilityScore ?? 0) < f.minRel)       return false
    if (f.platform  && j.platform?.name !== f.platform)                 return false
    if (f.nearMissOnly && !j.isNearMiss)                                return false
    if (f.postedDays > 0 && j.postedAt) {
      const age = (Date.now() - new Date(j.postedAt).getTime()) / 86_400_000
      if (age > f.postedDays) return false
    }
    return true
  })
}

export default function FeedFilters({ jobs, platforms, onChange }: Props) {
  const [f, setF] = useState<Filters>(DEFAULT_FILTERS)

  const update = useCallback((patch: Partial<Filters>) => {
    const next = { ...f, ...patch }
    setF(next)
    onChange(applyFilters(jobs, next))
  }, [f, jobs, onChange])

  const activeCount = Object.entries(f).filter(([k, v]) => {
    if (k === 'search') return v !== ''
    if (k === 'nearMissOnly') return v === true
    return v !== 0 && v !== ''
  }).length

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Input
        placeholder="Search title, company, skill…"
        className="h-8 w-52 text-xs"
        value={f.search}
        onChange={e => update({ search: e.target.value })}
      />

      <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

      <Select value={f.minMatch.toString()} onValueChange={v => v !== null && update({ minMatch: parseInt(v) })}>
        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Min match" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any match</SelectItem>
          <SelectItem value="50">50%+ match</SelectItem>
          <SelectItem value="70">70%+ match</SelectItem>
          <SelectItem value="85">85%+ match</SelectItem>
        </SelectContent>
      </Select>

      <Select value={f.minRel.toString()} onValueChange={v => v !== null && update({ minRel: parseInt(v) })}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Min reliability" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any reliability</SelectItem>
          <SelectItem value="40">Verify+ (40+)</SelectItem>
          <SelectItem value="70">Trusted (70+)</SelectItem>
        </SelectContent>
      </Select>

      <Select value={f.platform} onValueChange={v => update({ platform: v === null || v === '_all' ? '' : v })}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Platform" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All platforms</SelectItem>
          {platforms.map(p => (
            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={f.postedDays.toString()} onValueChange={v => v !== null && update({ postedDays: parseInt(v) })}>
        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Posted" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Any time</SelectItem>
          <SelectItem value="1">Today</SelectItem>
          <SelectItem value="7">This week</SelectItem>
          <SelectItem value="14">2 weeks</SelectItem>
        </SelectContent>
      </Select>

      <Badge
        variant={f.nearMissOnly ? 'default' : 'outline'}
        className="cursor-pointer text-xs h-8 px-3 flex items-center gap-1.5 select-none hover:opacity-80 transition-opacity"
        onClick={() => update({ nearMissOnly: !f.nearMissOnly })}
      >
        {f.nearMissOnly && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground inline-block" />}
        Near Miss
      </Badge>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => { setF(DEFAULT_FILTERS); onChange(jobs) }}
        >
          Clear
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
            {activeCount}
          </span>
        </Button>
      )}
    </div>
  )
}
