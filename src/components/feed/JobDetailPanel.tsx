'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import ReliabilityBadge from './ReliabilityBadge'
import MatchBadge from './MatchBadge'
import { SIGNAL_LABELS } from '@/lib/reliability'
import { MATCH_WEIGHTS } from '@/lib/config'
import type { JobCardData } from './JobCard'
import { toast } from 'sonner'

interface Props {
  job:     JobCardData | null
  userId:  string | null
  onClose: () => void
}

function ScoreBar({ label, weight }: { label: string; weight: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{Math.round(weight * 100)}% weight</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${weight * 100}%`, opacity: 0.55 }}
        />
      </div>
    </div>
  )
}

export default function JobDetailPanel({ job, userId, onClose }: Props) {
  const [reporting,    setReporting]    = useState(false)
  const [tips,         setTips]         = useState<string[] | null>(null)
  const [tipsLoading,  setTipsLoading]  = useState(false)
  const [tipsError,    setTipsError]    = useState<string | null>(null)

  if (!job) return null

  const rel              = job.reliabilityScore ?? 50
  const sigs             = job.reliabilitySignals ?? {}
  const positiveSignals  = Object.entries(sigs).filter(([, v]) => v > 0).map(([k]) => SIGNAL_LABELS[k] ?? k)
  const negativeSignals  = Object.entries(sigs).filter(([, v]) => v < 0).map(([k]) => SIGNAL_LABELS[k] ?? k)

  async function reportScam() {
    if (!userId) return
    setReporting(true)
    const res = await fetch(`/api/jobs/${job!.id}/report`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: 'Reported by member as suspicious' }),
    })
    const data = await res.json() as { error?: string }
    if (!res.ok) toast.error(data.error ?? 'Could not submit report')
    else toast.success('Report submitted — thank you')
    setReporting(false)
  }

  async function loadStandoutTips() {
    if (tips || tipsLoading) return
    setTipsLoading(true)
    setTipsError(null)
    try {
      const res = await fetch(`/api/jobs/${job!.id}/standout`)
      const data = await res.json() as { tips?: string[]; error?: string }
      if (!res.ok) { setTipsError(data.error ?? 'Failed'); return }
      setTips(data.tips ?? [])
    } catch {
      setTipsError('Network error — please try again')
    } finally {
      setTipsLoading(false)
    }
  }

  return (
    <Sheet open={!!job} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-base leading-snug pr-8">{job.title}</SheetTitle>
          {job.company && <p className="text-sm text-muted-foreground">{job.company}</p>}
        </SheetHeader>

        {/* Score row */}
        <div className="flex items-center gap-3 py-3 border-y">
          {job.matchScore !== null && (
            <MatchBadge score={job.matchScore} isNearMiss={job.isNearMiss ?? false} />
          )}
          <ReliabilityBadge score={rel} signals={sigs} size="md" />
          {job.platform && (
            <Badge variant="outline" className="text-xs">{job.platform.name}</Badge>
          )}
        </div>

        <Tabs defaultValue="description" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="description" className="flex-1 text-xs">Description</TabsTrigger>
            <TabsTrigger value="match"       className="flex-1 text-xs">Match</TabsTrigger>
            <TabsTrigger value="standout"    className="flex-1 text-xs" onClick={loadStandoutTips}>
              Stand Out
            </TabsTrigger>
            <TabsTrigger value="reliability" className="flex-1 text-xs">Reliability</TabsTrigger>
          </TabsList>

          {/* ── Description tab ─────────────────────────────────────────── */}
          <TabsContent value="description" className="space-y-4 mt-4">
            {job.extractedSkills?.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Required skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.extractedSkills.map(s => (
                    <Badge
                      key={s}
                      variant={(job.matchedSkills ?? []).includes(s) ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            <Separator />

            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {job.descriptionExcerpt ?? 'No description available.'}
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`/jobs/${job.id}/apply`}
                className={buttonVariants({ className: 'flex-1' })}
              >
                How to Apply →
              </Link>
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View original"
                className={buttonVariants({ variant: 'outline', size: 'icon' })}
              >
                ↗
              </a>
            </div>
          </TabsContent>

          {/* ── Match breakdown ──────────────────────────────────────────── */}
          <TabsContent value="match" className="space-y-4 mt-4">
            {job.matchScore !== null ? (
              <>
                <div className="space-y-3">
                  <ScoreBar label="Skill match"    weight={MATCH_WEIGHTS.skill} />
                  <ScoreBar label="Semantic fit"   weight={MATCH_WEIGHTS.semantic} />
                  <ScoreBar label="Rate alignment" weight={MATCH_WEIGHTS.rate} />
                  <ScoreBar label="Experience"     weight={MATCH_WEIGHTS.exp} />
                  <ScoreBar label="Availability"   weight={MATCH_WEIGHTS.avail} />
                </div>

                {(job.matchedSkills?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Skills you have</p>
                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills!.map(s => (
                        <Badge key={s} className="text-xs bg-green-100 text-green-800 border-green-200">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.isNearMiss && (
                  <div className="p-3 bg-accent rounded-lg text-xs text-accent-foreground border border-accent-foreground/10">
                    <strong>Near Miss</strong> — You match some key skills but are missing a few requirements.
                    Visit the Roadmap to close these gaps quickly.
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Match score not yet computed.</p>
            )}
          </TabsContent>

          {/* ── Stand Out tips ───────────────────────────────────────────── */}
          <TabsContent value="standout" className="space-y-3 mt-4">
            {tipsLoading && (
              <div className="space-y-3 animate-pulse">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-5 h-5 rounded-full bg-muted mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded-full w-full" />
                      <div className="h-3 bg-muted rounded-full w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tipsError && (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-destructive">{tipsError}</p>
                <Button size="sm" variant="outline" onClick={() => { setTipsError(null); loadStandoutTips() }}>
                  Try again
                </Button>
              </div>
            )}
            {!tipsLoading && !tipsError && tips === null && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-medium">Ready to generate tips</p>
                <p className="text-xs text-muted-foreground">
                  AI-powered advice tailored to this specific job and your profile.
                </p>
              </div>
            )}
            {tips && tips.length > 0 && (
              <ol className="space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          {/* ── Reliability ──────────────────────────────────────────────── */}
          <TabsContent value="reliability" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Score: {rel}/100</span>
              <ReliabilityBadge score={rel} signals={sigs} />
            </div>

            {positiveSignals.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Positive signals</p>
                {positiveSignals.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
              </div>
            )}
            {negativeSignals.length > 0 && (
              <div className="space-y-1 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground">Warning signals</p>
                {negativeSignals.map((s, i) => <p key={i} className="text-xs">{s}</p>)}
              </div>
            )}

            <Separator />

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive w-full text-xs"
              onClick={reportScam}
              disabled={reporting || !userId}
            >
              {reporting ? 'Submitting…' : 'Report as scam / suspicious'}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
