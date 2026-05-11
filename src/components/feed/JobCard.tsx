'use client'

import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TIER_COLORS } from '@/lib/tier-colors'
import ReliabilityBadge from './ReliabilityBadge'
import MatchBadge from './MatchBadge'

export interface JobCardData {
  id:                  string
  title:               string
  company:             string | null
  descriptionExcerpt:  string | null
  sourceUrl:           string
  postedAt:            string | null
  rateMin:             string | null
  rateMax:             string | null
  rateType:            string | null
  reliabilityScore:    number | null
  reliabilitySignals:  Record<string, number> | null
  extractedSkills:     string[] | null
  matchScore:          number | null
  isNearMiss:          boolean | null
  matchedSkills:       string[] | null
  platform: {
    id:        number
    name:      string
    trustTier: number | null
  } | null
}

interface Props {
  job:       JobCardData
  isActive?: boolean
  onClick?:  () => void
}

function formatRate(min: string | null, max: string | null, type: string | null): string | null {
  if (!min && !max) return null
  const suffix = type === 'hourly' ? '/hr' : type === 'fixed' ? ' fixed' : ''
  if (min && max) return `$${Number(min).toFixed(0)}–$${Number(max).toFixed(0)}${suffix}`
  return `$${Number(min ?? max).toFixed(0)}${suffix}`
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const d    = Math.floor(diff / 86_400_000)
  if (d === 0) return 'today'
  if (d === 1) return '1d ago'
  if (d < 7)  return `${d}d ago`
  return `${Math.floor(d / 7)}w ago`
}

export default function JobCard({ job, onClick, isActive = false }: Props) {
  const rate      = formatRate(job.rateMin, job.rateMax, job.rateType)
  const tier      = job.platform?.trustTier ?? 0
  const score     = job.reliabilityScore ?? 50
  const topSkills = (job.matchedSkills ?? job.extractedSkills ?? []).slice(0, 3)

  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer group transition-all duration-200 border-0 ring-1',
        isActive
          ? 'ring-primary shadow-md shadow-primary/15 bg-primary/[0.03]'
          : 'ring-border hover:ring-primary/30 hover:shadow-md hover:shadow-primary/5'
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              'font-semibold text-sm leading-snug line-clamp-2 transition-colors',
              isActive ? 'text-primary' : 'group-hover:text-primary'
            )}>
              {job.title}
            </h3>
            {job.company && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.company}</p>
            )}
          </div>
          {job.matchScore !== null && (
            <MatchBadge score={job.matchScore} isNearMiss={job.isNearMiss ?? false} />
          )}
        </div>

        {/* Rate + platform + time */}
        <div className="flex items-center gap-2 flex-wrap">
          {rate && (
            <span className="text-sm font-semibold tabular-nums text-foreground">{rate}</span>
          )}
          {job.platform && (
            <span className={cn(
              'text-[11px] px-2 py-0.5 rounded-full font-medium border',
              TIER_COLORS[tier] ?? 'bg-muted text-muted-foreground border-border'
            )}>
              {job.platform.name}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(job.postedAt)}</span>
        </div>

        {/* Excerpt */}
        {job.descriptionExcerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {job.descriptionExcerpt}
          </p>
        )}

        {/* Skill pills */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {topSkills.map(skill => (
              <Badge key={skill} variant="secondary" className="text-xs py-0 px-2 font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <ReliabilityBadge score={score} signals={job.reliabilitySignals ?? {}} />
          <span className={cn(
            'flex items-center gap-0.5 text-xs transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-primary'
          )}>
            Details
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
