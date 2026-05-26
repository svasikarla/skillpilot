import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await request.json().catch(() => ({ reason: '' }))

  const { error } = await supabase.from('scam_reports').insert({
    job_id:  id,
    user_id: user.id,
    reason:  reason ?? null,
  })

  if (error) {
    // Ignore duplicate report from same user
    if (error.code === '23505') return NextResponse.json({ ok: true, duplicate: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if 3+ reports — auto-set job to pending for admin review
  const { count } = await supabase
    .from('scam_reports')
    .select('*', { count: 'exact', head: true })
    .eq('job_id', id)
    .eq('resolved', false)

  if ((count ?? 0) >= 3) {
    await supabase.from('jobs').update({ status: 'pending' }).eq('id', id)
  }

  return NextResponse.json({ ok: true, report_count: count })
}
