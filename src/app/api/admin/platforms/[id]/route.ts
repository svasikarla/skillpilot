import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { PLATFORM_GUIDE } from '@/lib/config'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  return member?.role === 'admin' ? user : null
}

const schema = z.object({
  application_guide: z.string().optional(),
  platform_tips:     z.string().optional(),
  setup_guide:       z.string().optional(),
  red_flags:         z.string().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const update: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }

  // Warn if guide is stale
  const staleAfter = PLATFORM_GUIDE.staleAfterDays

  const admin = await createAdminClient()
  const { error } = await admin.from('platforms').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, staleAfterDays: staleAfter })
}
