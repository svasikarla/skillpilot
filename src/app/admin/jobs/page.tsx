import { createClient } from '@/lib/supabase/server'
import { AdminJobsClient } from './AdminJobsClient'

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'pending' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select('id, title, company, platform, status, reliability_score, reliability_flags, posted_at, url, source')
    .order('posted_at', { ascending: false })
    .limit(200)

  if (filter !== 'all') query = query.eq('status', filter)

  const { data: jobs, error } = await query

  const { count: pending } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pending ?? 0} pending review · Approve or reject ingested jobs before they show in the feed.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <a
              key={f}
              href={`?filter=${f}`}
              className={`px-3 py-1.5 rounded-md border capitalize ${filter === f ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            >
              {f}
            </a>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">
          Error loading jobs: {error.message}. Make sure you ran setup-v2.sql in Supabase.
        </p>
      )}

      <AdminJobsClient jobs={jobs ?? []} />
    </div>
  )
}
