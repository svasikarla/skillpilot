import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from('jobs')
      .select('title, company, platform, description, skills, rate_min, rate_max')
      .eq('id', id).single(),
    supabase.from('profiles')
      .select('skills, skill_ratings, hourly_rate, portfolio, years_experience')
      .eq('user_id', user.id).single(),
  ])

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const userSkillsLower = new Set((profile?.skills ?? []).map((s: string) => s.toLowerCase()))
  const matched = (job.skills ?? []).filter((s: string) => userSkillsLower.has(s.toLowerCase()))
  const missing = (job.skills ?? []).filter((s: string) => !userSkillsLower.has(s.toLowerCase()))

  const portfolioText = Array.isArray(profile?.portfolio) && profile.portfolio.length > 0
    ? (profile.portfolio as { name: string; result: string }[]).map(p => `${p.name}: ${p.result}`).join('; ')
    : 'No portfolio items'

  const systemPrompt = `You are a competitive intelligence coach for AI/ML freelancers.
Give 5 specific, actionable tips to help this freelancer stand out for THIS specific job.
Return ONLY a JSON array of 5 strings — no markdown, no explanation outside JSON.`

  const userMessage = `Job: "${job.title}" at ${job.company ?? 'a company'} on ${job.platform}
Rate: ${job.rate_min && job.rate_max ? `$${job.rate_min}–$${job.rate_max}/hr` : 'undisclosed'}
Required skills: ${(job.skills ?? []).join(', ')}
Description excerpt: ${(job.description ?? '').slice(0, 500)}

Freelancer:
- Matched skills: ${matched.join(', ') || 'none'}
- Missing skills: ${missing.join(', ') || 'none'}
- Portfolio: ${portfolioText}
- Experience: ${profile?.years_experience ?? 'unspecified'} years

Return exactly: ["tip1", "tip2", "tip3", "tip4", "tip5"]
Each tip must be specific to THIS job — no generic advice.`

  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array')
    const tips: string[] = JSON.parse(match[0])

    return NextResponse.json({ tips })
  } catch (err) {
    console.error('[standout]', err)
    return NextResponse.json({ error: 'Failed to generate tips' }, { status: 500 })
  }
}
