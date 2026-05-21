import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap, ShieldCheck, Brain, Wand2, BarChart3, Map, Building2,
  Users, ArrowRight, CheckCircle, Star, ChevronRight, Sparkles,
  TrendingUp, Clock, Globe, Lock, BookOpen,
} from 'lucide-react'

export const metadata = {
  title: 'AI/ML Freelance Hub — Private Command Centre for AI/ML Practitioners',
  description: 'Find vetted AI/ML gigs ranked to your skills, generate tailored proposals with Claude, track outcomes, and level up with a private group of 30 practitioners.',
}

// ── Shared types ───────────────────────────────────────────────────────────────
interface Feature {
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  badgeColor?: string
}

// ── Landing Nav ────────────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">AI/ML Freelance Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Sign in</Link>
          <Link href="/login">
            <Button size="sm" className="h-8 text-xs font-medium bg-primary hover:bg-primary/90 shadow-md shadow-primary/25">
              Get access <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ── Hero Section ───────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 pt-14">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-600/6 blur-[80px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Private · 25–30 AI/ML practitioners · Invite only
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-none tracking-tight mb-6">
          The AI/ML Freelance
          <span className="block mt-2 bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            Command Centre
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
          Stop hunting across 10 job boards. Get vetted AI/ML gigs ranked to your exact skills, generate
          winning proposals with Claude, and track outcomes — all in one private tool.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-sm font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 gap-2">
              Sign in to your workspace <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#features" className="h-12 px-8 text-sm font-medium text-slate-300 hover:text-white border border-white/10 rounded-md flex items-center gap-2 hover:border-white/20 transition-all">
            Explore features <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mock UI preview */}
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/40 via-violet-500/20 to-blue-500/30 blur-md opacity-60" />
          <div className="relative rounded-xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-2xl">
            {/* Mock toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-950/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 h-5 rounded bg-slate-800/60 mx-4" />
            </div>
            {/* Mock nav */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/8 bg-slate-900/50">
              <div className="flex items-center gap-2 mr-4">
                <div className="w-5 h-5 rounded bg-primary/80" />
                <div className="h-3 w-24 rounded bg-white/20" />
              </div>
              {['Feed', 'Tracker', 'Platforms', 'Roadmap', 'Community'].map(label => (
                <div key={label} className={`px-3 py-1 rounded text-xs ${label === 'Feed' ? 'bg-primary/20 text-primary' : 'text-slate-500'}`}>{label}</div>
              ))}
            </div>
            {/* Mock job cards */}
            <div className="p-4 space-y-3">
              {[
                { title: 'Senior LLM Engineer — RAG Pipeline', platform: 'Toptal', rate: '$120–150/hr', match: 94, rel: 'Verified', relColor: 'text-emerald-400' },
                { title: 'ML Engineer — Fine-tuning & Deployment', platform: 'Upwork', rate: '$85–110/hr', match: 78, rel: 'Verified', relColor: 'text-emerald-400' },
                { title: 'AI Product Engineer — LangGraph Agents', platform: 'Contra', rate: '$100–130/hr', match: 71, rel: 'Review', relColor: 'text-yellow-400' },
              ].map((job, i) => (
                <div key={i} className={`rounded-lg border bg-slate-800/60 p-3 flex items-center justify-between gap-4 border-l-4 ${
                  job.match >= 80 ? 'border-l-emerald-500 border-white/8' : job.match >= 70 ? 'border-l-amber-400 border-white/8' : 'border-l-white/20 border-white/6'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-white font-medium truncate">{job.title}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        job.match >= 80 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{job.match}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="text-indigo-400 font-medium">{job.platform}</span>
                      <span>{job.rate}</span>
                      <span className={job.relColor}>✓ {job.rel}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <div className="h-6 w-14 rounded bg-white/8 text-xs text-slate-400 flex items-center justify-center">Save</div>
                    <div className="h-6 w-20 rounded bg-primary/30 text-xs text-primary flex items-center justify-center">Proposal</div>
                  </div>
                </div>
              ))}
              <div className="text-center py-1 text-xs text-slate-600">47 more gigs · sorted by match score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500">
        <span className="text-xs">Scroll to explore</span>
        <div className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent" />
      </div>
    </section>
  )
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────
function StatsBar() {
  const stats = [
    { value: '3', label: 'Live job sources' },
    { value: '50+', label: 'AI/ML gigs daily' },
    { value: '0–100', label: 'Reliability score' },
    { value: '15', label: 'Proposals per day' },
  ]
  return (
    <div className="bg-slate-950 border-y border-white/6">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Features Section ───────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Live Job Ingestion',
    description: 'Fresh AI/ML gigs pulled daily from Remotive, RemoteOK, and Himalayas. Deduplicated, filtered for relevance, and auto-scored before you see them.',
    badge: 'Daily',
    badgeColor: 'bg-blue-500/15 text-blue-400',
  },
  {
    icon: ShieldCheck,
    title: 'Reliability Scoring',
    description: '0–100 trust score on every listing. Green = verified professional platform, Amber = review carefully, Red = caution. Scam signals detected automatically.',
    badge: '20+ signals',
    badgeColor: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    icon: Brain,
    title: 'Skill-Weighted Matching',
    description: 'Jobs ranked by your exact fit — 60% skill overlap weighted by self-rated proficiency, 20% rate alignment, 20% recency decay. No irrelevant noise.',
    badge: '79 skills',
    badgeColor: 'bg-violet-500/15 text-violet-400',
  },
  {
    icon: Wand2,
    title: 'Proposal Generator',
    description: 'Fill 3 inputs. Get 3 Claude-powered proposal variants (concise, standard, detailed) tailored to the job and platform style. No em-dashes, no clichés.',
    badge: '15/day',
    badgeColor: 'bg-pink-500/15 text-pink-400',
  },
  {
    icon: BarChart3,
    title: 'Application Tracker',
    description: 'Every saved gig tracked through 9 stages from Saved → Won. Log your proposed rate, agreed rate, notes, and response time. See what platforms convert.',
    badge: '9 stages',
    badgeColor: 'bg-amber-500/15 text-amber-400',
  },
  {
    icon: Map,
    title: 'Upskilling Roadmap',
    description: 'See exactly which skills are missing from your profile — ranked by the number of jobs they unlock × average rate. Each gap links to the best free course.',
    badge: '52 courses',
    badgeColor: 'bg-teal-500/15 text-teal-400',
  },
  {
    icon: Building2,
    title: 'Platform Intelligence',
    description: '10 platforms with AI/ML-specific setup guides, application tips, red flags to avoid, and member reviews. Know which platforms are worth your time before signing up.',
    badge: '10 platforms',
    badgeColor: 'bg-indigo-500/15 text-indigo-400',
  },
  {
    icon: Users,
    title: 'Group Intelligence',
    description: 'Anonymous group win data — which platforms have the best win rates, what rates are being agreed, which skills are paying most this month. Collective signal.',
    badge: 'Anonymised',
    badgeColor: 'bg-cyan-500/15 text-cyan-400',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-background px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5 text-xs font-medium">
            Everything you need
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Built for how AI/ML
            <br /><span className="text-primary">freelancers actually work</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
            Eight integrated modules. One private tool. From discovery to signed contract.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, description, badge, badgeColor }) => (
            <div key={title} className="group card-elevated rounded-xl p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                {badge && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 leading-tight">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ───────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Set up your profile',
      description: 'Pick your skills from 79 in 10 clusters. Rate your proficiency 1–5. Add your target hourly rate.',
      icon: Sparkles,
    },
    {
      number: '02',
      title: 'Browse your ranked feed',
      description: 'See 50+ fresh AI/ML gigs ranked by match score. Filter by skill, rate, or verified-only.',
      icon: Globe,
    },
    {
      number: '03',
      title: 'Generate a proposal',
      description: 'Fill 3 inputs. Get 3 Claude-generated proposal variants tailored to the job and platform in seconds.',
      icon: Wand2,
    },
    {
      number: '04',
      title: 'Track and win',
      description: 'Log every application, update status, record outcomes. The group\'s collective data surfaces what works.',
      icon: TrendingUp,
    },
  ]

  return (
    <section className="py-24 bg-muted/30 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5 text-xs font-medium">
            Simple workflow
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">From zero to landed in 4 steps</h2>
          <p className="text-muted-foreground max-w-md mx-auto">No onboarding videos. No complicated setup. Working in under 10 minutes.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map(({ number, title, description, icon: Icon }, i) => (
            <div key={number} className="flex flex-col items-center text-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-card border border-border flex flex-col items-center justify-center shadow-sm shrink-0 z-10">
                <span className="text-xs font-bold text-primary/60 mb-1">{number}</span>
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Spotlight: Proposal Generator ─────────────────────────────────────────────
function ProposalSpotlightSection() {
  return (
    <section className="py-24 px-4 bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-pink-300/50 text-pink-600 bg-pink-500/5 text-xs font-medium">
              Powered by Claude
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Write once.<br />
              <span className="text-primary">Win more.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The proposal generator takes 3 quick inputs and returns 3 Claude-crafted variants in seconds. Each one is tuned to the platform's style norms — Upwork proposals sound different from Contra proposals. Quality enforced by rule: no filler words, no em-dashes, hook in sentence one.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Concise (140–150w), Standard (175–185w), Detailed (210–220w)',
                'Platform-specific style guide applied automatically',
                'Editable inline — copy, tweak, send',
                '15 generations per day per member',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/login">
              <Button className="gap-2 shadow-md shadow-primary/20">
                Try the proposal generator <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mock proposal panel */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 to-violet-500/5 rounded-3xl blur-2xl" />
            <div className="relative card-elevated rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Generate Proposal · Toptal</span>
                <span className="text-xs text-muted-foreground">14 / 15 remaining today</span>
              </div>
              {/* Variant tabs */}
              <div className="flex gap-1 px-4 pt-4">
                {['Concise', 'Standard', 'Detailed'].map((v, i) => (
                  <span key={v} className={`text-xs px-2.5 py-1 rounded-md border font-medium ${i === 1 ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>{v}</span>
                ))}
              </div>
              {/* Mock proposal text */}
              <div className="p-4">
                <div className="text-xs text-foreground leading-relaxed space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                  <p>Your last RAG system had inconsistent retrieval quality — I've fixed that exact issue across three fintech products by rebuilding the chunking strategy and adding a reranking step that cut hallucination rate by 60%.</p>
                  <p>My stack: LangChain + pgvector + FastAPI, deployed on GCP with a monitoring setup that flags retrieval degradation automatically. I can show you the architecture before we start.</p>
                  <p className="text-muted-foreground">Are you prioritising latency or accuracy in the retrieval step — or do you need both optimised simultaneously?</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-xs text-primary font-medium cursor-pointer">Copy to clipboard</div>
                  <div className="h-8 w-8 rounded-md border border-border flex items-center justify-center cursor-pointer hover:bg-muted">
                    <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Spotlight: Match Scoring ───────────────────────────────────────────────────
function MatchSpotlightSection() {
  return (
    <section className="py-24 px-4 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Mock match breakdown */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/8 to-primary/5 rounded-3xl blur-2xl" />
            <div className="relative card-elevated rounded-xl p-5 space-y-4">
              {/* Job header */}
              <div className="border-b border-border pb-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">MLOps Engineer — AWS SageMaker</p>
                    <p className="text-xs text-primary font-medium mt-0.5">Toptal</p>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">89%</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <span className="match-high text-xs px-2 py-0.5 rounded-full">89% match</span>
                  <span className="tier-green text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                </div>
              </div>
              {/* Score breakdown */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match breakdown</p>
                {[
                  { label: 'Skill overlap', score: 91, weight: '60%', color: 'bg-primary' },
                  { label: 'Rate alignment', score: 100, weight: '20%', color: 'bg-emerald-500' },
                  { label: 'Recency', score: 73, weight: '20%', color: 'bg-amber-400' },
                ].map(({ label, score, weight, color }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label} <span className="text-muted-foreground/60">({weight})</span></span>
                      <span className="font-medium text-foreground">{score}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Matched skills */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your matched skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Python', 'MLOps / LLMOps', 'AWS SageMaker', 'Docker', 'CI/CD for ML'].map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Badge variant="outline" className="mb-4 border-emerald-300/50 text-emerald-700 bg-emerald-500/5 text-xs font-medium">
              Personalised ranking
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Not a job board.<br />
              <span className="text-primary">Your personal ranker.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Every gig is scored against your profile — not just keyword matching. Skill overlap is weighted by how you rated your own proficiency. Rate fit and posting recency layer in. Jobs you'd crush rise to the top; everything else falls away.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                '79 skills across 10 technical clusters — rate yourself 1–5',
                'Hard gate: if you match &lt;40% of required skills, score is capped',
                'Feed re-sorts automatically as new gigs arrive daily',
                '"Verified only" filter shows only reliability score ≥ 70',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-sm" dangerouslySetInnerHTML={{ __html: `<span class="shrink-0 mt-0.5" style="color:var(--primary)">✓</span> <span>${item}</span>` }} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Platform Preview ───────────────────────────────────────────────────────────
function PlatformSection() {
  const platforms = [
    { name: 'Toptal', tier: 1, trust: 95, label: 'Elite', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700' },
    { name: 'Upwork', tier: 1, trust: 88, label: 'Elite', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700' },
    { name: 'Braintrust', tier: 1, trust: 90, label: 'Elite', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700' },
    { name: 'Contra', tier: 1, trust: 85, label: 'Elite', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-700' },
    { name: 'Himalayas', tier: 2, trust: 80, label: 'Strong', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-700' },
    { name: 'Gun.io', tier: 2, trust: 82, label: 'Strong', color: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-700' },
  ]

  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/5 text-xs font-medium">
            Platform intelligence
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Know before you apply
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            10 platforms — each with an AI/ML-specific setup guide, red flags to avoid, and honest member reviews. No more wasting weeks on a platform that doesn't suit your niche.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {platforms.map(p => (
            <div key={p.name} className="card-elevated rounded-xl p-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 w-24 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.trust >= 85 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${p.trust}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Trust {p.trust}/100</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-primary/60" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: BookOpen, title: 'Setup guides', desc: 'Step-by-step profile setup specific to AI/ML freelancers on each platform.' },
            { icon: ShieldCheck, title: 'Red flags', desc: 'Scam patterns, payment risks, and reputation signals to watch for.' },
            { icon: Star, title: 'Member reviews', desc: 'Honest reviews from the group — what actually works for AI/ML work.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-base rounded-xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Privacy & Group Section ────────────────────────────────────────────────────
function PrivacySection() {
  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight mb-6">Private by design</h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-12 max-w-xl mx-auto">
          This is not a public product. It's a private tool for a closed group of 25–30 AI/ML practitioners who share a commitment to quality work and honest data.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Invite only',
              desc: 'No public sign-up. Access is by group invitation. Each member is known to the group.',
              icon: Users,
            },
            {
              title: 'Your data stays yours',
              desc: 'Application outcomes and rates are aggregated and anonymised. No member can see another\'s individual data.',
              icon: Lock,
            },
            {
              title: 'Shared intelligence only',
              desc: 'What the group shares is collective stats — win rates, platform rankings, skill trends. Nothing personally identifiable.',
              icon: ShieldCheck,
            },
          ].map(({ title, desc, icon: Icon }) => (
            <div key={title} className="card-elevated rounded-xl p-6 text-left">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Roadmap Spotlight ──────────────────────────────────────────────────────────
function RoadmapSection() {
  const gaps = [
    { skill: 'LangGraph', jobs: 14, rate: '$115/hr', hours: '3h', impact: 95 },
    { skill: 'vLLM / TGI', jobs: 11, rate: '$120/hr', hours: '4h', impact: 78 },
    { skill: 'LoRA / QLoRA', jobs: 9, rate: '$105/hr', hours: '5h', impact: 62 },
  ]

  return (
    <section className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-teal-300/50 text-teal-700 bg-teal-500/5 text-xs font-medium">
              Upskilling roadmap
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight mb-6">
              Know exactly
              <br /><span className="text-primary">what to learn next</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              The roadmap analyses every active job against your profile and ranks skill gaps by ROI — jobs unlocked × average rate. Each gap links directly to the best free course. No guesswork. No paid subscriptions needed.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { value: '79', label: 'Skills tracked' },
                { value: '52', label: 'Free courses' },
                { value: '10', label: 'Skill clusters' },
              ].map(({ value, label }) => (
                <div key={label} className="card-base rounded-lg px-4 py-3 text-center">
                  <p className="text-xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mock roadmap */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-teal-500/8 to-primary/5 rounded-3xl blur-2xl" />
            <div className="relative card-elevated rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="text-xs font-semibold">Skill Roadmap · 3 gaps found</span>
                <span className="text-xs text-muted-foreground">$115/hr avg top gap</span>
              </div>
              <div className="p-4 space-y-3">
                {gaps.map(({ skill, jobs, rate, hours, impact }) => (
                  <div key={skill} className="card-base rounded-lg p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{skill}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-amber-600 flex items-center gap-1">
                            <Zap className="h-3 w-3" />{jobs} jobs need this
                          </span>
                          <span className="text-xs text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />{rate} avg
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />~{hours}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${impact}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{impact}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── CTA Section ────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="py-32 px-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/12 blur-[100px]" />
      </div>
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs text-primary font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Ready when you are
        </div>
        <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          Stop searching.<br />
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Start winning.
          </span>
        </h2>
        <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Your next AI/ML contract is already in the feed. Sign in and it'll be ranked #1 — if it's the right fit.
        </p>
        <Link href="/login">
          <Button size="lg" className="h-12 px-10 text-sm font-semibold bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 gap-2">
            Sign in to your workspace <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/6 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-primary/80 flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="text-sm text-slate-400">AI/ML Freelance Hub</span>
        </div>
        <p className="text-xs text-slate-600">Private tool · 25–30 members · By invitation only</p>
      </div>
    </footer>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  // Authenticated users go straight to the app
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/feed')

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <ProposalSpotlightSection />
      <MatchSpotlightSection />
      <PlatformSection />
      <RoadmapSection />
      <PrivacySection />
      <CTASection />
      <Footer />
    </div>
  )
}
