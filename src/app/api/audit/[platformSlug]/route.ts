import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { MODELS } from '@/lib/config'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface AuditIssue {
  issue:  string
  fix:    string
  impact: string
}
export interface AuditResult {
  critical:      AuditIssue[]
  important:     AuditIssue[]
  nice_to_have:  AuditIssue[]
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ platformSlug: string }> }
) {
  const { platformSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load platform
  const { data: platform } = await supabase
    .from('platforms')
    .select('name, application_guide, platform_tips')
    .eq('slug', platformSlug)
    .single()

  if (!platform) return NextResponse.json({ error: 'Platform not found' }, { status: 404 })

  // Load member profile
  const { data: member } = await supabase
    .from('members')
    .select('display_name, about, target_hourly_rate, years_experience, portfolio, github_url')
    .eq('id', user.id)
    .single()

  const { data: memberSkills } = await supabase
    .from('member_skills')
    .select('self_rating, skills ( name )')
    .eq('member_id', user.id)
    .gte('self_rating', 3)
    .order('self_rating', { ascending: false })
    .limit(15)

  const skillNames = (memberSkills ?? []).flatMap((r: { skills: { name: string } | { name: string }[] | null }) => {
    if (!r.skills) return []
    return Array.isArray(r.skills) ? r.skills.map(s => s.name) : [r.skills.name]
  })

  const portfolio = Array.isArray(member?.portfolio)
    ? member.portfolio as Array<{ name?: string; description?: string; outcome?: string }>
    : []

  const prompt = `You are an expert at optimising freelancer profiles for AI/ML talent on platforms like ${platform.name}.

Analyse this profile and return a JSON audit with three priority tiers.

Platform: ${platform.name}
Platform guidance: ${(platform.platform_tips ?? platform.application_guide ?? '').slice(0, 400)}

Member profile:
- Name: ${member?.display_name ?? 'Unknown'}
- Experience: ${member?.years_experience ?? '?'} years
- About: ${(member?.about ?? '').slice(0, 300)}
- Skills: ${skillNames.join(', ')}
- Portfolio items: ${portfolio.length} (${portfolio.map(p => p.name).filter(Boolean).join(', ')})
- GitHub: ${member?.github_url ? 'provided' : 'not provided'}
- Target rate: $${member?.target_hourly_rate ?? '?'}/hr

Return ONLY this JSON shape (no prose, no markdown wrapping):
{
  "critical":     [{"issue": "...", "fix": "...", "impact": "..."}],
  "important":    [{"issue": "...", "fix": "...", "impact": "..."}],
  "nice_to_have": [{"issue": "...", "fix": "...", "impact": "..."}]
}

Rules:
- critical: things that would cause rejection or very low visibility (max 3)
- important: significant improvements worth 30min of work each (max 4)
- nice_to_have: polish items (max 3)
- All advice must be specific to ${platform.name} and this exact profile
- Mention specific skills, missing items, or concrete actions
- No generic advice ("be professional", "proofread your work")`

  try {
    const res = await anthropic.messages.create({
      model:      MODELS.audit,
      max_tokens: 1024,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw     = res.content[0].type === 'text' ? res.content[0].text : '{}'
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const result: AuditResult = JSON.parse(cleaned)

    return NextResponse.json({ result, platformName: platform.name })
  } catch (err) {
    console.error('[audit] error:', err)
    return NextResponse.json({ error: 'Failed to generate audit' }, { status: 500 })
  }
}
