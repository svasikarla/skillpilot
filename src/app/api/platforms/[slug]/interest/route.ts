import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Props { params: Promise<{ slug: string }> }

export async function POST(request: Request, { params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { interest, profile_url } = await request.json()
  if (!['have', 'want', 'not'].includes(interest)) {
    return NextResponse.json({ error: 'Invalid interest value' }, { status: 400 })
  }

  const { data: platform } = await supabase
    .from('platforms').select('id').eq('slug', slug).single()

  if (!platform) return NextResponse.json({ error: 'Platform not found' }, { status: 404 })

  const { error } = await supabase
    .from('member_platform_interests')
    .upsert({ user_id: user.id, platform_id: platform.id, interest, profile_url: profile_url ?? null },
      { onConflict: 'user_id,platform_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
