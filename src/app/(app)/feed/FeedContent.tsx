'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import JobCard from '@/components/JobCard'
import JobDetailSheet from '@/components/feed/JobDetailSheet'
import { Search, X, ShieldCheck, SlidersHorizontal, Eye, Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type Job = {
  id: string; title: string; company: string | null; description: string | null
  platform: string; url: string | null; skills: string[]; location: string
  rate_min: number | null; rate_max: number | null; posted_at: string
  rate_type?: 'hourly' | 'fixed'; duration?: string | null
  employment_type?: 'contract' | 'full_time' | 'unknown'
  reliability_score?: number; reliability_signals?: Record<string, boolean>
  match_score?: number; matched_skills?: string[]
  skill_score?: number; rate_score?: number; recency_score?: number
}

type EmploymentFilter = 'contract' | 'full_time' | 'all'
const TYPE_OPTIONS: Array<{ value: EmploymentFilter; label: string }> = [
  { value: 'contract',  label: 'Contract / Freelance' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'all',       label: 'All types' },
]

const MATCH_OPTIONS = [
  { label: 'Any match', value: '' },
  { label: '70%+ (apply-ready)', value: '70' },
  { label: '45–69% (stretch)', value: 'near_miss' },
  { label: '50%+', value: '50' },
]

const DAYS_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 14 days', value: '14' },
  { label: 'Last 30 days', value: '30' },
]

