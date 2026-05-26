'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { SKILLS_TAXONOMY, SKILL_CLUSTERS, getSkillsByCluster } from '@/lib/skills-taxonomy'
import { ChevronDown, ChevronRight, ChevronLeft, Search } from 'lucide-react'
import StepIndicator from '@/components/onboarding/StepIndicator'
import PortfolioStep, { type PortfolioItem } from '@/components/onboarding/PortfolioStep'
import AppNav from '@/components/AppNav'

const SKILL_BY_CLUSTER = getSkillsByCluster()

const RATING_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Some experience', 3: 'Proficient', 4: 'Advanced', 5: 'Expert',
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney',
]

function SkillRatingPicker({
  skillId, skillName, rating, onToggle, onRate,
}: {
  skillId: string; skillName: string; rating: number | undefined
  onToggle: () => void; onRate: (r: number) => void
}) {
  const selected = rating !== undefined
  return (
    <div className={`rounded-lg border p-2 cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-medium ${selected ? 'text-primary' : 'text-foreground'}`} onClick={onToggle}>
          {skillName}
        </span>
        {selected && <span className="text-xs text-muted-foreground">{RATING_LABELS[rating!]}</span>}
      </div>
      {selected && (
        <div className="flex gap-1 mt-1.5">
          {[1, 2, 3, 4, 5].map(r => (
            <button key={r} type="button" onClick={() => onRate(r)}
              className={`flex-1 h-1.5 rounded-full transition-colors ${r <= rating! ? 'bg-primary' : 'bg-muted'}`} />
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
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  const STORAGE_KEY = 'onboarding_draft'

  // Step 0 — About you
  const [name, setName]               = useState('')
  const [yearsExp, setYearsExp]       = useState('')
  const [timezone, setTimezone]       = useState('UTC')
  const [workPref, setWorkPref]       = useState('')
  const [about, setAbout]             = useState('')

  // Step 1 — Skills
  const [ratings, setRatings]         = useState<Record<string, number>>({})
  const [openClusters, setOpenClusters] = useState<Set<string>>(new Set(['LLM Core', 'Languages & Frameworks']))
  const [skillSearch, setSkillSearch]   = useState('')

  // Step 2 — Work prefs
  const [rate, setRate]               = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('')
  const [minBudget, setMinBudget]     = useState('')

  // Step 3 — Portfolio
  const [portfolio, setPortfolio]     = useState<PortfolioItem[]>([])

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const d = JSON.parse(saved)
        if (d.name)         setName(d.name)
        if (d.yearsExp)     setYearsExp(d.yearsExp)
        if (d.timezone)     setTimezone(d.timezone)
        if (d.workPref)     setWorkPref(d.workPref)
        if (d.about)        setAbout(d.about)
        if (d.ratings)      setRatings(d.ratings)
        if (d.rate)         setRate(d.rate)
        if (d.hoursPerWeek) setHoursPerWeek(d.hoursPerWeek)
        if (d.minBudget)    setMinBudget(d.minBudget)
        if (d.portfolio)    setPortfolio(d.portfolio)
        if (d.step)         setStep(d.step)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Auto-save to localStorage on every state change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name, yearsExp, timezone, workPref, about, ratings, rate, hoursPerWeek, minBudget, portfolio, step,
      }))
    } catch {}
  }, [hydrated, name, yearsExp, timezone, workPref, about, ratings, rate, hoursPerWeek, minBudget, portfolio, step])

  function toggleSkill(id: string) {
    setRatings(prev => {
      if (prev[id] !== undefined) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: 3 }
    })
  }

  function toggleCluster(cluster: string) {
    setOpenClusters(prev => {
      const n = new Set(prev)
      n.has(cluster) ? n.delete(cluster) : n.add(cluster)
      return n
    })
  }

  const selectedSkills = Object.keys(ratings)
  const skillNames = selectedSkills.map(id => SKILLS_TAXONOMY.find(s => s.id === id)?.name ?? id)

  function validateStep(): boolean {
    if (step === 0) {
      if (!name.trim()) { toast.error('Please enter your name'); return false }
    }
    if (step === 1) {
      if (selectedSkills.length < 3) { toast.error('Select at least 3 skills'); return false }
    }
    return true
  }

  function next() {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setLoading(true)

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:             name.trim(),
        skills:           skillNames,
        skill_ratings:    ratings,
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

    if (!res.ok) {
      const { error } = await res.json()
      toast.error(error ?? 'Failed to save profile')
    } else {
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      toast.success('Profile saved! Finding your matches…')
      router.push('/feed')
      router.refresh()
    }
    setLoading(false)
  }

  const TITLES = [
    { title: 'About you', desc: 'Basic info so we can personalise your experience.' },
    { title: 'Your skills', desc: 'Select skills and rate your proficiency. We use this to rank jobs by fit.' },
    { title: 'Work preferences', desc: 'Helps us filter out jobs that don\'t match your rate or availability.' },
    { title: 'Portfolio', desc: 'Optional — used in proposal generation and profile audits.' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <StepIndicator current={step} />
            <CardTitle>{TITLES[step].title}</CardTitle>
            <CardDescription>{TITLES[step].desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ── Step 0: About you ───────────────────────────── */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" placeholder="Ada Lovelace" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="years">Years of experience</Label>
                    <Input id="years" type="number" placeholder="5" min={0} max={50}
                      value={yearsExp} onChange={e => setYearsExp(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={v => setTimezone(v ?? '')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                  <Label htmlFor="about">One-line bio <span className="text-muted-foreground text-xs">optional</span></Label>
                  <Textarea id="about" className="resize-none min-h-[72px] text-sm"
                    placeholder="LLM engineer specialising in RAG systems and production AI pipelines…"
                    value={about} onChange={e => setAbout(e.target.value)} maxLength={200} />
                  <p className="text-xs text-muted-foreground text-right">{about.length}/200</p>
                </div>
              </div>
            )}

            {/* ── Step 1: Skills ──────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-8 text-sm" placeholder="Search skills…"
                    value={skillSearch} onChange={e => setSkillSearch(e.target.value)} />
                </div>

                {selectedSkills.length > 0 && !skillSearch && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg">
                    {skillNames.map((n, i) => (
                      <Badge key={selectedSkills[i]} variant="secondary" className="text-xs">
                        {n} · {ratings[selectedSkills[i]]}/5
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {SKILL_CLUSTERS.filter(cluster => {
                    if (!skillSearch.trim()) return true
                    return (SKILL_BY_CLUSTER[cluster] ?? []).some(s =>
                      s.name.toLowerCase().includes(skillSearch.toLowerCase())
                    )
                  }).map(cluster => {
                    const clusterSkills = (SKILL_BY_CLUSTER[cluster] ?? []).filter(s =>
                      !skillSearch.trim() || s.name.toLowerCase().includes(skillSearch.toLowerCase())
                    )
                    const forceOpen = !!skillSearch.trim()
                    return (
                    <div key={cluster} className="border rounded-lg">
                      <button type="button"
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 rounded-lg"
                        onClick={() => toggleCluster(cluster)}>
                        <span className="flex items-center gap-2">
                          {(forceOpen || openClusters.has(cluster)) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {cluster}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {clusterSkills.filter(s => ratings[s.id] !== undefined).length} / {clusterSkills.length}
                        </span>
                      </button>
                      {(forceOpen || openClusters.has(cluster)) && (
                        <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                          {clusterSkills.map(skill => (
                            <SkillRatingPicker key={skill.id} skillId={skill.id} skillName={skill.name}
                              rating={ratings[skill.id]}
                              onToggle={() => toggleSkill(skill.id)}
                              onRate={r => setRatings(prev => ({ ...prev, [skill.id]: r }))} />
                          ))}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
                <p className="text-xs text-muted-foreground text-center">{selectedSkills.length} selected · minimum 3</p>
              </div>
            )}

            {/* ── Step 2: Work prefs ──────────────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="rate">Target hourly rate (USD)</Label>
                    <Input id="rate" type="number" placeholder="75" min={1}
                      value={rate} onChange={e => setRate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="hours">Hours available / week</Label>
                    <Input id="hours" type="number" placeholder="20" min={1} max={60}
                      value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget">Min project budget (USD) <span className="text-muted-foreground text-xs">optional</span></Label>
                  <Input id="budget" type="number" placeholder="500"
                    value={minBudget} onChange={e => setMinBudget(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Jobs below this fixed budget will score lower in your feed.</p>
                </div>
              </div>
            )}

            {/* ── Step 3: Portfolio ───────────────────────────── */}
            {step === 3 && (
              <PortfolioStep items={portfolio} onChange={setPortfolio} />
            )}

            {/* ── Navigation ─────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1.5">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button type="button" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving…' : 'Save profile and find gigs'}
                </Button>
              )}
            </div>

            {step === 3 && (
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Portfolio is optional — you can add projects later from your settings.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
