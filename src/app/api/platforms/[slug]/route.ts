import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params

  const { data: platform, error } = await supabase
    .from('platforms')
    .select('id, slug, name, tier, trust_score, description, guide_md, tips, red_flags, website')
    .eq('slug', slug)
    .single()

  if (error || !platform) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: reviews } = await supabase
    .from('platform_reviews')
    .select('id, rating, review_text, created_at')
    .eq('platform_id', platform.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ platform, reviews: reviews ?? [] })
}
