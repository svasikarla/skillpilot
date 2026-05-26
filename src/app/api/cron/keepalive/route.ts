import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  // Simple ping to prevent Supabase free-tier pause
  await supabase.from('profiles').select('user_id').limit(1)
  return NextResponse.json({ ok: true, ping: new Date().toISOString() })
}
