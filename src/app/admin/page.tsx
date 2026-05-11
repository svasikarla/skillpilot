import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import AdminActions from './AdminActions'

function StatCard({
  label, value, sub, accent = false,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold mt-2 tabular-nums ${accent ? 'text-destructive' : 'text-primary'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  const admin = await createAdminClient()

  const [
    { count: memberCount },
    { count: pendingJobs },
    { count: approvedJobs },
    { count: scamReports },
    { count: proposalCount },
    { data: recentRuns },
  ] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true),
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('scam_reports').select('id', { count: 'exact', head: true }).eq('resolved', false),
    admin.from('proposal_logs').select('id', { count: 'exact', head: true })
      .gte('generated_at', new Date(Date.now() - 86_400_000).toISOString()),
    admin.from('ingestion_runs')
      .select('source_name, started_at, completed_at, jobs_fetched, jobs_new, status, error_msg')
      .order('started_at', { ascending: false })
      .limit(10),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System health overview</p>
      </div>

      <AdminActions />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Active members"  value={memberCount   ?? 0} />
        <StatCard label="Pending jobs"    value={pendingJobs   ?? 0} sub="awaiting approval" />
        <StatCard label="Approved jobs"   value={approvedJobs  ?? 0} sub="live in feed" />
        <StatCard label="Scam reports"    value={scamReports   ?? 0} sub="unresolved" accent={(scamReports ?? 0) > 0} />
        <StatCard label="Proposals today" value={proposalCount ?? 0} sub="across all members" />
      </div>

      <div>
        <h2 className="text-base font-semibold mb-4">Recent ingestion runs</h2>
        {(recentRuns ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingestion runs yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Started</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Fetched</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">New</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(recentRuns ?? []).map((run, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm">{run.source_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                      {new Date(run.started_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{run.jobs_fetched ?? 0}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-primary">{run.jobs_new ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          run.status === 'success' ? 'border-green-300 text-green-700 bg-green-50' :
                          run.status === 'error'   ? 'border-red-300   text-red-700   bg-red-50' :
                                                     'border-yellow-300 text-yellow-700 bg-yellow-50'
                        }`}
                      >
                        {run.status ?? 'running'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
