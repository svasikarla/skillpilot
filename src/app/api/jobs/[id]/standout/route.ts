import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { MODELS } from '@/lib/config'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load job
  const { data: job } = await supabase
    .from('jobs')
    .select('title, description_excerpt, extracted_skills, platforms ( name )')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load member profile
  const { data: member } = await supabase
    .from('members')
    .select('about, years_experience')
    .eq('id', user.id)
    .single()

  const { data: memberSkills } = await supabase
    .from('member_skills')
    .select('self_rating, skills ( name )')
    .eq('member_id', user.id)
    .gte('self_rating', 3)
    .limit(8)

  const skillNames = (memberSkills ?? []).flatMap((r: { skills: Array<{ name: string }> | { name: string } | null }) => {
    if (!r.skills) return []
    return Array.isArray(r.skills) ? r.skills.map(s => s.name) : [r.skills.name]
  })

  const jobSkills    = (job.extracted_skills ?? []) as string[]
  const matched      = skillNames.filter(s => jobSkills.includes(s))
  const missing      = jobSkills.filter(s => !skillNames.includes(s))
  const platRaw      = job.platforms as { name: string } | Array<{ name: string }> | null
  const plat         = platRaw ? (Array.isArray(platRaw) ? platRaw[0] : platRaw) : null

  const prompt = `You give AI/ML freelancers specific advice for standing out on job applications.

Job: ${job.title} on ${plat?.name ?? 'a freelance platform'}
Required skills: ${jobSkills.join(', ')}
Candidate skills (self-rated 3+): ${skillNames.join(', ')}
Matched skills: ${matched.join(', ') || 'none'}
Missing skills: ${missing.join(', ') || 'none'}
Candidate experience: ${member?.years_experience ?? '?'} years
Job description: ${job.description_excerpt ?? '(no excerpt)'}

Give exactly 5 SPECIFIC stand-out tips for this candidate applying to this job.
Rules:
- Each tip must be actionable and specific to THIS job and THIS candidate
- No generic advice ("be professional", "proofread your proposal")
- Tip 1 should address their strongest matched skill angle
- If they have missing skills, Tip 2 should show how to address or reframe the gap
- Tips should mention specifics from the job description
- Return ONLY a JSON array of 5 strings. No prose.

Example format: ["tip one", "tip two", "tip three", "tip four", "tip five"]`

  try {
    const res = await anthropic.messages.create({
      model:      MODELS.standout,
      max_tokens: 512,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw = res.content[0].type === 'text' ? res.content[0].text : '[]'
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const tips: string[] = JSON.parse(cleaned)

    return NextResponse.json({ tips: tips.slice(0, 5) })
  } catch (err) {
    console.error('[standout] error:', err)
    return NextResponse.json({ error: 'Failed to generate tips' }, { status: 500 })
  }
}
