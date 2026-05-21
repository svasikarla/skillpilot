'use client'

import { Badge } from '@/components/ui/badge'
import { ExternalLink, TrendingUp, BookOpen, Zap } from 'lucide-react'
import type { SkillGap } from '@/lib/roadmap'

function ImpactBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function RoadmapClient({ gaps }: { gaps: SkillGap[] }) {
  const maxRoi = gaps[0]?.roi ?? 1

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground font-medium px-4 hidden md:grid">
        <span>Skill</span>
        <span className="text-center">Jobs unlocked</span>
        <span className="text-center">Avg rate</span>
        <span>Impact</span>
      </div>

      {gaps.map((gap, i) => (
        <div key={gap.skill} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <div>
                <p className="font-medium text-sm">{gap.skill}</p>
                {gap.resource && (
                  <a
                    href={gap.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                  >
                    <BookOpen className="h-3 w-3" />
                    {gap.resource.title} — {gap.resource.provider}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {gap.resource && (
                <Badge variant="outline" className="text-xs">
                  ~{gap.resource.est_hours}h · {gap.resource.cost}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              <span className="text-xs">{gap.jobsUnlocked} jobs need this</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs">
                {gap.avgRate > 0 ? `$${gap.avgRate}/hr avg` : 'Rate varies'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {gap.resource?.format && (
                <Badge variant="secondary" className="text-xs capitalize">{gap.resource.format}</Badge>
              )}
            </div>
          </div>

          <ImpactBar value={gap.roi} max={maxRoi} />
        </div>
      ))}
    </div>
  )
}
