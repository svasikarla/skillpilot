'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ExternalLink, MapPin, DollarSign, Calendar, ShieldCheck, ShieldAlert,
  ShieldX, Bookmark, BookmarkCheck, Wand2, X, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { tierFromScore, tierLabel } from '@/lib/reliability'
import { toast } from 'sonner'

type Job = {
  id: string; title: string; company: string | null; description: string | null
  platform: string; url: string | null; skills: string[]; location: string
  rate_min: number | null; rate_max: number | null; posted_at: string
  reliability_score?: number; match_score?: number; matched_skills?: string[]
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

function ProposalPanel({ job, onClose }: { job: Job; onClose: () => void }) {
  const [memberValue, setMemberValue] = useState('')
  const [pastResult, setPastResult]   = useState('')
  const [question, setQuestion]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [variants, setVariants]       = useState<{ concise: string; standard: string; detailed: string } | null>(null)
  const [active, setActive]           = useState<'concise' | 'standard' | 'detailed'>('standard')

  async function generate() {
    if (!memberValue || !pastResult || !question) { toast.error('Fill in all three fields'); return }
    setLoading(true)
    const res = await fetch('/api/proposals/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id, member_value: memberValue, past_result: pastResult, question_for_client: question }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); setLoading(false); return }
    setVariants(data.variants)
    setLoading(false)
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/60 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Generate proposal · {job.platform}
        </p>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!variants ? (
        <div className="space-y-3">
          {[
            { id: 'value', label: 'What specific value do you bring?', val: memberValue, set: setMemberValue, ph: 'e.g. Built 3 production RAG systems for fintech clients…' },
            { id: 'result', label: 'One measurable past result', val: pastResult, set: setPastResult, ph: 'e.g. Reduced inference latency by 40% using vLLM…' },
            { id: 'question', label: 'One smart question for the client', val: question, set: setQuestion, ph: 'e.g. Is the data already chunked, or will I own the pipeline?' },
          ].map(({ id, label, val, set, ph }) => (
            <div key={id} className="space-y-1">
              <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
              <Input id={id} className="text-xs h-8 bg-muted/30" placeholder={ph} value={val} onChange={e => set(e.target.value)} />
            </div>
          ))}
          <Button size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {loading ? 'Generating…' : 'Generate 3 variants'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {(['concise', 'standard', 'detailed'] as const).map(v => (
              <button key={v} onClick={() => setActive(v)}
                className={cn('text-xs px-2.5 py-1 rounded-md font-medium transition-colors capitalize border',
                  active === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted text-muted-foreground')}>
                {v}
              </button>
            ))}
            <button onClick={() => setVariants(null)} className="text-xs text-muted-foreground ml-auto hover:text-foreground underline">Redo</button>
          </div>
          <Textarea
            className="text-xs min-h-[140px] bg-muted/20 resize-none"
            value={variants[active]}
            onChange={e => setVariants({ ...variants, [active]: e.target.value })}
          />
          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => { navigator.clipboard.writeText(variants[active]); toast.success('Copied to clipboard') }}>
            Copy to clipboard
          </Button>
        </div>
      )}
    </div>
  )
}

export default function JobCard({
  job, userSkills, isSaved = false, onSave,
}: {
  job: Job; userSkills: string[]; isSaved?: boolean; onSave?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showProposal, setShowProposal] = useState(false)
  const score = job.match_score ?? 0
  const hasReliability = job.reliability_score !== undefined

  // Accent border based on match score
  const accentClass = score >= 70 ? 'border-l-emerald-500' : score >= 45 ? 'border-l-amber-400' : 'border-l-border'

  return (
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
                  {job.rate_min && job.rate_max ? `$${job.rate_min}–$${job.rate_max}/hr`
                    : job.rate_min ? `From $${job.rate_min}/hr` : `Up to $${job.rate_max}/hr`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />{daysAgo(job.posted_at)}
              </span>
              {hasReliability && <ReliabilityBadge score={job.reliability_score!} />}
            </div>

            {/* Description */}
            {job.description && (
              <p className={cn('text-xs text-muted-foreground leading-relaxed', expanded ? '' : 'line-clamp-2')}>
                {job.description}
              </p>
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
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 hover:border-primary/40" onClick={onSave} disabled={isSaved}>
                  {isSaved ? <><BookmarkCheck className="h-3.5 w-3.5 text-primary" />Saved</> : <><Bookmark className="h-3.5 w-3.5" />Save</>}
                </Button>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 hover:border-primary/40"
                onClick={() => { setShowProposal(v => !v); setExpanded(true) }}>
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

          {/* External link */}
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mt-0.5"
              title="Open listing">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        {showProposal && <ProposalPanel job={job} onClose={() => setShowProposal(false)} />}
      </div>
    </div>
  )
}
