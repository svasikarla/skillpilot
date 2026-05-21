import { NextResponse } from 'next/server'

// Placeholder — Phase 3 will implement semantic match recomputation
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (token !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, message: 'Match refresh not yet implemented' })
}
