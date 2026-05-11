import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Prevents Supabase free-tier project from pausing due to inactivity
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()
  const { count, error } = await supabase
    .from('platforms')
    .select('id', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, platforms: count })
}
