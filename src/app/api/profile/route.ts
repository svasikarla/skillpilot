import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, profileEmbeddingText } from '@/lib/embeddings'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    name, skills, skill_ratings, hourly_rate,
    years_experience, work_preference, timezone,
    hours_per_week, min_budget, about, portfolio,
  } = body

  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      user_id:          user.id,
      name,
      skills:           skills ?? [],
      skill_ratings:    skill_ratings ?? {},
      hourly_rate:      hourly_rate ?? null,
      years_experience: years_experience ?? null,
      work_preference:  work_preference ?? null,
      timezone:         timezone ?? 'UTC',
      hours_per_week:   hours_per_week ?? null,
      min_budget:       min_budget ?? null,
      about:            about ?? null,
      portfolio:        portfolio ?? [],
      onboarded:        true,
    },
    { onConflict: 'user_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Generate and store profile embedding asynchronously (non-blocking on failure)
  generateEmbedding(
    profileEmbeddingText({ name, about, skills: skills ?? [] })
  ).then(embedding => {
    supabase.from('profiles')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('user_id', user.id)
  }).catch(() => {/* embedding is best-effort */})

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = [
    'learning_skills', 'learned_skills', 'platform_accounts',
    'hourly_rate', 'about', 'portfolio', 'hours_per_week',
    'work_preference', 'timezone', 'min_budget',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
