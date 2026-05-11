import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { embed, buildProfileEmbeddingText, serializeEmbedding } from '@/lib/embeddings'

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    // Silently skip — embeddings optional until key is added
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { memberId } = await req.json() as { memberId?: string }
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const supabase = await createAdminClient()

  const { data: member } = await supabase
    .from('members')
    .select('about, display_name, portfolio')
    .eq('id', memberId)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: skillRows } = await supabase
    .from('member_skills')
    .select('skills ( name )')
    .eq('member_id', memberId)
    .gte('self_rating', 2)

  const skillNames = (skillRows ?? [])
    .map((r: { skills: Array<{ name: string }> | { name: string } | null }) => {
      if (!r.skills) return null
      return Array.isArray(r.skills) ? (r.skills[0]?.name ?? null) : r.skills.name
    })
    .filter((n): n is string => n !== null)

  const portfolio = Array.isArray(member.portfolio) ? member.portfolio as Array<{ description?: string }> : []

  const text = buildProfileEmbeddingText(
    { about: member.about, displayName: member.display_name },
    skillNames,
    portfolio,
  )

  const vec = await embed(text)

  await supabase
    .from('members')
    .update({ profile_embedding: serializeEmbedding(vec) })
    .eq('id', memberId)

  return NextResponse.json({ ok: true })
}
