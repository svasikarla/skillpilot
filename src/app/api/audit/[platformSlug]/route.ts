import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Props { params: Promise<{ platformSlug: string }> }

export async function GET(_req: Request, { params }: Props) {
  const { platformSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: profile }, { data: platform }] = await Promise.all([
    supabase.from('profiles')
      .select('name, skills, skill_ratings, hourly_rate, years_experience, about, portfolio')
      .eq('user_id', user.id).single(),
    supabase.from('platforms')
      .select('name, tips, red_flags, guide_md')
      .eq('slug', platformSlug).single(),
  ])

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (!platform) return NextResponse.json({ error: 'Platform not found' }, { status: 404 })

  const portfolioText = Array.isArray(profile.portfolio) && profile.portfolio.length > 0
    ? (profile.portfolio as { name: string; result: string; stack: string[] }[])
        .map(p => `- ${p.name}: ${p.result} (${(p.stack ?? []).join(', ')})`)
        .join('\n')
    : 'No portfolio items'

  const systemPrompt = `You are an expert freelance profile coach for AI/ML professionals.
Analyse the freelancer's profile against the specific norms of ${platform.name}.
Return ONLY a JSON object — no markdown, no prose outside JSON.`

  const userMessage = `Platform: ${platform.name}
Platform tips: ${(platform.tips ?? []).join('; ')}
Platform red flags to avoid: ${(platform.red_flags ?? []).join('; ')}

Freelancer profile:
- Name: ${profile.name}
- Skills: ${(profile.skills ?? []).join(', ')}
- Hourly rate: ${profile.hourly_rate ? `$${profile.hourly_rate}/hr` : 'not set'}
- Years experience: ${profile.years_experience ?? 'not specified'}
- Bio: ${profile.about ?? 'not provided'}
- Portfolio:
${portfolioText}

Return a JSON object exactly like this:
{
  "critical": [{"issue": "...", "fix": "...", "impact": "..."}],
  "important": [{"issue": "...", "fix": "...", "impact": "..."}],
  "nice_to_have": [{"issue": "...", "fix": "...", "impact": "..."}]
}

Rules:
- critical: issues that actively hurt response rate (max 3)
- important: issues that reduce visibility or conversions (max 3)
- nice_to_have: improvements for later (max 3)
- Each fix must be specific and actionable — not generic advice
- impact must quantify the benefit where possible`

  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const audit = JSON.parse(jsonMatch[0])

    return NextResponse.json({ audit, platform: platform.name })
  } catch (err) {
    console.error('[audit]', err)
    return NextResponse.json({ error: 'Audit generation failed' }, { status: 500 })
  }
}
