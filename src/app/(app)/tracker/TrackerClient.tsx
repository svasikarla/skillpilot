'use client'

import { useState } from 'react'
import AppNav from '@/components/AppNav'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Trash2, Trophy, Send, Clock, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Job = { id: string; title: string; company: string | null; platform: string; url: string | null; rate_min: number | null; rate_max: number | null }
type Application = {
  id: string; status: string; applied_at: string | null; rate_proposed: number | null
  rate_agreed: number | null; notes: string | null; created_at: string; updated_at: string
  jobs: Job | null
}

const STATUS_OPTIONS = [
  { value: 'saved',        label: 'Saved',        color: 'text-slate-600   bg-slate-100   border-slate-200   dark:text-slate-400 dark:bg-slate-900/40  dark:border-slate-700' },
  { value: 'in_progress',  label: 'In Progress',  color: 'text-blue-700   bg-blue-50     border-blue-200    dark:text-blue-400  dark:bg-blue-950/40   dark:border-blue-800' },
  { value: 'submitted',    label: 'Submitted',    color: 'text-violet-700 bg-violet-50   border-violet-200  dark:text-violet-400 dark:bg-violet-950/40 dark:border-violet-800' },
  { value: 'interviewing', label: 'Interviewing', color: 'text-yellow-700 bg-yellow-50  border-yellow-200  dark:text-yellow-400 dark:bg-yellow-950/40 dark:border-yellow-800' },
  { value: 'negotiating',  label: 'Negotiating',  color: 'text-orange-700 bg-orange-50  border-orange-200  dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800' },
  { value: 'won',          label: '🏆 Won',       color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800' },
  { value: 'lost',         label: 'Lost',         color: 'text-red-700    bg-red-50      border-red-200     dark:text-red-400   dark:bg-red-950/40    dark:border-red-800' },
  { value: 'no_response',  label: 'No Response',  color: 'text-gray-500   bg-gray-50     border-gray-200    dark:text-gray-500  dark:bg-gray-900/40   dark:border-gray-700' },
  { value: 'withdrawn',    label: 'Withdrawn',    color: 'text-gray-400   bg-gray-50     border-gray-200    dark:text-gray-600  dark:bg-gray-900/40   dark:border-gray-800' },
]

function StatusPill({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find(s => s.value === status)
  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border', opt?.color ?? '')}>
      {opt?.label ?? status}
    </span>
  )
}

export default function TrackerClient({ applications: initial, userName }: { applications: Application[]; userName?: string }) {
  const [apps, setApps]     = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  const stats = {
    saved:     apps.filter(a => a.status === 'saved').length,
    applied:   apps.filter(a => ['submitted','interviewing','negotiating'].includes(a.status)).length,
    won:       apps.filter(a => a.status === 'won').length,
    total:     apps.length,
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApps(p => p.map(a => a.id === id ? { ...a, status } : a))
      toast.success('Updated')
    } else toast.error('Failed')
  }

  async function saveNotes(id: string) {
    const notes = notesDraft[id] ?? ''
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    if (res.ok) {
      setApps(p => p.map(a => a.id === id ? { ...a, notes } : a))
      setEditing(null); toast.success('Notes saved')
    } else toast.error('Failed')
  }

  async function deleteApp(id: string) {
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    if (res.ok) { setApps(p => p.filter(a => a.id !== id)); toast.success('Removed') }
    else toast.error('Failed')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={userName} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="page-header">Application Tracker</h1>
          <p className="page-subheader">Track every gig from save to signed contract.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Bookmark,  label: 'Saved',   value: stats.saved,   color: 'text-slate-600' },
            { icon: Send,      label: 'Applied',  value: stats.applied, color: 'text-violet-600' },
            { icon: Clock,     label: 'Active',   value: stats.applied, color: 'text-amber-600' },
            { icon: Trophy,    label: 'Won',      value: stats.won,     color: 'text-emerald-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="stat-card">
              <Icon className={cn('h-4 w-4 mb-1', color)} />
              <p className="stat-value">{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">Save jobs from the feed to track them here.</p>
            <a href="/feed" className="text-sm text-primary underline mt-3 inline-block">Browse gigs →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map(app => (
              <div key={app.id} className="card-elevated rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{app.jobs?.title ?? 'Unknown job'}</span>
                      <StatusPill status={app.status ?? 'saved'} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {app.jobs?.company && <span>{app.jobs.company}</span>}
                      <span className="font-medium text-primary">{app.jobs?.platform}</span>
                      {app.applied_at && <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>}
                      {app.rate_agreed && <span className="text-emerald-700 font-medium">${app.rate_agreed}/hr agreed</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {app.jobs?.url && (
                      <a href={app.jobs.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => deleteApp(app.id)}
                      className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select value={app.status ?? 'saved'} onValueChange={(v: string | null) => { if (v) updateStatus(app.id as string, v) }}>
                    <SelectTrigger className="h-7 text-xs w-40 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                    onClick={() => { setEditing(app.id); setNotesDraft(p => ({ ...p, [app.id]: app.notes ?? '' })) }}
                  >
                    {app.notes ? 'Edit notes' : '+ Add notes'}
                  </button>
                </div>

                {editing === app.id && (
                  <div className="space-y-2 pt-1">
                    <Textarea className="text-xs min-h-[72px] bg-muted/20 resize-none"
                      placeholder="Notes about this application…"
                      value={notesDraft[app.id] ?? ''}
                      onChange={e => setNotesDraft(p => ({ ...p, [app.id]: e.target.value }))} />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => saveNotes(app.id)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {app.notes && editing !== app.id && (
                  <p className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2 border border-border/50">
                    {app.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
