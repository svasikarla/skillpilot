import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const DAILY_LIMIT = 15

const PLATFORM_STYLE: Record<string, string> = {
  Upwork:     'Conversational, direct, specific. First sentence must hook with your exact experience. No fluff. Max 150 words for concise variant.',
  Toptal:     'Professional, technical, confident. Emphasise seniority and past outcomes. Structured with clear value proposition.',
  Contra:     'Friendly, founder-to-founder tone. Show personality and specific past work. Shorter is better.',
  Braintrust: 'Technical and results-focused. Use numbers wherever possible. Mention availability and timezone explicitly.',
  default:    'Professional, concise, results-focused. Hook first. Numbers over adjectives. End with one smart question.',
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit check
  const dayAgo = new Date(Date.now() - 86400000).toISOString()
  const { count } = await supabase
    .from('proposal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('generated_at', dayAgo)

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: `Daily limit of ${DAILY_LIMIT} proposals reached. Resets in 24 hours.` }, { status: 429 })
  }

  const { job_id, member_value, past_result, question_for_client } = await request.json()

  if (!member_value || !past_result || !question_for_client) {
    return NextResponse.json({ error: 'All three inputs are required' }, { status: 400 })
  }

  // Fetch job details
  const { data: job } = await supabase
    .from('jobs')
    .select('title, company, platform, description, skills, rate_min, rate_max')
    .eq('id', job_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, skills, hourly_rate')
    .eq('user_id', user.id)
    .single()

  const platformStyle = PLATFORM_STYLE[job.platform] ?? PLATFORM_STYLE.default
  const rateRange = job.rate_min && job.rate_max ? `$${job.rate_min}–$${job.rate_max}/hr` : 'not specified'

  const systemPrompt = `You are an expert freelance proposal writer for AI/ML professionals.
You write proposals that win work — not corporate fluff.

PLATFORM STYLE for ${job.platform}: ${platformStyle}

STRICT RULES (never break these):
- Never use: "leverage", "delve", "robustly", "synergy", "excited to", "passionate about", "I would love to"
- Never use em-dashes (—)
- Never start with "I"
- Vary sentence length — mix short punchy sentences with longer explanatory ones
- Hook must be in the first sentence — no "My name is..." openers
- Include exactly ONE question at the end
- No bullet points, no headers — flowing prose only

OUTPUT: Return a JSON object with three keys: "concise" (140-150 words), "standard" (175-185 words), "detailed" (210-220 words). Nothing else.`

  const userMessage = `Write 3 proposal variants for this freelance job:

JOB: ${job.title} at ${job.company ?? 'a company'}
PLATFORM: ${job.platform}
RATE: ${rateRange}
REQUIRED SKILLS: ${(job.skills ?? []).join(', ')}
JOB DESCRIPTION (excerpt): ${(job.description ?? '').slice(0, 600)}

FREELANCER:
- Name: ${profile?.name ?? 'the applicant'}
- Skills: ${(profile?.skills ?? []).slice(0, 8).join(', ')}
- Target rate: ${profile?.hourly_rate ? `$${profile.hourly_rate}/hr` : 'not specified'}

FREELANCER INPUTS:
1. Specific value I bring: ${member_value}
2. Measurable past result: ${past_result}
3. Question for client: ${question_for_client}

Return only the JSON object with "concise", "standard", and "detailed" keys.`

  try {
    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const variants = JSON.parse(jsonMatch[0]) as { concise: string; standard: string; detailed: string }

    // Log usage
    await supabase.from('proposal_logs').insert({ user_id: user.id, job_id: job_id ?? null })

    return NextResponse.json({ variants })
  } catch (err) {
    console.error('[proposals/generate]', err)
    return NextResponse.json({ error: 'Generation failed — try again' }, { status: 500 })
  }
}
