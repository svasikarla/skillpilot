import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin'
}

export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const allowed: Record<string, unknown> = {}
  if ('is_active' in body) allowed.is_active = body.is_active
  if ('role' in body)      allowed.role      = body.role

  if (!Object.keys(allowed).length)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await supabase.from('profiles').update(allowed).eq('user_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
