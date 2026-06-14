'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Info, Sparkles, Loader2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { PageContainer, RailCard } from '@/components/app-shell/PageContainer'

const PLATFORMS = [
  { slug: 'upwork',     name: 'Upwork' },
  { slug: 'toptal',     name: 'Toptal' },
  { slug: 'contra',     name: 'Contra' },
  { slug: 'braintrust', name: 'Braintrust' },
  { slug: 'mercor',     name: 'Mercor' },
]

type AuditItem = { issue: string; fix: string; impact: string }
type AuditResult = { critical: AuditItem[]; important: AuditItem[]; nice_to_have: AuditItem[] }

const SECTION_CONFIG = {
  critical:     { label: 'Critical — fix before applying', icon: AlertTriangle, color: 'text-red-700',    bg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' },
  important:    { label: 'Important',                       icon: Info,           color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
  nice_to_have: { label: 'Nice to have',                    icon: Sparkles,       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' },
}

function AuditSection({ type, items, done, onToggle }: {
  type: keyof typeof SECTION_CONFIG
  items: AuditItem[]
  done: Set<string>
  onToggle: (key: string) => void
}) {
  const { label, icon: Icon, color, bg } = SECTION_CONFIG[type]
  if (!items?.length) return null
  return (
    <div className="space-y-2">
      <div className={cn('flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border', bg, color)}>
        <Icon className="h-4 w-4" />{label}
      </div>
      {items.map((item, i) => {
        const key = `${type}-${i}`
        return (
          <div key={i} className={cn('border rounded-lg p-4 space-y-1.5 transition-opacity', done.has(key) ? 'opacity-50' : '')}>
            <div className="flex items-start gap-2.5">
              <Checkbox id={key} checked={done.has(key)} onCheckedChange={() => onToggle(key)} className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <label htmlFor={key} className={cn('text-sm font-medium cursor-pointer', done.has(key) ? 'line-through text-muted-foreground' : '')}>
                  {item.issue}
                </label>
                <p className="text-xs text-muted-foreground">{item.fix}</p>
                {item.impact && (
                  <Badge variant="outline" className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                    {item.impact}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface Benchmark {
  platform: string; count: number
  min: number; p25: number; p50: number; p75: number; max: number; avg: number
}

export default function AuditPage() {
  const [platform, setPlatform] = useState('')
  const [loading, setLoading]   = useState(false)
  const [audit, setAudit]       = useState<AuditResult | null>(null)
  const [platformName, setPlatformName] = useState('')
  const [done, setDone]         = useState<Set<string>>(new Set())
  const [benchmarks, setBenchmarks]     = useState<Benchmark[]>([])
  const [benchLoading, setBenchLoading] = useState(true)

  useEffect(() => {
    fetch('/api/audit/benchmarks')
      .then(r => r.json())
      .then(d => { setBenchmarks(d.benchmarks ?? []); setBenchLoading(false) })
      .catch(() => setBenchLoading(false))
  }, [])

  function toggleDone(key: string) {
    setDone(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  async function runAudit() {
    if (!platform) { toast.error('Select a platform first'); return }
    setLoading(true); setAudit(null); setDone(new Set())
    const res = await fetch(`/api/audit/${platform}`)
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Audit failed'); setLoading(false); return }
    setAudit(data.audit)
    setPlatformName(data.platform)
    setLoading(false)
  }

  const totalItems = audit ? (audit.critical?.length ?? 0) + (audit.important?.length ?? 0) + (audit.nice_to_have?.length ?? 0) : 0
  const doneCount  = done.size
  const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0

  const aside = !audit ? undefined : (
    <RailCard title="Fix progress" icon={TrendingUp}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight">{pct}%</span>
        <span className="text-xs text-muted-foreground">{doneCount}/{totalItems} done</span>
      </div>
      <Progress value={pct} aria-label="Audit fix progress" className="mb-3" />
      <dl className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />Critical
          </dt>
          <dd className="font-semibold tabular-nums">{audit.critical?.length ?? 0}</dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-3.5 w-3.5 text-amber-600" />Important
          </dt>
          <dd className="font-semibold tabular-nums">{audit.important?.length ?? 0}</dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />Nice to have
          </dt>
          <dd className="font-semibold tabular-nums">{audit.nice_to_have?.length ?? 0}</dd>
        </div>
      </dl>
    </RailCard>
  )

  return (
    <div className="bg-background">
      <PageContainer aside={aside} maxWidth="max-w-5xl" className="space-y-8">
        <div>
          <h1 className="page-header">Profile Audit</h1>
          <p className="page-subheader">AI-powered profile review tailored to each platform&apos;s specific norms.</p>
        </div>

        <div className="flex gap-3">
          <Select value={platform} onValueChange={v => setPlatform(v ?? '')}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a platform…" />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={runAudit} disabled={loading || !platform} className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Auditing…' : 'Run audit'}
          </Button>
        </div>

        {/* ── Rate Benchmarks ─────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Group Rate Benchmarks</h2>
            <span className="text-xs text-muted-foreground">(from won applications)</span>
          </div>
          {benchLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading benchmarks…
            </div>
          ) : benchmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No won applications logged yet — benchmarks appear once members record won outcomes in the tracker.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {['Platform', 'P25', 'Median', 'P75', 'Avg', 'Wins'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {benchmarks.map(b => (
                    <tr key={b.platform} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium">{b.platform}</td>
                      <td className="px-3 py-2 text-muted-foreground">${b.p25}/hr</td>
                      <td className="px-3 py-2 font-semibold text-foreground">${b.p50}/hr</td>
                      <td className="px-3 py-2 text-muted-foreground">${b.p75}/hr</td>
                      <td className="px-3 py-2 text-muted-foreground">${b.avg}/hr</td>
                      <td className="px-3 py-2 text-muted-foreground">{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {audit && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{platformName} Profile Audit</h2>
              {totalItems > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.round((doneCount / totalItems) * 100)}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{doneCount}/{totalItems} done</span>
                </div>
              )}
            </div>

            <AuditSection type="critical"     items={audit.critical}     done={done} onToggle={toggleDone} />
            <AuditSection type="important"    items={audit.important}    done={done} onToggle={toggleDone} />
            <AuditSection type="nice_to_have" items={audit.nice_to_have} done={done} onToggle={toggleDone} />

            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                After making changes, re-run the audit to confirm improvements. Check the{' '}
                <a href="/roadmap" className="text-primary underline">roadmap</a> to see which skill gaps to close next.
              </p>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  )
}
