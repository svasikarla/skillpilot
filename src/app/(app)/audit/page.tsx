'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { AuditResult, AuditIssue } from '@/app/api/audit/[platformSlug]/route'

const PLATFORM_SLUGS: { slug: string; name: string }[] = [
  { slug: 'upwork',     name: 'Upwork' },
  { slug: 'toptal',     name: 'Toptal' },
  { slug: 'arc',        name: 'Arc.dev' },
  { slug: 'contra',     name: 'Contra' },
  { slug: 'braintrust', name: 'Braintrust' },
  { slug: 'gunio',      name: 'Gun.io' },
  { slug: 'freelancer', name: 'Freelancer.com' },
  { slug: 'fiverr-pro', name: 'Fiverr Pro' },
]

const TIER_COLORS = {
  critical:     'text-destructive border-destructive/30 bg-destructive/5',
  important:    'text-yellow-700 border-yellow-300 bg-yellow-50',
  nice_to_have: 'text-blue-700 border-blue-300 bg-blue-50',
}
const TIER_LABELS = { critical: 'Critical', important: 'Important', nice_to_have: 'Nice to have' }

function IssueList({ issues, tier, doneSet, onToggle }: {
  issues:  AuditIssue[]
  tier:    keyof typeof TIER_COLORS
  doneSet: Set<string>
  onToggle: (key: string) => void
}) {
  if (issues.length === 0) return null
  return (
    <div className="space-y-2">
      <p className={`text-xs font-semibold uppercase tracking-wide px-1 ${
        tier === 'critical' ? 'text-destructive' : tier === 'important' ? 'text-yellow-700' : 'text-blue-700'
      }`}>
        {TIER_LABELS[tier]}
      </p>
      {issues.map((issue, i) => {
        const key = `${tier}-${i}`
        const done = doneSet.has(key)
        return (
          <div key={i} className={`border rounded-lg p-3 space-y-1 ${TIER_COLORS[tier]} ${done ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <p className={`text-sm font-medium ${done ? 'line-through' : ''}`}>{issue.issue}</p>
              <button
                onClick={() => onToggle(key)}
                className="shrink-0 text-xs underline text-muted-foreground hover:text-foreground"
              >
                {done ? 'Undo' : 'Done'}
              </button>
            </div>
            <p className="text-xs"><span className="font-medium">Fix:</span> {issue.fix}</p>
            <p className="text-xs text-muted-foreground"><span className="font-medium">Impact:</span> {issue.impact}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function AuditPage() {
  const [slug,     setSlug]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<AuditResult | null>(null)
  const [platName, setPlatName] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState<Set<string>>(new Set())

  async function runAudit() {
    if (!slug) return
    setLoading(true)
    setError(null)
    setResult(null)
    setDone(new Set())
    try {
      const res = await fetch(`/api/audit/${slug}`)
      const data = await res.json() as { result?: AuditResult; platformName?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Audit failed'); return }
      setResult(data.result ?? null)
      setPlatName(data.platformName ?? slug)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  function toggleDone(key: string) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalIssues = result ? result.critical.length + result.important.length + result.nice_to_have.length : 0
  const doneCount   = done.size

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile Audit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          AI-powered review of your profile for a specific platform.
        </p>
      </div>

      <div className="flex gap-2">
        <Select onValueChange={(v: string | null) => v !== null && setSlug(v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a platform…" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_SLUGS.map(p => (
              <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={runAudit} disabled={!slug || loading}>
          {loading ? 'Analysing…' : 'Run audit'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{platName} audit complete</p>
            {totalIssues > 0 && (
              <Badge variant="outline" className="text-xs">
                {doneCount}/{totalIssues} resolved
              </Badge>
            )}
          </div>

          <IssueList issues={result.critical}     tier="critical"     doneSet={done} onToggle={toggleDone} />
          <IssueList issues={result.important}    tier="important"    doneSet={done} onToggle={toggleDone} />
          <IssueList issues={result.nice_to_have} tier="nice_to_have" doneSet={done} onToggle={toggleDone} />

          {totalIssues === 0 && (
            <p className="text-sm text-muted-foreground">No issues found — your profile looks strong for {platName}.</p>
          )}
        </div>
      )}
    </div>
  )
}
