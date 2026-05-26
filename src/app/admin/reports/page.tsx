import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminReportsClient from './AdminReportsClient'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (self?.role !== 'admin') redirect('/feed')

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'}/api/admin/reports`, {
    headers: { cookie: '' },
    cache: 'no-store',
  })
  // Fetch reports server-side via direct DB query instead
  const { data: scamReports } = await supabase
    .from('scam_reports')
    .select('id, job_id, reason, created_at, jobs(title, platform, url)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  // Group by job
  const grouped = new Map<string, { job_id: string; title: string; platform: string; url: string | null; count: number; reasons: string[] }>()
  for (const r of scamReports ?? []) {
    const job = r.jobs as { title: string; platform: string; url: string | null } | null
    if (!r.job_id || !job) continue
    const e = grouped.get(r.job_id) ?? { job_id: r.job_id, title: job.title, platform: job.platform, url: job.url, count: 0, reasons: [] }
    e.count += 1; if (r.reason) e.reasons.push(r.reason)
    grouped.set(r.job_id, e)
  }

  const reports = Array.from(grouped.values()).sort((a, b) => b.count - a.count)

  return <AdminReportsClient reports={reports} />
}
