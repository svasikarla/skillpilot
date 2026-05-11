'use client'

import { useState, useCallback } from 'react'
import JobCard, { type JobCardData } from '@/components/feed/JobCard'
import FeedFilters from '@/components/feed/FeedFilters'
import JobDetailPanel from '@/components/feed/JobDetailPanel'

interface Props {
  initialJobs: JobCardData[]
  platforms:   Array<{ id: number; name: string; trustTier: number | null }>
  userId:      string
}

export default function FeedClient({ initialJobs, platforms, userId }: Props) {
  const [filtered, setFiltered]     = useState<JobCardData[]>(initialJobs)
  const [activeJob, setActiveJob]   = useState<JobCardData | null>(null)

  const handleFilter = useCallback((result: JobCardData[]) => {
    setFiltered(result)
  }, [])

  return (
    <>
      <FeedFilters
        jobs={initialJobs}
        platforms={platforms.map(p => ({ id: p.id, name: p.name }))}
        onChange={handleFilter}
      />

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-base">No jobs match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => setActiveJob(job)}
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
