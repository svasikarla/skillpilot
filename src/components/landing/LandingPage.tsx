'use client'

import Link from 'next/link'
import {
  Brain, Zap, BarChart2, Layers, TrendingUp, FileText,
  Sparkles, ArrowRight, ChevronRight,
  Shield, Globe, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'AI Job Matching',
    description: 'Semantic embeddings rank every opportunity by fit with your exact skill profile — no more keyword roulette.',
  },
  {
    icon: Zap,
    title: 'Skill Extraction',
    description: 'Paste your CV or bio and your skills are extracted, normalised, and mapped to live market demand instantly.',
  },
  {
    icon: BarChart2,
    title: 'Reliability Scoring',
    description: 'Every listing is scored for legitimacy and compensation fairness before it ever reaches your feed.',
  },
  {
    icon: Layers,
    title: 'Platform Tracker',
    description: 'Monitor Upwork, Toptal, Contra, and more — unified across all platforms from one dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Skill Roadmap',
    description: 'Identify the gaps between your current profile and the highest-paying AI/ML roles in the market.',
  },
  {
    icon: FileText,
    title: 'Proposal Generator',
    description: 'Draft tailored, high-converting proposals with AI assistance in seconds, not hours.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Complete Your Profile',
    description: 'Walk through the onboarding wizard. Add your skills, rates, portfolio, and platform accounts in minutes.',
  },
  {
    number: '02',
    title: 'Review Your Feed',
    description: 'SkillPilot surfaces and ranks remote AI/ML contracts from across the web, matched precisely to your profile.',
  },
  {
    number: '03',
    title: 'Apply & Track',
    description: 'Generate proposals, apply in one click, and track every opportunity through your pipeline.',
  },
]

const stats = [
  { label: 'Invite-Only Network', icon: Shield },
  { label: 'AI-Matched Opportunities', icon: Brain },
  { label: 'Multi-Platform Coverage', icon: Globe },
  { label: 'Vetted Job Sources', icon: Star },
]

const mockJobs = [
  { title: 'Senior ML Engineer', platform: 'Toptal', match: '97%', reliable: true },
  { title: 'AI Research Contractor', platform: 'Contra', match: '94%', reliable: true },
  { title: 'LLM Fine-tuning Specialist', platform: 'Upwork', match: '91%', reliable: true },
  { title: 'Computer Vision Lead', platform: 'Wellfound', match: '88%', reliable: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/40">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">SkillPilot</span>
          </div>

          <nav className="flex items-center gap-6">
            <a href="#features"     className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">How it works</a>
            <Button asChild size="sm" className="gap-1.5 shadow-sm shadow-primary/30">
              <Link href="/login">Sign in <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-32">
        {/* Ambient glow orbs */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-[-15%] left-[15%] h-[700px] w-[700px] rounded-full bg-primary/8 blur-[140px]" />
          <div className="absolute top-[10%] right-[5%]  h-[400px] w-[400px] rounded-full bg-accent     blur-[100px]" />
          <div className="absolute bottom-0   left-[40%] h-[300px] w-[500px] rounded-full bg-primary/5 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-7 border-primary/30 bg-primary/5 text-primary px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase"
          >
            Private · Invite-Only · AI-Powered
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-tight leading-[1.06] mb-6">
            Your AI Command Centre
            <br />
            <span className="text-primary">for AI/ML Freelancing</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            SkillPilot surfaces, ranks, and tracks remote AI/ML contracts from across the web —
            so you spend less time hunting and more time building.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
            <Button asChild size="lg" className="gap-2 px-9 shadow-xl shadow-primary/25 font-semibold">
              <Link href="/login">Request Access <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 px-9">
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* ── Browser-frame mock feed ── */}
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden text-left">
            {/* Window chrome */}
            <div className="border-b border-border bg-muted/60 px-4 py-3 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-400/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/60" />
              <span className="h-3 w-3 rounded-full bg-green-400/60" />
              <span className="ml-4 flex-1 rounded-md bg-background/70 border border-border px-3 py-1 text-[11px] text-muted-foreground font-mono">
                skillpilot.app/feed
              </span>
            </div>

            {/* Mock job cards */}
            <div className="p-5 grid sm:grid-cols-2 gap-3">
              {mockJobs.map((job, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-xl border border-border bg-background px-4 py-3.5 hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.platform}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                    <span className="text-xs font-bold text-primary">{job.match} match</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      Reliable
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/25 py-7 px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 justify-center">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to win more contracts
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Built specifically for AI/ML freelancers — every feature addresses a real friction point in the freelance workflow.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-28 bg-muted/20 border-y border-border">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold tracking-widest uppercase px-4 py-1.5">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From invitation to pipeline in minutes
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Three steps from receiving your invite to having a fully personalised AI/ML job feed.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-10 relative">
            {steps.map(({ number, title, description }, i) => (
              <div key={number} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/30 shrink-0">
                  <span className="text-primary-foreground font-bold text-lg font-mono">{number}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

                {i < steps.length - 1 && (
                  <ChevronRight className="hidden sm:block absolute top-[18px] -right-5 h-5 w-5 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-3xl">
          <div className="relative rounded-3xl bg-primary px-8 py-16 text-center overflow-hidden">
            {/* Inner glow */}
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            </div>

            <Sparkles className="h-8 w-8 text-primary-foreground/60 mx-auto mb-5" />
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight mb-4">
              Built for serious AI/ML freelancers
            </h2>
            <p className="text-primary-foreground/75 text-lg mb-9 max-w-md mx-auto leading-relaxed">
              Join the invite-only network and let SkillPilot run your job search on autopilot.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 px-10 font-semibold shadow-2xl"
            >
              <Link href="/login">Request Access <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">SkillPilot</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SkillPilot · AI/ML Freelance Command Centre
          </p>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Sign in →
          </Link>
        </div>
      </footer>

    </div>
  )
}
