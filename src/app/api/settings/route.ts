import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  digestOptOut: z.boolean().optional(),
  about:        z.string().optional(),
  displayName:  z.string().min(2).optional(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members')
    .select('display_name, about, target_hourly_rate, years_experience, portfolio, digest_opt_out, github_url, created_at')
    .eq('id', user.id)
    .single()

  const { count: skillCount } = await supabase
    .from('member_skills')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', user.id)

  const { count: appCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', user.id)

  const portfolio = Array.isArray(member?.portfolio) ? member.portfolio : []

  // Compute profile completeness
  let score = 0
  if (member?.display_name)         score += 15
  if (member?.about)                 score += 20
  if (member?.target_hourly_rate)    score += 10
  if (member?.years_experience)      score += 10
  if ((skillCount ?? 0) >= 3)        score += 20
  if (portfolio.length > 0)          score += 15
  if (member?.github_url)            score += 10

  return NextResponse.json({
    member,
    email:       user.email,
    skillCount:  skillCount ?? 0,
    appCount:    appCount   ?? 0,
    completeness: score,
  })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (parsed.data.digestOptOut !== undefined) update.digest_opt_out = parsed.data.digestOptOut
  if (parsed.data.about        !== undefined) update.about           = parsed.data.about
  if (parsed.data.displayName  !== undefined) update.display_name    = parsed.data.displayName

  const { error } = await supabase.from('members').update(update).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
