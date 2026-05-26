'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, ShieldX, CheckCircle2, Flag } from 'lucide-react'
import { toast } from 'sonner'

type Report = { job_id: string; title: string; platform: string; url: string | null; count: number; reasons: string[] }

export default function AdminReportsClient({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState(initial)

  async function resolve(jobId: string, action: 'dismiss' | 'reject') {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, action }),
    })
    if (res.ok) {
      setReports(r => r.filter(x => x.job_id !== jobId))
      toast.success(action === 'reject' ? 'Job rejected and hidden' : 'Reports dismissed')
    } else toast.error('Failed')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Scam Reports</h1>
        <p className="page-subheader">{reports.length} job{reports.length !== 1 ? 's' : ''} flagged by members</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mx-auto mb-3" />
          <p className="font-medium">No open reports</p>
          <p className="text-sm text-muted-foreground mt-1">All scam reports have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.job_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.title}</span>
                    <span className="text-xs font-medium text-primary">{r.platform}</span>
                    <Badge variant="destructive" className="text-xs gap-0.5">
                      <Flag className="h-2.5 w-2.5" />{r.count} report{r.count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {r.reasons.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {r.reasons.map((reason, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-muted-foreground/50">·</span>{reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs"
                  onClick={() => resolve(r.job_id, 'reject')}>
                  <ShieldX className="h-3.5 w-3.5" />Reject &amp; hide job
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs"
                  onClick={() => resolve(r.job_id, 'dismiss')}>
                  <CheckCircle2 className="h-3.5 w-3.5" />Dismiss reports
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
