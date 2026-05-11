'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { RoadmapSkill } from '@/lib/roadmap'

interface Props { items: RoadmapSkill[] }

const STATUS_LABELS = { active: 'Not planned', learning: 'Learning', planned: 'Planned' } as const
const STATUS_NEXT: Record<string, 'learning' | 'planned' | 'active'> = {
  active:   'learning',
  planned:  'learning',
  learning: 'active',
}
const FORMAT_ICONS: Record<string, string> = {
  course: '🎓', video: '▶️', docs: '📄', book: '📚',
}

export default function RoadmapClient({ items: initial }: Props) {
  const [items,   setItems]   = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleStatus(skillName: string, current: string) {
    const next = STATUS_NEXT[current] ?? 'learning'
    setLoading(skillName)
    try {
      const res = await fetch('/api/profile/skills/status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ skillName, status: next }),
      })
      if (!res.ok) { toast.error('Could not update skill status'); return }
      setItems(prev => prev.map(i => i.skillName === skillName ? { ...i, status: next } : i))
      toast.success(next === 'learning' ? `Marked "${skillName}" as Learning` : `Unmarked "${skillName}"`)
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-base">No skill gaps found.</p>
        <p className="text-sm mt-1">Your profile matches all skills in current approved jobs — great work!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.skillName} className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
          {/* Left: skill info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{item.skillName}</span>
              <Badge
                variant={item.status === 'learning' ? 'default' : 'outline'}
                className="text-xs"
              >
                {STATUS_LABELS[item.status] ?? item.status}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>{item.jobsUnlocked} jobs unlocked</span>
              {item.avgRate > 0 && <span>avg ${item.avgRate}/hr</span>}
              <span className="text-primary font-medium">ROI score: {item.roi}</span>
            </div>

            {item.resource && (
              <div className="mt-2 text-xs">
                <span className="text-muted-foreground mr-1">{FORMAT_ICONS[item.resource.format] ?? '📄'}</span>
                <a
                  href={item.resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {item.resource.title}
                </a>
                <span className="text-muted-foreground ml-1">
                  · {item.resource.provider} · ~{item.resource.estHours}h · {item.resource.isFree ? 'Free' : 'Paid'}
                </span>
              </div>
            )}
          </div>

          {/* Right: action */}
          <div className="flex-shrink-0 flex items-start">
            <Button
              size="sm"
              variant={item.status === 'learning' ? 'default' : 'outline'}
              className="text-xs h-7"
              disabled={loading === item.skillName}
              onClick={() => toggleStatus(item.skillName, item.status)}
            >
              {loading === item.skillName
                ? '…'
                : item.status === 'learning'
                  ? 'Mark done'
                  : 'Start learning'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
