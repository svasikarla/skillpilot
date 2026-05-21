import { NextResponse } from 'next/server'
import { ingestAllSources } from '@/lib/ingest'

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (token !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await ingestAllSources()
    const totals = results.reduce(
      (acc, r) => ({ found: acc.found + r.found, inserted: acc.inserted + r.inserted, duped: acc.duped + r.duped }),
      { found: 0, inserted: 0, duped: 0 }
    )
    return NextResponse.json({ ok: true, results, totals })
  } catch (err) {
    console.error('[cron/ingest]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
