'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  ExternalLink, MapPin, DollarSign, Calendar, Clock, ShieldCheck, ShieldAlert,
  ShieldX, Bookmark, BookmarkCheck, Wand2, ChevronDown, ChevronUp, FileText, Flag,
} from 'lucide-react'
import ProposalPanelInline from '@/components/apply/ProposalPanel'
import JobDescription from '@/components/feed/JobDescription'
import { cn, formatRate } from '@/lib/utils'
import { tierFromScore, tierLabel } from '@/lib/reliability'
import { toast } from 'sonner'
import { useSuccessState } from '@/lib/use-success-state'
import { Check } from 'lucide-react'

type Job = {
  id: string; title: string; company: string | null; description: string | null
  platform: string; url: string | null; skills: string[]; location: string
  rate_min: number | null; rate_max: number | null; posted_at: string
  rate_type?: 'hourly' | 'fixed'; duration?: string | null
  employment_type?: 'contract' | 'full_time' | 'unknown'
  reliability_score?: number; match_score?: number; matched_skills?: string[]
}

function EmploymentBadge({ type }: { type?: 'contract' | 'full_time' | 'unknown' }) {
  if (!type || type === 'unknown') return null
  const isContract = type === 'contract'
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider',
      isContract
        ? 'bg-violet-50 text-violet-700 border border-violet-200'
        : 'bg-slate-50 text-slate-600 border border-slate-200',
    )}>
      {isContract ? 'Contract' : 'Full-time'}
    </span>
  )
}

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return `${Math.floor(d / 30)}mo ago`
}

function MatchBadge({ score }: { score: number }) {
  if (score >= 70) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full match-high">
      {score}% match
    </span>
  )
  if (score >= 45) return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full match-mid">
      {score}% match
    </span>
  )
  if (score > 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full match-low">
      {score}% match
    </span>
  )
  return null
}

function ReliabilityBadge({ score }: { score: number }) {
  const tier = tierFromScore(score)
  const icons = { green: ShieldCheck, amber: ShieldAlert, red: ShieldX }
  const Icon = icons[tier]
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full', `tier-${tier}`)}>
      <Icon className="h-3 w-3" />{tierLabel(tier)}
    </span>
  )
}


export default function JobCard({
  job, userSkills, isSaved = false, onSave, onViewDetails, proposalOpen, onProposalToggle,
}: {
  job: Job; userSkills: string[]; isSaved?: boolean; onSave?: () => void
  onViewDetails?: () => void
  proposalOpen?: boolean
  onProposalToggle?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const showProposal = proposalOpen ?? false
  const setShowProposal = onProposalToggle ?? (() => {})
  const [saved, triggerSaved] = useSuccessState()
  const score = job.match_score ?? 0
  const hasReliability = job.reliability_score !== undefined

  // Accent border based on match score
  const accentClass = score >= 70 ? 'border-l-emerald-500' : score >= 45 ? 'border-l-amber-400' : 'border-l-border'

  return (
    <>
    <div className={cn('card-elevated border-l-4 rounded-lg overflow-hidden', accentClass)}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground leading-snug">{job.title}</h3>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {job.company && <span className="text-xs text-muted-foreground">{job.company}</span>}
                  <span className="text-xs font-medium text-primary">{job.platform}</span>
                  <EmploymentBadge type={job.employment_type} />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <MatchBadge score={score} />
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />{job.location}
              </span>
              {(job.rate_min || job.rate_max) && (
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  {formatRate(job.rate_min, job.rate_max, job.rate_type)}
                </span>
              )}
              {job.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />{job.duration}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />{daysAgo(job.posted_at)}
              </span>
              {hasReliability && <ReliabilityBadge score={job.reliability_score!} />}
            </div>

            {/* Description */}
            {job.description && (
              expanded ? (
                <JobDescription
                  description={job.description}
                  title={job.title}
                  compact
                  maxBodyChars={600}
                />
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {job.description.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
              )
            )}

            {/* Skills */}
            <div className="flex flex-wrap gap-1.5">
              {(job.matched_skills?.length ? job.matched_skills : job.skills).slice(0, 6).map(skill => (
                <Badge
                  key={skill}
                  variant={userSkills.includes(skill) ? 'secondary' : 'outline'}
                  className={cn('text-xs px-2 py-0.5 h-5',
                    userSkills.includes(skill) ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15' : '')}
                >
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 6 && (
                <span className="text-xs text-muted-foreground self-center">+{job.skills.length - 6}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-0.5">
              {onSave && (
                <Button size="sm" variant="outline"
                  className={cn('h-7 text-xs gap-1.5 transition-colors',
                    saved ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'hover:border-primary/40')}
                  onClick={() => { onSave(); triggerSaved() }} disabled={isSaved}>
                  {saved    ? <><Check className="h-3.5 w-3.5" />Saved!</> :
                   isSaved  ? <><BookmarkCheck className="h-3.5 w-3.5 text-primary" />Saved</> :
                              <><Bookmark className="h-3.5 w-3.5" />Save</>}
                </Button>
              )}
              {onViewDetails && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 hover:border-primary/40" onClick={onViewDetails}>
                  <FileText className="h-3.5 w-3.5" />Details
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 hover:border-primary/40"
                onClick={() => { setShowProposal(); setExpanded(true) }}>
                <Wand2 className="h-3.5 w-3.5" />Proposal
              </Button>
              {job.description && job.description.length > 200 && (
                <button onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ml-auto">
                  {expanded ? <><ChevronUp className="h-3.5 w-3.5" />Less</> : <><ChevronDown className="h-3.5 w-3.5" />More</>}
                </button>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Open listing">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <button
              title="Report as scam"
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              onClick={async () => {
                await fetch(`/api/jobs/${job.id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: '' }) })
                toast.info('Report submitted. Thank you.')
              }}>
              <Flag className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>

    {/* Proposal Dialog */}
    <Dialog open={showProposal} onOpenChange={open => { if (!open) setShowProposal() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Draft proposal · {job.platform}
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{job.title}</p>
        </DialogHeader>
        <ProposalPanelInline jobId={job.id} platform={job.platform} />
      </DialogContent>
    </Dialog>
    </>
  )
}
