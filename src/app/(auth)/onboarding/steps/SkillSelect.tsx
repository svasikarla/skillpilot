'use client'

import { useState } from 'react'
import { CLUSTERS, getSkillsByCluster } from '@/lib/skills-taxonomy'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface SkillEntry {
  name:       string
  cluster:    string
  selfRating: number  // 1–5
}

interface Props {
  defaultValues?: SkillEntry[]
  onNext: (skills: SkillEntry[]) => void
  onBack: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Familiar',
  2: 'Basic',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert',
}

export default function SkillSelect({ defaultValues = [], onNext, onBack }: Props) {
  const byCluster = getSkillsByCluster()
  const [selected, setSelected] = useState<Map<string, SkillEntry>>(
    () => new Map(defaultValues.map(s => [s.name, s]))
  )

  function toggle(name: string, cluster: string) {
    const next = new Map(selected)
    if (next.has(name)) {
      next.delete(name)
    } else {
      next.set(name, { name, cluster, selfRating: 3 })
    }
    setSelected(next)
  }

  function setRating(name: string, rating: number) {
    const next = new Map(selected)
    const entry = next.get(name)
    if (entry) next.set(name, { ...entry, selfRating: rating })
    setSelected(next)
  }

  function handleNext() {
    if (selected.size === 0) return
    onNext(Array.from(selected.values()))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Select every skill you have — even at a basic level. You'll rate each one. This drives your job matching.
      </p>

      {CLUSTERS.map(cluster => (
        <div key={cluster}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{cluster}</h3>
          <div className="flex flex-wrap gap-2">
            {byCluster[cluster].map(({ name }) => {
              const isSelected = selected.has(name)
              const entry = selected.get(name)
              return (
                <div key={name} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(name, cluster)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary'
                    )}
                  >
                    {name}
                  </button>
                  {isSelected && entry && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRating(name, r)}
                          title={RATING_LABELS[r]}
                          className={cn(
                            'w-5 h-2 rounded-full transition-colors',
                            r <= entry.selfRating ? 'bg-primary' : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm text-muted-foreground">{selected.size} skill{selected.size !== 1 ? 's' : ''} selected</span>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleNext} disabled={selected.size === 0}>Continue</Button>
        </div>
      </div>
    </div>
  )
}
