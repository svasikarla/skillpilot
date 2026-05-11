import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  skillName: z.string(),
  status:    z.enum(['active', 'learning', 'planned']),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { skillName, status } = parsed.data

  // Look up skill id
  const { data: skill } = await supabase
    .from('skills')
    .select('id')
    .eq('name', skillName)
    .single()

  if (!skill) return NextResponse.json({ error: 'Skill not found' }, { status: 404 })

  // Upsert member_skills row (self_rating=1 when inserting a new gap skill)
  const { error } = await supabase
    .from('member_skills')
    .upsert(
      { member_id: user.id, skill_id: skill.id, self_rating: 1, status },
      { onConflict: 'member_id,skill_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
