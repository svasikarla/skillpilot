import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/applications/[id] — update status, rate, notes, outcome
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    status?:        string
    rateProposed?:  number | null
    rateAgreed?:    number | null
    daysToResponse?: number | null
    notes?:         string
    appliedAt?:     string | null
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status         !== undefined) update.status           = body.status
  if (body.rateProposed   !== undefined) update.rate_proposed    = body.rateProposed
  if (body.rateAgreed     !== undefined) update.rate_agreed      = body.rateAgreed
  if (body.daysToResponse !== undefined) update.days_to_response = body.daysToResponse
  if (body.notes          !== undefined) update.notes            = body.notes
  if (body.appliedAt      !== undefined) update.applied_at       = body.appliedAt

  const { error } = await supabase
    .from('applications')
    .update(update)
    .eq('id', id)
    .eq('member_id', user.id)   // can only update own applications

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
