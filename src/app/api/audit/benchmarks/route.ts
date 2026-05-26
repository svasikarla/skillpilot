import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRateBenchmarks } from '@/lib/rate-benchmarking'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const benchmarks = await computeRateBenchmarks()
    return NextResponse.json({ benchmarks })
  } catch (err) {
    console.error('[benchmarks]', err)
    return NextResponse.json({ error: 'Failed to compute benchmarks' }, { status: 500 })
  }
}
