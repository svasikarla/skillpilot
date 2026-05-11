'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function Row({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span>{done ? '✓' : '○'}</span>
    </div>
  )
}

export default function SettingsPage() {
  const [data,    setData]    = useState<SettingsData | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [optOut,  setOptOut]  = useState(false)

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
      if (res.ok) { setOptOut(next); toast.success(next ? 'Weekly digest disabled' : 'Weekly digest enabled') }
      else toast.error('Could not save preference')
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return <div className="max-w-lg mx-auto py-12 text-center text-sm text-muted-foreground">Loading…</div>
  }

  const m = data.member

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{data.email}</p>
      </div>

      {/* Profile completeness */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Profile completeness</h2>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data.completeness}% complete</span>
            {data.completeness < 100 && <span>Fill in the sections below to reach 100%</span>}
          </div>
          <Bar pct={data.completeness} />
        </div>
        <div className="border rounded-lg px-4 py-2 divide-y">
          <Row label="Display name"       done={!!m?.display_name} />
          <Row label="Bio / about text"   done={!!m?.about} />
          <Row label="Target rate"        done={!!m?.target_hourly_rate} />
          <Row label="Years experience"   done={!!m?.years_experience} />
          <Row label="Skills (3+)"        done={data.skillCount >= 3} />
          <Row label="Portfolio item"     done={(m?.portfolio?.length ?? 0) > 0} />
          <Row label="GitHub URL"         done={!!m?.github_url} />
        </div>
        <Link
          href="/onboarding"
          className="text-xs text-primary hover:underline"
        >
          Edit profile →
        </Link>
      </section>

      {/* Activity summary */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{data.skillCount}</p>
            <p className="text-xs text-muted-foreground">skills in profile</p>
          </div>
          <div className="border rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{data.appCount}</p>
            <p className="text-xs text-muted-foreground">applications tracked</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Member since {m?.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
        </p>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Notifications</h2>
        <div className="border rounded-lg p-4 flex items-center justify-between">
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
            onClick={() => saveDigestPref(!optOut)}
          >
            {saving ? '…' : optOut ? 'Enable' : 'Enabled'}
          </Button>
        </div>
      </section>
    </div>
  )
}
