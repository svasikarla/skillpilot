'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

type Status = 'saved' | 'applied' | 'interviewing' | 'won' | 'rejected' | 'withdrawn'

const STATUS_OPTIONS: Status[] = ['saved', 'applied', 'interviewing', 'won', 'rejected', 'withdrawn']

const STATUS_COLORS: Record<Status, string> = {
  saved:        'bg-accent      text-accent-foreground',
  applied:      'bg-blue-100    text-blue-700',
  interviewing: 'bg-yellow-100  text-yellow-700',
  won:          'bg-green-100   text-green-700',
  rejected:     'bg-red-100     text-red-700',
  withdrawn:    'bg-orange-100  text-orange-700',
}

export interface TrackerApp {
  id:             string
  status:         string
  appliedAt:      string | null
  rateProposed:   string | null
  rateAgreed:     string | null
  daysToResponse: number | null
  notes:          string | null
  createdAt:      string | null
  job:            { id: string; title: string; sourceUrl: string } | null
  platform:       { id: number; name: string; trustTier: number | null } | null
}

interface Props {
  applications: TrackerApp[]
}

function fmt(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TrackerClient({ applications: initial }: Props) {
  const [apps,       setApps]       = useState(initial)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [editNotes,  setEditNotes]  = useState<Record<string, string>>({})
  const [saving,     setSaving]     = useState<Set<string>>(new Set())

  async function updateStatus(id: string, status: string) {
    setSaving(prev => new Set(prev).add(id))
    const update: Record<string, unknown> = { status }
    if (status === 'applied') update.appliedAt = new Date().toISOString()

    const res = await fetch(`/api/applications/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(update),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } else {
      toast.error('Failed to update status')
    }
    setSaving(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function saveNotes(id: string) {
    setSaving(prev => new Set(prev).add(id))
    const notes = editNotes[id] ?? apps.find(a => a.id === id)?.notes ?? ''
    const res = await fetch(`/api/applications/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ notes }),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, notes } : a))
      toast.success('Notes saved')
    } else {
      toast.error('Failed to save notes')
    }
    setSaving(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  async function updateRate(id: string, field: 'rateProposed' | 'rateAgreed', value: string) {
    const num = parseFloat(value)
    if (isNaN(num)) return
    const body = field === 'rateProposed' ? { rateProposed: num } : { rateAgreed: num }
    const res = await fetch(`/api/applications/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    if (res.ok) {
      setApps(prev => prev.map(a => a.id === id ? {
        ...a,
        [field]: value,
      } : a))
    }
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
          <Briefcase className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="font-semibold text-foreground">No applications tracked yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Save jobs from your{' '}
            <Link href="/feed" className="text-primary hover:underline font-medium">Job Feed</Link>
            {' '}to start tracking your pipeline.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Job</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map(app => (
            <>
              <TableRow key={app.id} className="group">
                {/* Job title */}
                <TableCell className="font-medium">
                  <div>
                    <a
                      href={app.job?.sourceUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-sm line-clamp-1"
                    >
                      {app.job?.title ?? 'Unknown job'}
                    </a>
                    {app.job?.id && (
                      <Link
                        href={`/jobs/${app.job.id}/apply`}
                        className="text-xs text-primary hover:underline"
                      >
                        View workflow →
                      </Link>
                    )}
                  </div>
                </TableCell>

                {/* Platform */}
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {app.platform?.name ?? '—'}
                  </span>
                </TableCell>

                {/* Status dropdown */}
                <TableCell>
                  <Select
                    value={app.status}
                    onValueChange={v => v !== null && updateStatus(app.id, v)}
                  >
                    <SelectTrigger className="h-7 w-32 text-xs border-0 p-0 focus-visible:ring-0">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[app.status as Status] ?? 'bg-muted text-muted-foreground'
                      }`}>
                        {app.status}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s} value={s} className="text-xs capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Date */}
                <TableCell className="text-xs text-muted-foreground">
                  {fmt(app.appliedAt ?? app.createdAt)}
                </TableCell>

                {/* Rate */}
                <TableCell className="text-xs">
                  {app.rateAgreed
                    ? <span className="text-green-600 font-medium">${Number(app.rateAgreed).toFixed(0)}/hr ✓</span>
                    : app.rateProposed
                      ? `$${Number(app.rateProposed).toFixed(0)}/hr`
                      : <span className="text-muted-foreground">—</span>
                  }
                </TableCell>

                {/* Expand toggle */}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs opacity-0 group-hover:opacity-100"
                    onClick={() => setExpanded(e => e === app.id ? null : app.id)}
                  >
                    {expanded === app.id ? '▲' : '▼'}
                  </Button>
                </TableCell>
              </TableRow>

              {/* Expanded notes row */}
              {expanded === app.id && (
                <TableRow key={`${app.id}-notes`} className="bg-muted/30">
                  <TableCell colSpan={6} className="py-3 px-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Rate proposed ($/ hr)</p>
                        <input
                          type="number"
                          defaultValue={app.rateProposed ? Number(app.rateProposed) : ''}
                          onBlur={e => updateRate(app.id, 'rateProposed', e.target.value)}
                          className="w-24 border rounded px-2 py-1 text-xs"
                          placeholder="85"
                        />
                      </div>
                      {app.status === 'won' && (
                        <div>
                          <p className="text-muted-foreground mb-1">Rate agreed ($/ hr)</p>
                          <input
                            type="number"
                            defaultValue={app.rateAgreed ? Number(app.rateAgreed) : ''}
                            onBlur={e => updateRate(app.id, 'rateAgreed', e.target.value)}
                            className="w-24 border rounded px-2 py-1 text-xs"
                            placeholder="90"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Private notes</p>
                      <Textarea
                        rows={3}
                        className="text-xs"
                        defaultValue={app.notes ?? ''}
                        placeholder="What went well, what to do differently, contact name, next step…"
                        onChange={e => setEditNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => saveNotes(app.id)}
                        disabled={saving.has(app.id)}
                      >
                        {saving.has(app.id) ? 'Saving…' : 'Save notes'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
