import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin'
}

export async function GET() {
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('scam_reports')
    .select('id, job_id, reason, created_at, resolved, jobs(title, platform, url)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by job and count
  const grouped = new Map<string, { job_id: string; title: string; platform: string; url: string | null; count: number; reasons: string[] }>()
  for (const r of data ?? []) {
    const job = r.jobs as unknown as { title: string; platform: string; url: string | null } | null
    if (!r.job_id || !job) continue
    const entry = grouped.get(r.job_id) ?? { job_id: r.job_id, title: job.title, platform: job.platform, url: job.url, count: 0, reasons: [] as string[] }
    entry.count += 1
    if (r.reason) entry.reasons.push(r.reason as string)
    grouped.set(r.job_id, entry)
  }

  return NextResponse.json({ reports: Array.from(grouped.values()).sort((a, b) => b.count - a.count) })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { job_id, action } = await request.json()
  if (!job_id || !['dismiss', 'reject'].includes(action))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  await supabase.from('scam_reports').update({ resolved: true }).eq('job_id', job_id)

  if (action === 'reject') {
    await supabase.from('jobs').update({ status: 'rejected' }).eq('id', job_id)
  }

  return NextResponse.json({ ok: true })
}
