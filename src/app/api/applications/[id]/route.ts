import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { status, rate_proposed, rate_agreed, notes, applied_at } = body

  const VALID_STATUSES = ['saved','in_progress','submitted','interviewing','negotiating','won','lost','no_response','withdrawn']
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status)        update.status        = status
  if (rate_proposed) update.rate_proposed = rate_proposed
  if (rate_agreed)   update.rate_agreed   = rate_agreed
  if (notes !== undefined) update.notes   = notes
  if (applied_at)    update.applied_at    = applied_at

  // Auto-set applied_at when transitioning to submitted
  if (status === 'submitted' && !applied_at) update.applied_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('applications')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
