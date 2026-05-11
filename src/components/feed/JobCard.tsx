'use client'

import { ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ReliabilityBadge from './ReliabilityBadge'
import MatchBadge from './MatchBadge'

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100  text-green-800  border border-green-200',
  2: 'bg-blue-100   text-blue-800   border border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  4: 'bg-orange-100 text-orange-800 border border-orange-200',
}

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
  job:      JobCardData
  onClick?: () => void
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

export default function JobCard({ job, onClick }: Props) {
  const rate  = formatRate(job.rateMin, job.rateMax, job.rateType)
  const tier  = job.platform?.trustTier ?? 0
  const score = job.reliabilityScore ?? 50
  const topSkills = (job.matchedSkills ?? job.extractedSkills ?? []).slice(0, 3)

  return (
    <Card
      className="hover:shadow-lg hover:ring-primary/20 transition-all duration-200 cursor-pointer group border-0 ring-1 ring-border"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
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

        {/* Rate + platform */}
        <div className="flex items-center gap-2 flex-wrap">
          {rate && <span className="text-sm font-semibold tabular-nums">{rate}</span>}
          {job.platform && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[tier] ?? 'bg-muted text-muted-foreground border border-border'}`}>
              {job.platform.name}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(job.postedAt)}</span>
        </div>

        {/* Excerpt */}
        {job.descriptionExcerpt && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{job.descriptionExcerpt}</p>
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

        {/* Reliability badge + expand hint */}
        <div className="flex items-center justify-between pt-0.5">
          <ReliabilityBadge
            score={score}
            signals={job.reliabilitySignals ?? {}}
          />
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground/70 group-hover:text-primary transition-colors">
            Details
            <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
