'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Play, Pause, SkipForward, SkipBack,
  Zap, BarChart3, Wand2, Layers, Building2, Map,
  CheckCircle, TrendingUp, Clock, ShieldCheck, Star,
} from 'lucide-react'

// ── Chapter duration (ms) ────────────────────────────────────────────────────
const CHAPTER_MS = 5000

// ── Chapter definitions ──────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 'feed',      label: 'Job Feed',    icon: Zap,       color: 'text-primary'      },
  { id: 'tracker',   label: 'Tracker',     icon: BarChart3, color: 'text-violet-600'   },
  { id: 'proposals', label: 'Proposals',   icon: Wand2,     color: 'text-pink-600'     },
  { id: 'skills',    label: 'Skills',      icon: Layers,    color: 'text-teal-600'     },
  { id: 'platforms', label: 'Platforms',   icon: Building2, color: 'text-indigo-600'   },
  { id: 'roadmap',   label: 'Roadmap',     icon: Map,       color: 'text-amber-600'    },
] as const

type ChapterId = typeof CHAPTERS[number]['id']

// ── Individual screen mockups ────────────────────────────────────────────────
function FeedScreen() {
  const jobs = [
    { title: 'Senior LLM Engineer — RAG Pipeline',       platform: 'Toptal',     rate: '$120–150/hr', match: 94, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-l-emerald-500', rel: '✓ Verified',  relColor: 'text-emerald-600' },
    { title: 'ML Engineer — Fine-tuning & Deployment',   platform: 'Upwork',     rate: '$85–110/hr',  match: 78, badge: 'bg-amber-50 text-amber-700 border-amber-200',       border: 'border-l-amber-400',   rel: '✓ Verified',  relColor: 'text-emerald-600' },
    { title: 'AI Product Engineer — LangGraph Agents',   platform: 'Contra',     rate: '$100–130/hr', match: 71, badge: 'bg-amber-50 text-amber-700 border-amber-200',       border: 'border-l-amber-300',   rel: '⚠ Review',    relColor: 'text-amber-600'   },
    { title: 'MLOps Engineer — AWS SageMaker',           platform: 'Braintrust', rate: '$110–140/hr', match: 65, badge: 'bg-muted text-muted-foreground border-border',       border: 'border-l-blue-400',    rel: '✓ Verified',  relColor: 'text-emerald-600' },
  ]
  return (
    <div className="space-y-2">
      {/* Filter strip */}
      <div className="flex items-center gap-1.5 pb-2 overflow-x-auto scrollbar-none">
        <div className="shrink-0 h-6 px-2.5 rounded-full border border-primary/30 bg-primary/8 text-[10px] text-primary font-semibold flex items-center">All skills</div>
        <div className="shrink-0 h-6 px-2.5 rounded-full border border-border text-[10px] text-muted-foreground flex items-center">$50+/hr</div>
        <div className="shrink-0 h-6 px-2.5 rounded-full border border-border text-[10px] text-muted-foreground flex items-center">Last 7d</div>
        <div className="ml-auto shrink-0 h-6 px-2.5 rounded-full border border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
          <ShieldCheck className="h-2.5 w-2.5" /> Verified only
        </div>
      </div>
      {jobs.map((j, i) => (
        <div key={i} className={`rounded-lg border border-border bg-white px-3 py-2.5 flex items-center justify-between gap-3 border-l-4 ${j.border} shadow-sm`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold text-foreground truncate">{j.title}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${j.badge}`}>{j.match}%</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="text-primary font-semibold">{j.platform}</span>
              <span>{j.rate}</span>
              <span className={`font-semibold ${j.relColor}`}>{j.rel}</span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <div className="h-5 w-10 rounded border border-border text-[10px] text-muted-foreground flex items-center justify-center bg-white">Save</div>
            <div className="h-5 px-2 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-semibold flex items-center">Proposal</div>
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] text-muted-foreground pt-0.5">46 more gigs · sorted by match score</p>
    </div>
  )
}

function TrackerScreen() {
  const summary = [
    { label: 'Saved',        n: 12, bg: 'bg-muted',        t: 'text-muted-foreground' },
    { label: 'Applied',      n: 8,  bg: 'bg-blue-100',     t: 'text-blue-700'         },
    { label: 'Interviewing', n: 3,  bg: 'bg-violet-100',   t: 'text-violet-700'       },
    { label: 'Won',          n: 2,  bg: 'bg-emerald-100',  t: 'text-emerald-700'      },
  ]
  const apps = [
    { title: 'LLM Engineer — RAG System',   platform: 'Toptal',  rate: '$130/hr', status: 'Interviewing', sc: 'bg-violet-100 text-violet-700'  },
    { title: 'ML Engineer — CV Pipeline',   platform: 'Upwork',  rate: '$90/hr',  status: 'Applied',      sc: 'bg-blue-100 text-blue-700'      },
    { title: 'AI Product Lead',             platform: 'Contra',  rate: '$120/hr', status: 'Won',          sc: 'bg-emerald-100 text-emerald-700' },
    { title: 'MLOps Consultant',            platform: 'Gun.io',  rate: '$105/hr', status: 'Applied',      sc: 'bg-blue-100 text-blue-700'      },
  ]
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {summary.map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-2 text-center`}>
            <p className={`text-xl font-bold ${s.t}`}>{s.n}</p>
            <p className={`text-[9px] font-semibold ${s.t} mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {apps.map((a, i) => (
          <div key={i} className="rounded-lg border border-border bg-white px-3 py-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground">{a.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-primary font-semibold">{a.platform}</span>
                <span className="text-[10px] text-muted-foreground">{a.rate}</span>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${a.sc}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProposalsScreen() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pb-1 border-b border-border">
        <span className="font-semibold text-foreground text-xs">Generate Proposal · Toptal</span>
        <span>14 / 15 remaining today</span>
      </div>
      <div className="flex gap-1">
        {['Concise', 'Standard', 'Detailed'].map((v, i) => (
          <span key={v} className={`text-[10px] px-2 py-1 rounded border font-semibold ${i === 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>{v}</span>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2 text-[11px] text-foreground leading-relaxed">
        <p>Your last RAG system had inconsistent retrieval quality — I've fixed that exact issue across three fintech products by rebuilding the chunking strategy and adding a reranking step that cut hallucination rate by 60%.</p>
        <p>My stack: LangChain + pgvector + FastAPI on GCP with monitoring that flags retrieval degradation automatically. I can walk you through the architecture before we start.</p>
        <p className="text-muted-foreground italic">Are you prioritising latency or accuracy — or both?</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] flex items-center gap-1 text-muted-foreground"><CheckCircle className="h-3 w-3 text-emerald-500" />178 words · Standard</span>
        <div className="h-6 px-3 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-semibold flex items-center cursor-pointer">Copy to clipboard</div>
      </div>
      <div className="flex gap-0.5 pt-0.5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-sm ${i < 14 ? 'bg-primary/20' : 'bg-primary'}`} />
        ))}
      </div>
    </div>
  )
}

function SkillsScreen() {
  const clusters = [
    { name: 'LLM Core', skills: [{ n: 'LLMs / Prompt Eng.',  r: 5 }, { n: 'RAG / Vector Search', r: 4 }, { n: 'Fine-tuning', r: 3 }] },
    { name: 'Frameworks', skills: [{ n: 'LangChain', r: 4 }, { n: 'LlamaIndex', r: 3 }, { n: 'LangGraph', r: 0 }] },
  ]
  const LABELS: Record<number, string> = { 1: 'Beginner', 2: 'Some exp.', 3: 'Proficient', 4: 'Advanced', 5: 'Expert' }
  return (
    <div className="space-y-2">
      <div className="h-7 rounded-md border border-border bg-white flex items-center px-3 text-[10px] text-muted-foreground">🔍 Search skills…</div>
      {clusters.map(cluster => (
        <div key={cluster.name} className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-1.5 bg-muted/30 text-[10px] font-semibold text-foreground flex justify-between">
            <span>{cluster.name}</span>
            <span className="text-muted-foreground">{cluster.skills.filter(s => s.r).length}/{cluster.skills.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 p-2">
            {cluster.skills.map(skill => (
              <div key={skill.n} className={`rounded-lg border p-1.5 ${skill.r ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className={`text-[10px] font-semibold truncate ${skill.r ? 'text-primary' : 'text-foreground'}`}>{skill.n}</div>
                {skill.r > 0 && (
                  <>
                    <div className="text-[9px] text-muted-foreground">{LABELS[skill.r]}</div>
                    <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(r => <div key={r} className={`flex-1 h-1 rounded-full ${r <= skill.r ? 'bg-primary' : 'bg-muted'}`} />)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-center text-[10px] text-muted-foreground">8 skills selected · minimum 3</p>
    </div>
  )
}

function PlatformsScreen() {
  const platforms = [
    { name: 'Toptal',     tier: 'Elite',  trust: 95, tc: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
    { name: 'Upwork',     tier: 'Elite',  trust: 88, tc: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
    { name: 'Braintrust', tier: 'Elite',  trust: 90, tc: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
    { name: 'Himalayas',  tier: 'Strong', trust: 80, tc: 'text-blue-700 bg-blue-50 border-blue-200',           bar: 'bg-blue-500'   },
    { name: 'Contra',     tier: 'Elite',  trust: 85, tc: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
    { name: 'Gun.io',     tier: 'Strong', trust: 82, tc: 'text-blue-700 bg-blue-50 border-blue-200',           bar: 'bg-blue-500'   },
  ]
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {platforms.map(p => (
          <div key={p.name} className="rounded-lg border border-border bg-white p-2.5 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-bold text-foreground">{p.name}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${p.tc}`}>{p.tier}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.bar}`} style={{ width: `${p.trust}%` }} />
                </div>
                <span className="text-[9px] text-muted-foreground shrink-0">{p.trust}/100</span>
              </div>
            </div>
            <Star className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

function RoadmapScreen() {
  const gaps = [
    { skill: 'LangGraph',    jobs: 14, rate: '$115/hr', hours: '3h', pct: 95 },
    { skill: 'vLLM / TGI',  jobs: 11, rate: '$120/hr', hours: '4h', pct: 78 },
    { skill: 'LoRA / QLoRA', jobs: 9,  rate: '$105/hr', hours: '5h', pct: 62 },
  ]
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] pb-1 border-b border-border">
        <span className="font-semibold text-foreground text-xs">3 skill gaps · sorted by ROI</span>
        <span className="text-muted-foreground">$115/hr avg top gap</span>
      </div>
      {gaps.map(({ skill, jobs, rate, hours, pct }) => (
        <div key={skill} className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">{skill}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-semibold"><Zap className="h-2.5 w-2.5" />{jobs} jobs</span>
                <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-semibold"><TrendingUp className="h-2.5 w-2.5" />{rate}</span>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />~{hours}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
          </div>
          <div className="h-5 rounded border border-border bg-white text-[10px] text-muted-foreground flex items-center justify-center">View free course →</div>
        </div>
      ))}
    </div>
  )
}

const SCREENS: Record<ChapterId, React.ReactNode> = {
  feed:      <FeedScreen />,
  tracker:   <TrackerScreen />,
  proposals: <ProposalsScreen />,
  skills:    <SkillsScreen />,
  platforms: <PlatformsScreen />,
  roadmap:   <RoadmapScreen />,
}

const DESCRIPTIONS: Record<ChapterId, { headline: string; sub: string }> = {
  feed:      { headline: 'Smart job matching, not a job board', sub: '50+ fresh AI/ML gigs ranked daily by skill overlap, rate fit, and recency.' },
  tracker:   { headline: 'Every application, one pipeline', sub: '9-stage tracker from Saved → Won. Log rates, notes, and see what platforms convert.' },
  proposals: { headline: '3 inputs. 3 Claude-crafted variants.', sub: 'Platform-style rules applied automatically. No filler words. 15 generations per day.' },
  skills:    { headline: '79 skills across 10 clusters', sub: 'Rate each skill 1–5. Ratings feed directly into match scoring and roadmap analysis.' },
  platforms: { headline: 'Know before you apply', sub: '10 platforms with setup guides, red flags, and honest member reviews.' },
  roadmap:   { headline: 'Know exactly what to learn next', sub: 'Skill gaps ranked by jobs unlocked × average rate, each linked to the best free course.' },
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function FeatureDemoSection() {
  const [chapter, setChapter]   = useState(0)
  const [playing, setPlaying]   = useState(true)
  const [progress, setProgress] = useState(0)
  const [fading, setFading]     = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef     = useRef<ReturnType<typeof setInterval> | null>(null)
  const TICK = 50 // ms per tick

  const goTo = useCallback((idx: number, keepPlaying = true) => {
    setFading(true)
    setTimeout(() => {
      setChapter(idx)
      setProgress(0)
      setFading(false)
    }, 200)
    if (!keepPlaying) setPlaying(false)
  }, [])

  const advance = useCallback(() => {
    setChapter(c => {
      const next = (c + 1) % CHAPTERS.length
      setFading(true)
      setTimeout(() => { setFading(false) }, 200)
      return next
    })
    setProgress(0)
  }, [])

  // Progress ticker
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!playing) return
    tickRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          advance()
          return 0
        }
        return p + (TICK / CHAPTER_MS) * 100
      })
    }, TICK)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [playing, advance])

  const activeChapter = CHAPTERS[chapter]
  const { headline, sub } = DESCRIPTIONS[activeChapter.id]

  return (
    <section id="demo" className="py-24 bg-white px-4">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
            Interactive demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            See every feature
            <span className="block text-primary">live in the app</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            A guided walkthrough of all 6 modules — click any chapter or hit play.
          </p>
        </div>

        {/* Player */}
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl border border-border bg-white shadow-2xl shadow-foreground/8 overflow-hidden">

            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/10 via-violet-400/5 to-blue-400/10 pointer-events-none" />

            {/* Browser chrome */}
            <div className="relative flex items-center gap-3 px-5 py-3 border-b border-border bg-muted/40">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 h-6 rounded-md bg-border/50 flex items-center px-3">
                <span className="text-xs text-muted-foreground/60">app.aiml-hub.com/{activeChapter.id}</span>
              </div>
              {/* Live badge */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${playing ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
                {playing ? 'Live' : 'Paused'}
              </div>
            </div>

            {/* Main area: description left, mockup right */}
            <div className="grid lg:grid-cols-[1fr_1.3fr] min-h-[420px]">

              {/* Left: chapter info */}
              <div className="flex flex-col justify-between p-8 border-r border-border bg-muted/10">
                <div>
                  {/* Chapter icon + label */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <activeChapter.icon className={`h-4.5 w-4.5 ${activeChapter.color}`} />
                    </div>
                    <span className={`text-sm font-bold ${activeChapter.color}`}>{activeChapter.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{chapter + 1} / {CHAPTERS.length}</span>
                  </div>

                  {/* Headline + sub */}
                  <div className={`transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                    <h3 className="text-2xl font-bold text-foreground leading-snug mb-3">{headline}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{sub}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="mt-8">
                  {/* Progress bar */}
                  <div className="h-1 rounded-full bg-muted overflow-hidden mb-4">
                    <div
                      className="h-full bg-primary rounded-full transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Play / skip buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => goTo((chapter - 1 + CHAPTERS.length) % CHAPTERS.length)}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Previous chapter"
                    >
                      <SkipBack className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaying(p => !p)}
                      className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/30 hover:bg-primary/90 transition-colors"
                      aria-label={playing ? 'Pause' : 'Play'}
                    >
                      {playing
                        ? <Pause className="h-4 w-4 text-primary-foreground" fill="currentColor" />
                        : <Play  className="h-4 w-4 text-primary-foreground ml-0.5" fill="currentColor" />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo((chapter + 1) % CHAPTERS.length)}
                      className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      aria-label="Next chapter"
                    >
                      <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: live mockup */}
              <div className="relative bg-muted/5 overflow-hidden">
                <div className={`p-5 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                  {SCREENS[activeChapter.id]}
                </div>
              </div>
            </div>

            {/* Chapter strip */}
            <div className="relative flex border-t border-border bg-muted/20">
              {CHAPTERS.map((ch, i) => {
                const Icon = ch.icon
                const isActive = i === chapter
                const isDone   = i < chapter
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => { goTo(i); setPlaying(true) }}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 text-center transition-colors relative
                      ${isActive ? 'bg-white text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
                    aria-label={`Go to ${ch.label}`}
                  >
                    {/* Progress fill on active */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 h-0.5 bg-primary transition-none"
                        style={{ width: `${progress}%` }}
                      />
                    )}
                    {/* Completed indicator */}
                    {isDone && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/30" />}
                    <Icon className={`h-3.5 w-3.5 ${isActive ? ch.color : ''}`} />
                    <span className="text-[10px] font-semibold hidden sm:block">{ch.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
