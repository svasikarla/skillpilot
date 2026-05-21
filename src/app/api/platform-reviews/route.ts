import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform_id, rating, review_text } = await request.json()

  if (!platform_id || !rating || !review_text) {
    return NextResponse.json({ error: 'platform_id, rating, and review_text are required' }, { status: 400 })
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1–5' }, { status: 400 })
  }
  if (review_text.length < 20 || review_text.length > 300) {
    return NextResponse.json({ error: 'Review must be 20–300 characters' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('platform_reviews')
    .upsert(
      { user_id: user.id, platform_id, rating, review_text },
      { onConflict: 'user_id,platform_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ review: data })
}
