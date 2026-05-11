'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import ReliabilityBadge from '@/components/feed/ReliabilityBadge'
import { SIGNAL_LABELS } from '@/lib/reliability'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface AdminJob {
  id:                 string
  title:              string
  company:            string | null
  descriptionExcerpt: string | null
  sourceUrl:          string
  postedAt:           string | null
  ingestedAt:         string | null
  reliabilityScore:   number | null
  reliabilitySignals: Record<string, number> | null
  extractedSkills:    string[] | null
  status:             string | null
  platform:           { name: string; trustTier: number | null } | null
}

interface Props {
  jobs: AdminJob[]
}

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100  text-green-800',
  2: 'bg-blue-100   text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
}

export default function AdminJobsClient({ jobs: initial }: Props) {
  const [jobs, setJobs]       = useState(initial)
  const [detail, setDetail]   = useState<AdminJob | null>(null)
  const [loading, setLoading] = useState<Set<string>>(new Set())

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    setLoading(prev => new Set(prev).add(id))
    const supabase = createClient()
    const { error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)

    if (error) {
      toast.error(`Failed to ${status === 'approved' ? 'approve' : 'reject'} job`)
    } else {
      setJobs(prev => prev.filter(j => j.id !== id))
      if (detail?.id === id) setDetail(null)
      toast.success(status === 'approved' ? 'Job approved' : 'Job rejected')
    }
    setLoading(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function bulkApprove() {
    const eligible = jobs.filter(j => (j.reliabilityScore ?? 0) >= 70)
    if (!eligible.length) { toast.info('No jobs with score ≥ 70'); return }

    const supabase = createClient()
    const ids = eligible.map(j => j.id)
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'approved' })
      .in('id', ids)

    if (error) {
      toast.error('Bulk approve failed')
    } else {
      setJobs(prev => prev.filter(j => !ids.includes(j.id)))
      toast.success(`Approved ${ids.length} jobs`)
    }
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 pb-4">
        <Button onClick={bulkApprove} variant="default" size="sm">
          Bulk approve ≥ 70
        </Button>
        <span className="text-sm text-muted-foreground">{jobs.length} shown</span>
      </div>

      {jobs.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>Queue is empty — all jobs processed.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => {
            const rel   = job.reliabilityScore ?? 50
            const tier  = job.platform?.trustTier ?? 0
            const busy  = loading.has(job.id)

            return (
              <div
                key={job.id}
                className="flex items-start gap-3 p-4 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Score column */}
                <div className="w-20 shrink-0 flex flex-col items-center pt-1">
                  <span className={`text-2xl font-bold ${rel >= 70 ? 'text-green-600' : rel >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {rel}
                  </span>
                  <span className="text-[10px] text-muted-foreground">reliability</span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <button
                      className="text-sm font-medium hover:underline text-left"
                      onClick={() => setDetail(job)}
                    >
                      {job.title}
                    </button>
                    {job.platform && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TIER_COLORS[tier] ?? 'bg-muted text-muted-foreground'}`}>
                        {job.platform.name}
                      </span>
                    )}
                  </div>
                  {job.company && (
                    <p className="text-xs text-muted-foreground">{job.company}</p>
                  )}
                  {job.descriptionExcerpt && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.descriptionExcerpt}</p>
                  )}
                  {job.extractedSkills?.length ? (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {job.extractedSkills.slice(0, 5).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] py-0 px-1.5">{s}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 mt-0.5">
                  <Button
                    size="sm" variant="outline"
                    className="text-xs h-7"
                    onClick={() => setStatus(job.id, 'approved')}
                    disabled={busy}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="text-xs h-7 text-destructive hover:text-destructive"
                    onClick={() => setStatus(job.id, 'rejected')}
                    disabled={busy}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!detail} onOpenChange={open => { if (!open) setDetail(null) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader className="pb-3">
                <SheetTitle className="text-base pr-8">{detail.title}</SheetTitle>
                {detail.company && <p className="text-sm text-muted-foreground">{detail.company}</p>}
              </SheetHeader>

              <div className="py-3 border-y flex items-center gap-3">
                <ReliabilityBadge
                  score={detail.reliabilityScore ?? 50}
                  signals={detail.reliabilitySignals ?? {}}
                  size="md"
                />
                <a
                  href={detail.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View source ↗
                </a>
              </div>

              <div className="mt-4 space-y-4">
                {/* Signal breakdown */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium">Reliability signals</p>
                  {Object.entries(detail.reliabilitySignals ?? {}).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{SIGNAL_LABELS[k] ?? k}</span>
                      <span className={v > 0 ? 'text-green-600' : 'text-red-500'}>
                        {v > 0 ? '+' : ''}{v}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {detail.descriptionExcerpt && (
                  <div>
                    <p className="text-xs font-medium mb-1">Description excerpt</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.descriptionExcerpt}</p>
                  </div>
                )}

                {/* Skills */}
                {detail.extractedSkills?.length ? (
                  <div>
                    <p className="text-xs font-medium mb-1">Extracted skills</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.extractedSkills.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Approve / Reject buttons in drawer */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => setStatus(detail.id, 'approved')}
                    disabled={loading.has(detail.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => setStatus(detail.id, 'rejected')}
                    disabled={loading.has(detail.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
