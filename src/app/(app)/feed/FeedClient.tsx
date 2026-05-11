'use client'

import { useState, useCallback } from 'react'
import { LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import JobCard, { type JobCardData } from '@/components/feed/JobCard'
import FeedFilters from '@/components/feed/FeedFilters'
import JobDetailPanel from '@/components/feed/JobDetailPanel'

interface Props {
  initialJobs: JobCardData[]
  platforms:   Array<{ id: number; name: string; trustTier: number | null }>
  userId:      string
}

export default function FeedClient({ initialJobs, platforms, userId }: Props) {
  const [filtered,  setFiltered]  = useState<JobCardData[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<JobCardData | null>(null)

  const handleFilter = useCallback((result: JobCardData[]) => {
    setFiltered(result)
  }, [])

  const handleCardClick = useCallback((job: JobCardData) => {
    setActiveJob(prev => prev?.id === job.id ? null : job)
  }, [])

  return (
    <>
      <FeedFilters
        jobs={initialJobs}
        platforms={platforms.map(p => ({ id: p.id, name: p.name }))}
        onChange={handleFilter}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <LayoutDashboard className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No jobs match your filters</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try widening your criteria or{' '}
              <Link href="/roadmap" className="text-primary hover:underline">check your roadmap</Link>
              {' '}to unlock more matches.
            </p>
          </div>
          <a
            href="#"
            onClick={e => { e.preventDefault(); setFiltered(initialJobs) }}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Clear all filters
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isActive={activeJob?.id === job.id}
              onClick={() => handleCardClick(job)}
            />
          ))}
        </div>
      )}

      <JobDetailPanel
        job={activeJob}
        userId={userId}
        onClose={() => setActiveJob(null)}
      />
    </>
  )
}
