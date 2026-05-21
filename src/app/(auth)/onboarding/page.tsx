'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { SKILLS_TAXONOMY, SKILL_CLUSTERS, getSkillsByCluster } from '@/lib/skills-taxonomy'
import { ChevronDown, ChevronRight } from 'lucide-react'

const SKILL_BY_CLUSTER = getSkillsByCluster()

const RATING_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Some experience', 3: 'Proficient', 4: 'Advanced', 5: 'Expert',
}

function SkillRatingPicker({
  skillId, skillName, rating,
  onToggle, onRate,
}: {
  skillId: string; skillName: string; rating: number | undefined
  onToggle: () => void; onRate: (r: number) => void
}) {
  const selected = rating !== undefined

  return (
    <div className={`rounded-lg border p-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`}
          onClick={onToggle}
        >
          {skillName}
        </span>
        {selected && (
          <span className="text-xs text-muted-foreground">{RATING_LABELS[rating!]}</span>
        )}
      </div>
      {selected && (
        <div className="flex gap-1 mt-1.5">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => onRate(r)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${r <= rating! ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      )}
      {!selected && (
        <button type="button" onClick={onToggle} className="w-full text-left text-xs text-muted-foreground mt-0.5">
          + Add
        </button>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [rate, setRate] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [openClusters, setOpenClusters] = useState<Set<string>>(new Set(['LLM Core', 'Languages & Frameworks']))

  function toggleSkill(id: string) {
    setRatings(prev => {
      if (prev[id] !== undefined) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: 3 }
    })
  }

  function setRating(id: string, r: number) {
    setRatings(prev => ({ ...prev, [id]: r }))
  }

  function toggleCluster(cluster: string) {
    setOpenClusters(prev => {
      const next = new Set(prev)
      next.has(cluster) ? next.delete(cluster) : next.add(cluster)
      return next
    })
  }

  const selectedSkills = Object.keys(ratings)
  const skillNames = selectedSkills.map(id => SKILLS_TAXONOMY.find(s => s.id === id)?.name ?? id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (selectedSkills.length < 3) { toast.error('Select at least 3 skills'); return }
    setLoading(true)

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        skills: skillNames,
        skill_ratings: ratings,
        hourly_rate: rate ? Number(rate) : null,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save profile')
    } else {
      toast.success('Profile saved!')
      router.push('/feed')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Set up your profile</CardTitle>
          <CardDescription>Select your skills and rate your proficiency. We use this to rank jobs by fit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-1">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            {/* Skill picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Skills <span className="text-muted-foreground text-xs">— click to add, drag bar to rate</span></Label>
                {selectedSkills.length > 0 && (
                  <span className="text-xs text-primary font-medium">{selectedSkills.length} selected</span>
                )}
              </div>

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg">
                  {skillNames.map((name, i) => (
                    <Badge key={selectedSkills[i]} variant="secondary" className="text-xs">
                      {name} · {ratings[selectedSkills[i]]}/5
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {SKILL_CLUSTERS.map(cluster => (
                  <div key={cluster} className="border rounded-lg">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-lg"
                      onClick={() => toggleCluster(cluster)}
                    >
                      <span className="flex items-center gap-2">
                        {openClusters.has(cluster) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {cluster}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(SKILL_BY_CLUSTER[cluster] ?? []).filter(s => ratings[s.id] !== undefined).length} / {(SKILL_BY_CLUSTER[cluster] ?? []).length}
                      </span>
                    </button>

                    {openClusters.has(cluster) && (
                      <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                        {(SKILL_BY_CLUSTER[cluster] ?? []).map(skill => (
                          <SkillRatingPicker
                            key={skill.id}
                            skillId={skill.id}
                            skillName={skill.name}
                            rating={ratings[skill.id]}
                            onToggle={() => toggleSkill(skill.id)}
                            onRate={r => setRating(skill.id, r)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div className="space-y-1">
              <Label htmlFor="rate">Target hourly rate (USD) <span className="text-muted-foreground text-xs">optional</span></Label>
              <Input id="rate" type="number" placeholder="75" value={rate} onChange={e => setRate(e.target.value)} min={1} />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving…' : `Save profile and find gigs`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
