import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoadmap } from '@/lib/roadmap'
import RoadmapClient from './RoadmapClient'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const items = await getRoadmap(user.id)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upskill Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Skills ranked by how many approved jobs they unlock, weighted by rate and learning time.
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-primary tabular-nums">{items.length}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">skill gaps</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-primary tabular-nums">
              {items.reduce((s, i) => s + i.jobsUnlocked, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">jobs unlockable</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-primary tabular-nums">
              {items.filter(i => i.status === 'learning').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">in progress</p>
          </div>
        </div>
      )}

      <RoadmapClient items={items} />
    </div>
  )
}
