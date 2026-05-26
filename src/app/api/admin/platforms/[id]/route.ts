import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ id: string }> }

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  return data?.role === 'admin'
}

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('platforms').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ platform: data })
}

export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  if (!await assertAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const editableFields = ['setup_guide', 'application_guide', 'tips', 'red_flags', 'guide_md',
                          'description', 'rate_min_aiml', 'rate_max_aiml']
  const update: Record<string, unknown> = {}
  for (const f of editableFields) {
    if (f in body) update[f] = body[f]
  }

  if (!Object.keys(update).length)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const { error } = await supabase.from('platforms').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
