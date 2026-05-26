import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  const supabase = await createClient()
  if (!await assertAdmin(supabase))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, name, skills, hourly_rate, role, is_active, created_at, last_active_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ members: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await assertAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Record invite
  await supabase.from('invites').upsert({ email, invited_by: admin.id }, { onConflict: 'email' })

  // Send magic link invite via Supabase Admin API
  const { error } = await supabase.auth.admin.inviteUserByEmail(email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
