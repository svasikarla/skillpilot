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
        <h1 className="text-xl font-semibold">Upskill Roadmap</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Skills ranked by how many approved jobs they unlock, weighted by rate and learning time.
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="border rounded-lg p-3">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">skill gaps</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-2xl font-bold">{items.reduce((s, i) => s + i.jobsUnlocked, 0)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">jobs you could unlock</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-2xl font-bold">{items.filter(i => i.status === 'learning').length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">currently learning</p>
          </div>
        </div>
      )}

      <RoadmapClient items={items} />
    </div>
  )
}
