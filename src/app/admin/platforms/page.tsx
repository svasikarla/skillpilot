'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PLATFORM_GUIDE } from '@/lib/config'

interface Platform {
  id:                number
  name:              string
  slug:              string
  trust_tier:        number | null
  application_guide: string | null
  platform_tips:     string | null
  setup_guide:       string | null
  red_flags:         string | null
  updated_at:        string | null
}

const FIELD_LABELS: Record<string, string> = {
  application_guide: 'Application guide',
  platform_tips:     'Platform tips',
  setup_guide:       'Setup guide',
  red_flags:         'Red flags',
}

function isStale(updatedAt: string | null): boolean {
  if (!updatedAt) return true
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86_400_000
  return days > PLATFORM_GUIDE.staleAfterDays
}

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [expanded,  setExpanded]  = useState<number | null>(null)
  const [edits,     setEdits]     = useState<Record<string, string>>({})
  const [saving,    setSaving]    = useState<number | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/admin/platforms')
      .then(r => r.json())
      .then((d: { platforms?: Platform[] }) => setPlatforms(d.platforms ?? []))
      .catch(() => toast.error('Failed to load platforms'))
      .finally(() => setLoading(false))
  }, [])

  function editKey(platformId: number, field: string) {
    return `${platformId}:${field}`
  }

  function getValue(p: Platform, field: string): string {
    const key = editKey(p.id, field)
    if (edits[key] !== undefined) return edits[key]
    return (p[field as keyof Platform] as string | null) ?? ''
  }

  async function save(p: Platform) {
    setSaving(p.id)
    const body: Record<string, string> = {}
    for (const field of Object.keys(FIELD_LABELS)) {
      const key = editKey(p.id, field)
      if (edits[key] !== undefined) body[field] = edits[key]
    }
    if (Object.keys(body).length === 0) { setSaving(null); return }

    const res = await fetch(`/api/admin/platforms/${p.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (res.ok) {
      // Clear edits and update local state
      const newEdits = { ...edits }
      for (const k of Object.keys(edits).filter(k => k.startsWith(`${p.id}:`))) delete newEdits[k]
      setEdits(newEdits)
      setPlatforms(prev => prev.map(pl => pl.id === p.id ? { ...pl, ...body, updated_at: new Date().toISOString() } : pl))
      toast.success(`${p.name} guides saved`)
    } else {
      const d = await res.json() as { error?: string }
      toast.error(d.error ?? 'Save failed')
    }
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Guide Editor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Guides older than {PLATFORM_GUIDE.staleAfterDays} days are flagged as potentially outdated.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {platforms.map(p => (
            <div key={p.id} className="border rounded-lg overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(e => e === p.id ? null : p.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{p.name}</span>
                  {p.trust_tier && (
                    <Badge variant="outline" className="text-xs">Tier {p.trust_tier}</Badge>
                  )}
                  {isStale(p.updated_at) && (
                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                      May be outdated
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {p.updated_at && (
                    <span className="text-xs text-muted-foreground">
                      Updated {new Date(p.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{expanded === p.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Edit panel */}
              {expanded === p.id && (
                <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                  {Object.entries(FIELD_LABELS).map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      <textarea
                        rows={6}
                        className="w-full border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                        value={getValue(p, field)}
                        onChange={e => setEdits(prev => ({ ...prev, [editKey(p.id, field)]: e.target.value }))}
                        placeholder={`${label} (markdown supported)`}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => save(p)}
                      disabled={saving === p.id}
                    >
                      {saving === p.id ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newEdits = { ...edits }
                        for (const k of Object.keys(edits).filter(k => k.startsWith(`${p.id}:`))) delete newEdits[k]
                        setEdits(newEdits)
                      }}
                    >
                      Discard
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
