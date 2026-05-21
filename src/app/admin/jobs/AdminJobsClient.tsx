'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { tierFromScore, tierLabel } from '@/lib/reliability'

type Job = {
  id: string
  title: string
  company: string | null
  platform: string
  status: string
  reliability_score: number
  reliability_flags: string[]
  posted_at: string
  url: string | null
  source: string | null
}

function ReliabilityBadge({ score }: { score: number }) {
  const tier = tierFromScore(score)
  const colors = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-yellow-100 text-yellow-800', red: 'bg-red-100 text-red-800' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[tier]}`}>
      {score} · {tierLabel(tier)}
    </span>
  )
}

export function AdminJobsClient({ jobs }: { jobs: Job[] }) {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(jobs.map(j => [j.id, j.status]))
  )
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setLoading(p => ({ ...p, [id]: true }))
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setStatuses(p => ({ ...p, [id]: status }))
      toast.success(`Job ${status}`)
    } else {
      toast.error('Failed to update')
    }
    setLoading(p => ({ ...p, [id]: false }))
  }

  async function bulkApprove() {
    const pending = jobs.filter(j => statuses[j.id] === 'pending' && j.reliability_score >= 60)
    if (pending.length === 0) { toast.info('No pending jobs with score ≥ 60'); return }
    await Promise.all(pending.map(j => updateStatus(j.id, 'approved')))
    toast.success(`Bulk approved ${pending.length} jobs`)
  }

  if (jobs.length === 0) {
    return <p className="text-muted-foreground text-sm py-8 text-center">No jobs in this view.</p>
  }

  return (
    <div className="space-y-3">
      {jobs.some(j => statuses[j.id] === 'pending') && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={bulkApprove}>
            Bulk approve all pending (score ≥ 60)
          </Button>
        </div>
      )}

      {jobs.map(job => (
        <div key={job.id} className="border rounded-lg p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{job.title}</span>
              <Badge variant="outline" className="text-xs">{job.platform}</Badge>
              {job.source && <Badge variant="outline" className="text-xs text-muted-foreground">{job.source}</Badge>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {job.company && <span>{job.company}</span>}
              <span>{new Date(job.posted_at).toLocaleDateString()}</span>
              <ReliabilityBadge score={job.reliability_score ?? 50} />
              {(job.reliability_flags ?? []).slice(0, 2).map(f => (
                <span key={f} className="text-muted-foreground">{f}</span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-muted rounded">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}

            {statuses[job.id] === 'pending' ? (
              <>
                <Button size="sm" variant="outline" disabled={loading[job.id]}
                  onClick={() => updateStatus(job.id, 'approved')}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" disabled={loading[job.id]}
                  onClick={() => updateStatus(job.id, 'rejected')}
                  className="text-red-700 border-red-300 hover:bg-red-50">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </>
            ) : (
              <Badge variant={statuses[job.id] === 'approved' ? 'default' : 'destructive'} className="capitalize">
                {statuses[job.id]}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
