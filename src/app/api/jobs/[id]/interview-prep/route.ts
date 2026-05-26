import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const DAILY_LIMIT = 5

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jobId } = await params

  // Rate limit: 5 interview-prep calls per user per day
  const since = new Date(Date.now() - 86400000).toISOString()
  const { count } = await supabase
    .from('proposal_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('variant', 'interview-prep')
    .gte('created_at', since)

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: `Daily limit reached (${DAILY_LIMIT} interview preps per day)` },
      { status: 429 }
    )
  }

  // Fetch job
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('title, company, description, skills')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const skillList = (job.skills as string[] ?? []).slice(0, 10).join(', ')
  const prompt = `You are a senior technical interviewer. Generate exactly 5 concise technical interview Q&A pairs for a "${job.title}"${job.company ? ` role at ${job.company}` : ''}.

Key skills: ${skillList || 'general AI/ML engineering'}

Rules:
- Questions must be specific, technical, and likely to be asked in a real interview
- Answers must be concise (2–3 sentences max) and demonstrate genuine expertise
- Mix: 2 conceptual, 2 practical/scenario, 1 system-design question
- Do NOT include generic HR questions

Return ONLY valid JSON, no markdown fences:
{"questions":[{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]}`

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1200,
    messages:   [{ role: 'user', content: prompt }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text.trim()

  let questions: { q: string; a: string }[]
  try {
    const parsed = JSON.parse(raw) as { questions: { q: string; a: string }[] }
    questions = parsed.questions
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('empty')
  } catch {
    return NextResponse.json({ error: 'Failed to parse interview questions' }, { status: 500 })
  }

  // Log usage (no content stored)
  await supabase.from('proposal_logs').insert({
    user_id: user.id,
    job_id:  jobId,
    variant: 'interview-prep',
  })

  return NextResponse.json({ questions })
}
