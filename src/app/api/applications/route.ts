import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, rate_proposed, rate_agreed, notes, created_at, updated_at,
      jobs (id, title, company, platform, url, rate_min, rate_max)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, status = 'saved' } = await request.json()
  if (!job_id) return NextResponse.json({ error: 'job_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('applications')
    .upsert({ user_id: user.id, job_id, status }, { onConflict: 'user_id,job_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}
