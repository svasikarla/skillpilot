'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, TrendingUp, BookOpen, Zap, CheckCircle2, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillGap } from '@/lib/roadmap'
import { toast } from 'sonner'
import { useSuccessState } from '@/lib/use-success-state'

function SkillActions({ skill, isLearning, isLearned, onToggle }: {
  skill: string; isLearning: boolean; isLearned: boolean
  onToggle: (skill: string, target: 'learning' | 'learned') => void
}) {
  const [learnedSuccess, triggerLearned] = useSuccessState()
  if (isLearned) return null
  return (
    <div className="flex gap-2 pt-1">
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
        onClick={() => onToggle(skill, 'learning')}>
        <BookMarked className="h-3 w-3" />
        {isLearning ? 'Unmark learning' : 'Mark as learning'}
      </Button>
      <Button size="sm" variant="outline"
        className={cn('h-7 text-xs gap-1.5 transition-colors',
          learnedSuccess
            ? 'border-emerald-400 text-emerald-700 bg-emerald-50'
            : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50')}
        onClick={() => { onToggle(skill, 'learned'); triggerLearned() }}>
        <CheckCircle2 className="h-3 w-3" />
        {learnedSuccess ? 'Learned!' : 'Mark as learned'}
      </Button>
    </div>
  )
}

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

export default function RoadmapClient({
  gaps,
  initialLearning,
  initialLearned,
}: {
  gaps: SkillGap[]
  initialLearning: string[]
  initialLearned: string[]
}) {
  const maxRoi = gaps[0]?.roiRaw ?? 1
  const [learning, setLearning] = useState<string[]>(initialLearning)
  const [learned,  setLearned]  = useState<string[]>(initialLearned)

  async function toggleSkillStatus(skill: string, target: 'learning' | 'learned') {
    const isLearning = learning.includes(skill)
    const isLearned  = learned.includes(skill)

    let newLearning = [...learning]
    let newLearned  = [...learned]

    if (target === 'learning') {
      newLearning = isLearning ? newLearning.filter(s => s !== skill) : [...newLearning, skill]
    } else {
      newLearned  = isLearned  ? newLearned.filter(s => s !== skill)  : [...newLearned, skill]
      // remove from learning when marking learned
      newLearning = newLearning.filter(s => s !== skill)
    }

    setLearning(newLearning)
    setLearned(newLearned)

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learning_skills: newLearning, learned_skills: newLearned }),
    })
    if (!res.ok) toast.error('Failed to update skill status')
    else toast.success(target === 'learned' ? `${skill} marked as learned!` : `${skill} added to learning list`)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium px-4 hidden md:grid">
        <span className="col-span-2">Skill</span>
        <span className="text-center">Jobs</span>
        <span className="text-center">Avg rate</span>
        <span>Impact</span>
      </div>

      {gaps.map((gap, i) => {
        const isLearning = learning.includes(gap.skill)
        const isLearned  = learned.includes(gap.skill)
        return (
          <div key={gap.skill} className={cn('border rounded-lg p-4 space-y-3',
            isLearned ? 'opacity-60 bg-muted/30' : '')}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{gap.skill}</p>
                    {isLearning && (
                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                        Learning
                      </Badge>
                    )}
                    {isLearned && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Learned
                      </Badge>
                    )}
                  </div>
                  {gap.resource && (
                    <a href={gap.resource.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                      <BookOpen className="h-3 w-3" />
                      {gap.resource.title} — {gap.resource.provider}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {gap.resource && (
                  <Badge variant="outline" className="text-xs hidden sm:flex">
                    ~{gap.resource.est_hours}h · {gap.resource.cost}
                  </Badge>
                )}
              </div>
            </div>

            {/* ROI narrative */}
            <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2.5 py-1.5 border border-border/50">
              💡 {gap.roiLabel}
            </p>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs">{gap.jobsUnlocked} jobs</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs">
                  {gap.avgRate > 0 ? `$${gap.avgRate}/hr avg` : 'Rate varies'}
                </span>
              </div>
              <div>
                {gap.resource?.format && (
                  <Badge variant="secondary" className="text-xs capitalize">{gap.resource.format}</Badge>
                )}
              </div>
            </div>

            <ImpactBar value={gap.roiRaw} max={maxRoi} />

            {/* Mark learning / learned buttons */}
            <SkillActions
              skill={gap.skill}
              isLearning={isLearning}
              isLearned={isLearned}
              onToggle={toggleSkillStatus}
            />
          </div>
        )
      })}
    </div>
  )
}
