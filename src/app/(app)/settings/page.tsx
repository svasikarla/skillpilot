'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface SettingsData {
  member: {
    display_name:        string | null
    about:               string | null
    target_hourly_rate:  number | null
    years_experience:    number | null
    portfolio:           unknown[]
    digest_opt_out:      boolean
    github_url:          string | null
    created_at:          string
  } | null
  email:        string | undefined
  skillCount:   number
  appCount:     number
  completeness: number
}

const completenessItems = [
  { key: 'display_name',      label: 'Display name'     },
  { key: 'about',             label: 'Bio / about text'  },
  { key: 'target_hourly_rate',label: 'Target rate'       },
  { key: 'years_experience',  label: 'Years experience'  },
  { key: 'skills',            label: 'Skills (3+)'       },
  { key: 'portfolio',         label: 'Portfolio item'    },
  { key: 'github_url',        label: 'GitHub URL'        },
]

export default function SettingsPage() {
  const [data,   setData]   = useState<SettingsData | null>(null)
  const [saving, setSaving] = useState(false)
  const [optOut, setOptOut] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((d: SettingsData) => { setData(d); setOptOut(d.member?.digest_opt_out ?? false) })
      .catch(() => toast.error('Failed to load settings'))
  }, [])

  async function saveDigestPref(next: boolean) {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ digestOptOut: next }),
      })
      if (res.ok) {
        setOptOut(next)
        toast.success(next ? 'Weekly digest disabled' : 'Weekly digest enabled')
      } else {
        toast.error('Could not save preference')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      </div>
    )
  }

  const m   = data.member
  const pct = data.completeness

  const done: Record<string, boolean> = {
    display_name:       !!m?.display_name,
    about:              !!m?.about,
    target_hourly_rate: !!m?.target_hourly_rate,
    years_experience:   !!m?.years_experience,
    skills:             data.skillCount >= 3,
    portfolio:          (m?.portfolio?.length ?? 0) > 0,
    github_url:         !!m?.github_url,
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">{data.email}</p>
      </div>

      {/* Profile completeness */}
      <section className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Profile completeness</h2>
          <span className={`text-xs font-bold tabular-nums ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-destructive'}`}>
            {pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="space-y-1">
          {completenessItems.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className={`text-sm ${done[key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
              <span className={`text-sm font-semibold ${done[key] ? 'text-primary' : 'text-muted-foreground/40'}`}>
                {done[key] ? '✓' : '○'}
              </span>
            </div>
          ))}
        </div>

        <Link href="/onboarding" className="text-xs font-medium text-primary hover:underline">
          Edit profile →
        </Link>
      </section>

      <Separator />

      {/* Activity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary tabular-nums">{data.skillCount}</p>
            <p className="text-xs text-muted-foreground mt-1">skills in profile</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary tabular-nums">{data.appCount}</p>
            <p className="text-xs text-muted-foreground mt-1">applications tracked</p>
          </div>
        </div>
        {m?.created_at && (
          <p className="text-xs text-muted-foreground">
            Member since {new Date(m.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </section>

      <Separator />

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <div className="rounded-xl border bg-card p-4 flex items-center justify-between gap-4 shadow-sm">
          <div>
            <p className="text-sm font-medium">Weekly digest email</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Top 5 new job matches and a group win highlight, every Monday.
            </p>
          </div>
          <Button
            size="sm"
            variant={optOut ? 'outline' : 'default'}
            disabled={saving}
            className="shrink-0"
            onClick={() => saveDigestPref(!optOut)}
          >
            {saving ? '…' : optOut ? 'Enable' : 'Enabled'}
          </Button>
        </div>
      </section>
    </div>
  )
}
