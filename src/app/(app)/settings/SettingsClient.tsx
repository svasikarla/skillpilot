'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { SKILLS_TAXONOMY, SKILL_CLUSTERS, getSkillsByCluster } from '@/lib/skills-taxonomy'
import { ChevronDown, ChevronRight, Check, Loader2, Search } from 'lucide-react'
import PortfolioStep, { type PortfolioItem } from '@/components/onboarding/PortfolioStep'

const SKILL_BY_CLUSTER = getSkillsByCluster()
const RATING_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Some experience', 3: 'Proficient', 4: 'Advanced', 5: 'Expert',
}
const TIMEZONES = [
  'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'Europe/London','Europe/Paris','Europe/Berlin','Asia/Kolkata','Asia/Singapore',
  'Asia/Tokyo','Australia/Sydney',
]

type Profile = {
  name: string; skills: string[]; skill_ratings: Record<string, number>
  hourly_rate: number | null; years_experience: number | null
  work_preference: string | null; timezone: string | null
  hours_per_week: number | null; min_budget: number | null
  about: string | null; portfolio: PortfolioItem[]
} | null

export default function SettingsClient({ profile }: { profile: Profile }) {
  const SKILL_BY_CLUSTER = getSkillsByCluster()

  // Build initial ratings from profile skills
  const buildInitialRatings = () => {
    const r: Record<string, number> = {}
    const skillRatings = profile?.skill_ratings ?? {}
    for (const skill of profile?.skills ?? []) {
      const found = SKILLS_TAXONOMY.find(s => s.name === skill)
      if (found) r[found.id] = skillRatings[skill] ?? 3
    }
    return r
  }

  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [name, setName]                 = useState(profile?.name ?? '')
  const [about, setAbout]               = useState(profile?.about ?? '')
  const [rate, setRate]                 = useState(String(profile?.hourly_rate ?? ''))
  const [yearsExp, setYearsExp]         = useState(String(profile?.years_experience ?? ''))
  const [timezone, setTimezone]         = useState(profile?.timezone ?? 'UTC')
  const [workPref, setWorkPref]         = useState(profile?.work_preference ?? '')
  const [hoursPerWeek, setHoursPerWeek] = useState(String(profile?.hours_per_week ?? ''))
  const [minBudget, setMinBudget]       = useState(String(profile?.min_budget ?? ''))
  const [portfolio, setPortfolio]       = useState<PortfolioItem[]>(profile?.portfolio ?? [])
  const [ratings, setRatings]           = useState<Record<string, number>>(buildInitialRatings())
  const [openClusters, setOpenClusters] = useState<Set<string>>(new Set(['LLM Core']))
  const [skillSearch, setSkillSearch]   = useState('')

  const selectedSkills = Object.keys(ratings)
  const skillNames = selectedSkills.map(id => SKILLS_TAXONOMY.find(s => s.id === id)?.name ?? id)

  function toggleSkill(id: string) {
    setRatings(prev => {
      if (prev[id] !== undefined) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: 3 }
    })
  }

  const filteredClusters = skillSearch.trim()
    ? SKILL_CLUSTERS.filter(c =>
        (SKILL_BY_CLUSTER[c] ?? []).some(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
      )
    : SKILL_CLUSTERS

  async function save() {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        skills: skillNames,
        skill_ratings: ratings,
        hourly_rate:      rate ? Number(rate) : null,
        years_experience: yearsExp ? Number(yearsExp) : null,
        work_preference:  workPref || null,
        timezone,
        hours_per_week:   hoursPerWeek ? Number(hoursPerWeek) : null,
        min_budget:       minBudget ? Number(minBudget) : null,
        about:            about.trim() || null,
        portfolio,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      toast.success('Profile saved')
      setTimeout(() => setSaved(false), 2000)
    } else {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save')
    }
  }

  return (
    <div className="space-y-10">

      {/* ── Basic info ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Basic info</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Full name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Years of experience</Label>
              <Input type="number" placeholder="5" min={0} max={50} value={yearsExp} onChange={e => setYearsExp(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={v => setTimezone(v ?? '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>One-line bio <span className="text-muted-foreground text-xs">optional</span></Label>
            <Textarea className="resize-none min-h-[72px] text-sm"
              placeholder="LLM engineer specialising in RAG systems and production AI pipelines…"
              value={about} onChange={e => setAbout(e.target.value)} maxLength={200} />
            <p className="text-xs text-muted-foreground text-right">{about.length}/200</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Work preferences ────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Work preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Target hourly rate (USD)</Label>
            <Input type="number" placeholder="75" min={1} value={rate} onChange={e => setRate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Hours available / week</Label>
            <Input type="number" placeholder="20" min={1} max={60} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Preferred work type</Label>
            <Select value={workPref} onValueChange={v => setWorkPref(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short_project">Short projects (1–4 weeks)</SelectItem>
                <SelectItem value="long_contract">Long contracts (3+ months)</SelectItem>
                <SelectItem value="retainer">Ongoing retainer</SelectItem>
                <SelectItem value="any">Any / flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Min project budget (USD)</Label>
            <Input type="number" placeholder="500" value={minBudget} onChange={e => setMinBudget(e.target.value)} />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Skills ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Skills</h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input className="pl-9 h-8 text-sm" placeholder="Search skills…"
            value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
        </div>

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg">
            {skillNames.map((n, i) => (
              <Badge key={selectedSkills[i]} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10"
                onClick={() => toggleSkill(selectedSkills[i])}>
                {n} · {ratings[selectedSkills[i]]}/5 ×
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredClusters.map(cluster => {
            const clusterSkills = (SKILL_BY_CLUSTER[cluster] ?? []).filter(s =>
              !skillSearch.trim() || s.name.toLowerCase().includes(skillSearch.toLowerCase())
            )
            if (!clusterSkills.length) return null
            const isOpen = openClusters.has(cluster) || !!skillSearch.trim()
            return (
              <div key={cluster} className="border rounded-lg">
                <button type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-lg"
                  onClick={() => {
                    setOpenClusters(prev => {
                      const n = new Set(prev)
                      n.has(cluster) ? n.delete(cluster) : n.add(cluster)
                      return n
                    })
                  }}>
                  <span className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {cluster}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {clusterSkills.filter(s => ratings[s.id] !== undefined).length} / {clusterSkills.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                    {clusterSkills.map(skill => {
                      const selected = ratings[skill.id] !== undefined
                      return (
                        <div key={skill.id} className={`rounded-lg border p-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-medium ${selected ? 'text-primary' : ''}`} onClick={() => toggleSkill(skill.id)}>
                              {skill.name}
                            </span>
                            {selected && <span className="text-xs text-muted-foreground">{RATING_LABELS[ratings[skill.id]]}</span>}
                          </div>
                          {selected && (
                            <div className="flex gap-1 mt-1.5">
                              {[1,2,3,4,5].map(r => (
                                <button key={r} type="button" onClick={() => setRatings(p => ({ ...p, [skill.id]: r }))}
                                  className={`flex-1 h-1.5 rounded-full ${r <= ratings[skill.id] ? 'bg-primary' : 'bg-muted'}`} />
                              ))}
                            </div>
                          )}
                          {!selected && (
                            <button type="button" onClick={() => toggleSkill(skill.id)} className="w-full text-left text-xs text-muted-foreground mt-0.5">+ Add</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* ── Portfolio ───────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Portfolio</h2>
        <PortfolioStep items={portfolio} onChange={setPortfolio} />
      </section>

      {/* ── Save ────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t pt-4 pb-2 -mx-4 px-4">
        <Button onClick={save} disabled={saving} className="w-full gap-2 h-11">
          {saving  ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> :
           saved   ? <><Check className="h-4 w-4" />Saved!</> :
                     'Save changes'}
        </Button>
      </div>

    </div>
  )
}
