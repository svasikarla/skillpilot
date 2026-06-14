'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ExternalLink, MapPin, DollarSign, Calendar,
  ShieldCheck, ShieldAlert, ShieldX, Wand2, FileText,
  Sparkles, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { tierFromScore, tierLabel } from '@/lib/reliability'
import ReliabilityExplainer from './ReliabilityExplainer'
import JobDescription from './JobDescription'

type Job = {
  id: string; title: string; company: string | null; description: string | null
  platform: string; url: string | null; skills: string[]; location: string
  rate_min: number | null; rate_max: number | null; posted_at: string
  employment_type?: 'contract' | 'full_time' | 'unknown'
  reliability_score?: number; reliability_signals?: Record<string, boolean>
  match_score?: number; matched_skills?: string[]
  skill_score?: number; rate_score?: number; recency_score?: number
}

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'Today'; if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`; if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

interface PrepQuestion { q: string; a: string }

export default function JobDetailSheet({
  job, open, onClose, userSkills, onProposal,
}: {
  job: Job | null
  open: boolean
  onClose: () => void
  userSkills: string[]
  onProposal?: () => void
}) {
  const [prepLoading, setPrepLoading] = useState(false)
  const [prepQuestions, setPrepQuestions] = useState<PrepQuestion[]>([])
  const [prepError, setPrepError] = useState<string | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  async function generatePrep() {
    if (!job) return
    setPrepLoading(true); setPrepError(null)
    const res = await fetch(`/api/jobs/${job.id}/interview-prep`, { method: 'POST' })
    const data = await res.json()
    setPrepLoading(false)
    if (!res.ok) { setPrepError(data.error ?? 'Failed'); return }
    setPrepQuestions(data.questions ?? [])
    setExpandedIdx(0)
  }

  if (!job) return null

  const score = job.match_score ?? 0
  const tier  = job.reliability_score !== undefined ? tierFromScore(job.reliability_score) : null

  const ReliabilityIcon = tier === 'green' ? ShieldCheck : tier === 'amber' ? ShieldAlert : ShieldX

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base leading-snug">{job.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {job.company && <span className="text-xs text-muted-foreground">{job.company}</span>}
                <span className="text-xs font-semibold text-primary">{job.platform}</span>
                {job.employment_type && job.employment_type !== 'unknown' && (
                  <span className={cn(
                    'text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider border',
                    job.employment_type === 'contract'
                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200',
                  )}>
                    {job.employment_type === 'contract' ? 'Contract' : 'Full-time'}
                  </span>
                )}
              </div>
            </div>
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs shrink-0">
                  Apply <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
            {(job.rate_min || job.rate_max) && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                {job.rate_min && job.rate_max ? `$${job.rate_min}–$${job.rate_max}/hr`
                  : job.rate_min ? `From $${job.rate_min}/hr` : `Up to $${job.rate_max}/hr`}
              </span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{daysAgo(job.posted_at)}</span>
            {tier && (
              <span className={cn('flex items-center gap-1 font-medium',
                tier === 'green' ? 'text-emerald-700' : tier === 'amber' ? 'text-amber-600' : 'text-red-600')}>
                <ReliabilityIcon className="h-3 w-3" />{tierLabel(tier)}
              </span>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            <TabsTrigger value="match" className="text-xs">Match</TabsTrigger>
            <TabsTrigger value="reliability" className="text-xs">Trust</TabsTrigger>
            <TabsTrigger value="prep" className="text-xs">Prep</TabsTrigger>
          </TabsList>

          {/* ── Details tab ─────────────────────────────── */}
          <TabsContent value="details" className="space-y-4 pt-4">
            {job.description && (
              <JobDescription description={job.description} title={job.title} />
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map(skill => (
                  <Badge key={skill} variant={userSkills.includes(skill) ? 'secondary' : 'outline'}
                    className={cn('text-xs',
                      userSkills.includes(skill) ? 'bg-primary/10 text-primary border-primary/20' : '')}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {onProposal && (
                <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={onProposal}>
                  <Wand2 className="h-3.5 w-3.5" /> Draft proposal
                </Button>
              )}
              {job.url && (
                <Button size="sm" className="gap-1.5 flex-1" nativeButton={false} render={<a href={`/jobs/${job.id}/apply`} />}>
                  <FileText className="h-3.5 w-3.5" /> How to Apply
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ── Match tab ───────────────────────────────── */}
          <TabsContent value="match" className="space-y-4 pt-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
              <div className={cn('text-3xl font-bold',
                score >= 70 ? 'text-emerald-600' : score >= 45 ? 'text-amber-600' : 'text-muted-foreground')}>
                {score}%
              </div>
              <div>
                <p className="text-sm font-semibold">Overall match</p>
                <p className="text-xs text-muted-foreground">
                  {score >= 70 ? 'Strong fit — apply now' : score >= 45 ? 'Partial fit — close gaps first' : 'Low fit — stretch role'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {job.skill_score !== undefined && (
                <ScoreBar label="Skill coverage (60%)" value={job.skill_score} color="bg-blue-500" />
              )}
              {job.rate_score !== undefined && (
                <ScoreBar label="Rate alignment (20%)" value={job.rate_score} color="bg-emerald-500" />
              )}
              {job.recency_score !== undefined && (
                <ScoreBar label="Recency (20%)" value={job.recency_score} color="bg-amber-400" />
              )}
            </div>

            {(job.matched_skills?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1.5">✓ Skills you have</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.matched_skills!.map(s => (
                    <Badge key={s} className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {job.skills.filter(s => !userSkills.includes(s)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1.5">⚠ Skills to add</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.filter(s => !userSkills.includes(s)).map(s => (
                    <Badge key={s} variant="outline" className="text-xs border-amber-200 text-amber-700">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Reliability tab ─────────────────────────── */}
          <TabsContent value="reliability" className="space-y-4 pt-4">
            {job.reliability_score !== undefined && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                <div className={cn('text-3xl font-bold',
                  job.reliability_score >= 70 ? 'text-emerald-600' :
                  job.reliability_score >= 40 ? 'text-amber-600' : 'text-red-600')}>
                  {job.reliability_score}
                </div>
                <div>
                  <p className="text-sm font-semibold">Trust score</p>
                  <p className="text-xs text-muted-foreground">
                    {job.reliability_score >= 70 ? 'Legitimate listing' :
                     job.reliability_score >= 40 ? 'Verify before applying' : 'High risk — investigate first'}
                  </p>
                </div>
              </div>
            )}
            {job.reliability_signals && (
              <ReliabilityExplainer score={job.reliability_score ?? 0} signals={job.reliability_signals} />
            )}
            {job.reliability_score !== undefined && job.reliability_score >= 70 && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                No red flags detected. This listing passed all reliability checks.
              </p>
            )}
          </TabsContent>
          {/* ── Interview Prep tab ──────────────────────── */}
          <TabsContent value="prep" className="space-y-4 pt-4">
            {prepQuestions.length === 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Generate 5 tailored interview questions with model answers based on this job&apos;s requirements.
                </p>
                {prepError && (
                  <p className="text-xs text-destructive">{prepError}</p>
                )}
                <Button
                  size="sm" variant="outline" className="gap-1.5 w-full"
                  onClick={generatePrep} disabled={prepLoading}
                >
                  {prepLoading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
                    : <><Sparkles className="h-3.5 w-3.5" /> Generate interview prep</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {prepQuestions.map((item, i) => (
                  <div key={i} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-start justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    >
                      <span className="text-xs font-medium flex-1">{i + 1}. {item.q}</span>
                      {expandedIdx === i
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                    </button>
                    {expandedIdx === i && (
                      <div className="px-3 pb-3 pt-1 border-t bg-muted/20">
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  size="sm" variant="ghost" className="gap-1.5 w-full text-xs text-muted-foreground"
                  onClick={() => { setPrepQuestions([]); setPrepError(null) }}
                >
                  Regenerate
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
