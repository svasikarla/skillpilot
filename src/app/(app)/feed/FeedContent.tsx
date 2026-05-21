'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import JobCard from '@/components/JobCard'
import { Search, X, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Job = {
  id: string; title: string; company: string | null; description: string | null
  platform: string; url: string | null; skills: string[]; location: string
  rate_min: number | null; rate_max: number | null; posted_at: string
  reliability_score?: number; match_score?: number; matched_skills?: string[]
}

export default function FeedContent({ userSkills }: { userSkills: string[] }) {
  const [jobs, setJobs]           = useState<Job[]>([])
  const [loading, setLoading]     = useState(true)
  const [query, setQuery]         = useState('')
  const [activeSkill, setActiveSkill] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [savedJobIds, setSavedJobIds]   = useState<Set<string>>(new Set())

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query)       params.set('q', query)
    if (activeSkill) params.set('skill', activeSkill)
    if (verifiedOnly) params.set('verified', '1')
    const res  = await fetch(`/api/jobs?${params}`)
    const data = await res.json()
    setJobs(data.jobs ?? [])
    setLoading(false)
  }, [query, activeSkill, verifiedOnly])

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

  const topSkills = userSkills.slice(0, 8)

  return (
    <div className="space-y-6">
      {/* Page header */}
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
        <Input
          placeholder="Search by title, company, or keyword…"
          className="pl-9 h-10 bg-card border-border focus:border-primary/50"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />Filter:
        </div>
        {topSkills.map(skill => (
          <Badge
            key={skill}
            variant={activeSkill === skill ? 'default' : 'outline'}
            className={cn('cursor-pointer text-xs h-6 px-2.5 transition-colors',
              activeSkill === skill ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/40 hover:text-primary')}
            onClick={() => setActiveSkill(activeSkill === skill ? null : skill)}
          >
            {skill}
          </Badge>
        ))}
        <Button
          variant={verifiedOnly ? 'default' : 'outline'}
          size="sm"
          className={cn('h-6 px-2.5 text-xs gap-1.5 ml-auto',
            verifiedOnly ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' : 'hover:border-emerald-500/40 hover:text-emerald-700')}
          onClick={() => setVerifiedOnly(v => !v)}
        >
          <ShieldCheck className="h-3.5 w-3.5" />Verified
        </Button>
        {(activeSkill || verifiedOnly) && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
            onClick={() => { setActiveSkill(null); setVerifiedOnly(false) }}>
            <X className="h-3 w-3 mr-1" />Clear
          </Button>
        )}
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
          <p className="text-sm text-muted-foreground mt-1">Try different keywords or clear filters.</p>
          <div className="flex justify-center gap-3 mt-4">
            <a href="/api/cron/ingest" className="text-xs text-primary underline">Run ingestion</a>
            <span className="text-muted-foreground text-xs">·</span>
            <a href="/api/seed" className="text-xs text-primary underline">Load sample data</a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} userSkills={userSkills}
              isSaved={savedJobIds.has(job.id)} onSave={() => saveJob(job.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
