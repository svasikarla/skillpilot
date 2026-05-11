import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import AdminActions from './AdminActions'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="border rounded-lg p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">System health overview</p>
      </div>

      <AdminActions />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Active members"    value={memberCount   ?? 0} />
        <StatCard label="Pending jobs"      value={pendingJobs   ?? 0} sub="awaiting approval" />
        <StatCard label="Approved jobs"     value={approvedJobs  ?? 0} sub="live in feed" />
        <StatCard label="Scam reports"      value={scamReports   ?? 0} sub="unresolved" />
        <StatCard label="Proposals today"   value={proposalCount ?? 0} sub="across all members" />
      </div>

      {/* Recent ingestion runs */}
      <div>
        <h2 className="text-base font-semibold mb-3">Recent ingestion runs</h2>
        {(recentRuns ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No ingestion runs yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Started</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Fetched</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">New</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(recentRuns ?? []).map((run, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{run.source_name}</td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {new Date(run.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-2">{run.jobs_fetched ?? 0}</td>
                    <td className="px-3 py-2">{run.jobs_new ?? 0}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          run.status === 'success' ? 'border-green-300 text-green-700' :
                          run.status === 'error'   ? 'border-red-300 text-red-700' :
                          'border-yellow-300 text-yellow-700'
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
