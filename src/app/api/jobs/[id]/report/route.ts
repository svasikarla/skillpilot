import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { SCAM } from '@/lib/config'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { reason?: string }

  // Check for duplicate report from this user
  const { data: existing } = await supabase
    .from('scam_reports')
    .select('id')
    .eq('job_id', jobId)
    .eq('reported_by', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You have already reported this job' }, { status: 409 })
  }

  const admin = await createAdminClient()

  await admin.from('scam_reports').insert({
    job_id:      jobId,
    reported_by: user.id,
    reason:      body.reason ?? 'Reported as suspicious by member',
  })

  // Count total reports for this job
  const { count } = await admin
    .from('scam_reports')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('resolved', false)

  // Auto-hide job if threshold reached
  if ((count ?? 0) >= SCAM.reportsToHide) {
    await admin
      .from('jobs')
      .update({ status: 'pending' })  // pull back to pending for admin review
      .eq('id', jobId)
      .eq('status', 'approved')       // only hide currently visible jobs
  }

  return NextResponse.json({ ok: true, reportCount: count })
}