export default function FeedContent({ userSkills }: { userSkills: string[] }) {
  const [jobs, setJobs]             = useState<Job[]>([])
  const [loading, setLoading]       = useState(true)
  const [query, setQuery]           = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [showHidden, setShowHidden]     = useState(false)
  const [matchFilter, setMatchFilter]   = useState('')
  const [daysFilter, setDaysFilter]     = useState('')
  const [rateMin, setRateMin]           = useState('')
  const [rateMax, setRateMax]           = useState('')
  const [savedJobIds, setSavedJobIds]   = useState<Set<string>>(new Set())

  const [platformFilter, setPlatformFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<EmploymentFilter>('contract')
  const [detailJob, setDetailJob]           = useState<Job | null>(null)
  const [proposalJobId, setProposalJobId]   = useState<string | null>(null)
  const initialised = useRef(false)

  // Read ?platform= from URL on first mount
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    const params = new URLSearchParams(window.location.search)
    const p = params.get('platform')
    if (p) setPlatformFilter(p)
  }, [])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query)                    params.set('q', query)
    if (activeSkill)              params.set('skill', activeSkill)
    if (platformFilter)           params.set('platform', platformFilter)
    if (verifiedOnly)             params.set('verified', '1')
    if (showHidden)               params.set('show_hidden', '1')
    if (daysFilter)               params.set('days', daysFilter)
    if (rateMin)                  params.set('rate_min', rateMin)
    if (rateMax)                  params.set('rate_max', rateMax)
    if (matchFilter === 'near_miss') { params.set('near_miss', '1') }
    else if (matchFilter)         params.set('match_min', matchFilter)
    params.set('employment_type', typeFilter)

    const res  = await fetch(`/api/jobs?${params}`)
    const data = await res.json()
    setJobs(data.jobs ?? [])
    setLoading(false)
  }, [query, activeSkill, verifiedOnly, showHidden, daysFilter, rateMin, rateMax, matchFilter, platformFilter, typeFilter])

  useEffect(() => {
    const id = setTimeout(fetchJobs, 280)
    return () => clearTimeout(id)
  }, [fetchJobs])

  async function saveJob(jobId: string) {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status: 'saved' }),
    })
    if (res.ok) setSavedJobIds(prev => new Set([...prev, jobId]))
  }

  const hasFilters = !!(activeSkill || verifiedOnly || showHidden || matchFilter || daysFilter || rateMin || rateMax || platformFilter)
  const topSkills = userSkills.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="page-header">Job Feed</h1>
          <p className="page-subheader">Ranked by match to your skills, rate, and recency.</p>
        </div>
        {!loading && jobs.length > 0 && (
          <p className="text-xs text-muted-foreground">{jobs.length} gig{jobs.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative focus-glow rounded-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by title, company, or keyword…"
          className="pl-9 h-10 bg-card border-border focus:border-primary/50"
          value={query} onChange={e => setQuery(e.target.value)} />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Employment-type segmented control */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setTypeFilter(opt.value)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-md transition-colors',
              typeFilter === opt.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Platform filter badge (set from URL) */}
      {platformFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered to:</span>
          <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
            {platformFilter}
            <button onClick={() => setPlatformFilter('')} className="hover:text-destructive">×</button>
          </Badge>
        </div>
      )}

      {/* Skill quick-filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />Skills:
        </div>
        {topSkills.map(skill => (
          <Badge key={skill} variant={activeSkill === skill ? 'default' : 'outline'}
            className={cn('cursor-pointer text-xs h-6 px-2.5 transition-colors',
              activeSkill === skill
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:border-primary/40 hover:text-primary')}
            onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}>
            {skill}
          </Badge>
        ))}
      </div>

      {/* Advanced filters — desktop inline, mobile sheet */}
      <div className="flex items-center gap-2">
        {/* Desktop filters (hidden on mobile) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 flex-1">
          <Button variant={verifiedOnly ? 'default' : 'outline'} size="sm"
            className={cn('h-7 px-2.5 text-xs gap-1.5',
              verifiedOnly ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' : 'hover:border-emerald-500/40 hover:text-emerald-700')}
            onClick={() => setVerifiedOnly(v => !v)}>
            <ShieldCheck className="h-3.5 w-3.5" />Verified
          </Button>
          <Button variant={showHidden ? 'default' : 'outline'} size="sm"
            className={cn('h-7 px-2.5 text-xs gap-1.5',
              showHidden ? 'bg-amber-600 hover:bg-amber-700 border-amber-600' : 'hover:border-amber-400/40 hover:text-amber-700')}
            onClick={() => setShowHidden(v => !v)}>
            <Eye className="h-3.5 w-3.5" />Show hidden
          </Button>
          <Select value={matchFilter} onValueChange={v => setMatchFilter(v ?? '')}>
            <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Match score…" /></SelectTrigger>
            <SelectContent>{MATCH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={daysFilter} onValueChange={v => setDaysFilter(v ?? '')}>
            <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Posted…" /></SelectTrigger>
            <SelectContent>{DAYS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input placeholder="$min" className="h-7 w-16 text-xs" type="number" value={rateMin} onChange={e => setRateMin(e.target.value)} />
            <span className="text-xs text-muted-foreground">–</span>
            <Input placeholder="$max" className="h-7 w-16 text-xs" type="number" value={rateMax} onChange={e => setRateMax(e.target.value)} />
            <span className="text-xs text-muted-foreground">/hr</span>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={() => { setActiveSkill(null); setVerifiedOnly(false); setShowHidden(false); setMatchFilter(''); setDaysFilter(''); setRateMin(''); setRateMax(''); setPlatformFilter('') }}>
              <X className="h-3 w-3 mr-1" />Clear all
            </Button>
          )}
        </div>

        {/* Mobile: filter sheet trigger */}
        <Sheet>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className={cn('md:hidden h-8 gap-1.5 text-xs', hasFilters && 'border-primary text-primary')} />}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters {hasFilters && `(${[verifiedOnly, showHidden, matchFilter, daysFilter, rateMin, rateMax].filter(Boolean).length})`}
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl pb-8">
            <SheetHeader className="mb-4">
              <SheetTitle className="text-sm">Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant={verifiedOnly ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5 text-xs"
                  onClick={() => setVerifiedOnly(v => !v)}>
                  <ShieldCheck className="h-3.5 w-3.5" />Verified only
                </Button>
                <Button variant={showHidden ? 'default' : 'outline'} size="sm" className="flex-1 gap-1.5 text-xs"
                  onClick={() => setShowHidden(v => !v)}>
                  <Eye className="h-3.5 w-3.5" />Show hidden
                </Button>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Match score</label>
                <Select value={matchFilter} onValueChange={v => setMatchFilter(v ?? '')}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Any match" /></SelectTrigger>
                  <SelectContent>{MATCH_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Posted within</label>
                <Select value={daysFilter} onValueChange={v => setDaysFilter(v ?? '')}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Any time" /></SelectTrigger>
                  <SelectContent>{DAYS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Hourly rate</label>
                <div className="flex items-center gap-2">
                  <Input placeholder="$min" className="text-sm" type="number" value={rateMin} onChange={e => setRateMin(e.target.value)} />
                  <span className="text-muted-foreground">–</span>
                  <Input placeholder="$max" className="text-sm" type="number" value={rateMax} onChange={e => setRateMax(e.target.value)} />
                  <span className="text-sm text-muted-foreground">/hr</span>
                </div>
              </div>
              {hasFilters && (
                <Button variant="outline" className="w-full gap-1.5"
                  onClick={() => { setActiveSkill(null); setVerifiedOnly(false); setShowHidden(false); setMatchFilter(''); setDaysFilter(''); setRateMin(''); setRateMax(''); setPlatformFilter('') }}>
                  <X className="h-4 w-4" />Clear all filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse border-l-4 border-l-border" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-foreground">No gigs found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {typeFilter === 'contract'
              ? 'No contract or freelance listings match your filters. Try "All types" or widen filters.'
              : 'Try different keywords or clear filters.'}
          </p>
          <div className="flex justify-center gap-3 mt-4 flex-wrap">
            {typeFilter !== 'all' && (
              <button onClick={() => setTypeFilter('all')} className="text-xs text-primary underline">
                Show all types
              </button>
            )}
            <a href="/api/cron/ingest" className="text-xs text-primary underline">Run ingestion</a>
            <span className="text-muted-foreground text-xs">·</span>
            <a href="/api/seed" className="text-xs text-primary underline">Load sample data</a>
          </div>
        </div>
      ) : (
        <>
          {/* New-user nudge: jobs exist but all have 0% match (incomplete profile) */}
          {jobs.length > 0 && jobs.every(j => (j.match_score ?? 0) === 0) && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Complete your profile to see match scores</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Jobs are loading but your skill profile is empty — match scores will all show 0% until you add skills.
                </p>
                <a href="/settings" className="inline-block mt-2 text-xs text-primary underline underline-offset-2">
                  Add your skills →
                </a>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} userSkills={userSkills}
                isSaved={savedJobIds.has(job.id)}
                onSave={() => saveJob(job.id)}
                onViewDetails={() => setDetailJob(job)}
                proposalOpen={proposalJobId === job.id}
                onProposalToggle={() => setProposalJobId(p => p === job.id ? null : job.id)}
              />
            ))}
          </div>
        </>
      )}

      <JobDetailSheet
        job={detailJob}
        open={!!detailJob}
        onClose={() => setDetailJob(null)}
        userSkills={userSkills}
        onProposal={() => {
          if (detailJob) { setProposalJobId(detailJob.id); setDetailJob(null) }
        }}
      />
    </div>
  )
}
