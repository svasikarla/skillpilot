import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PROPOSAL, MODELS } from '@/lib/config'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GenerateBody {
  jobId:          string
  memberValue:    string   // "what value I bring"
  pastResult:     string   // "one measurable past result"
  clientQuestion: string   // "question for the client"
}

interface ProposalVariants {
  concise:  string   // 140–150 words
  standard: string   // 175–185 words
  detailed: string   // 210–220 words
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as GenerateBody
  const { jobId, memberValue, pastResult, clientQuestion } = body

  if (!memberValue?.trim() || !pastResult?.trim() || !clientQuestion?.trim()) {
    return NextResponse.json({ error: 'All three fields are required' }, { status: 400 })
  }

  // Check daily limit
  const admin = await createAdminClient()
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { count } = await admin
    .from('proposal_logs')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', user.id)
    .gte('generated_at', since)

  if ((count ?? 0) >= PROPOSAL.dailyLimit) {
    return NextResponse.json(
      { error: `Daily proposal limit reached (${PROPOSAL.dailyLimit}/day). Try again tomorrow.` },
      { status: 429 }
    )
  }

  // Load job + platform
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      title, description_excerpt, extracted_skills, rate_min, rate_max,
      platforms ( name, platform_tips, application_guide )
    `)
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Load member profile
  const { data: member } = await supabase
    .from('members')
    .select('display_name, about, target_hourly_rate, years_experience, portfolio')
    .eq('id', user.id)
    .single()

  const { data: memberSkills } = await supabase
    .from('member_skills')
    .select('self_rating, skills ( name )')
    .eq('member_id', user.id)
    .gte('self_rating', 3)
    .order('self_rating', { ascending: false })
    .limit(10)

  const skillNames = (memberSkills ?? []).flatMap((r: { skills: Array<{ name: string }> | { name: string } | null }) => {
    if (!r.skills) return []
    return Array.isArray(r.skills) ? r.skills.map(s => s.name) : [r.skills.name]
  })

  // Find best portfolio item (first one for now)
  const portfolio = Array.isArray(member?.portfolio) ? member.portfolio as Array<{ name?: string; description?: string; outcome?: string }> : []
  const bestPortfolio = portfolio[0]

  type PlatRow = { name: string; platform_tips: string | null; application_guide: string | null }
  const platRaw = job.platforms as PlatRow | PlatRow[] | null
  const plat    = platRaw ? (Array.isArray(platRaw) ? platRaw[0] : platRaw) : null

  // Extract platform style tip
  const styleTip = plat?.platform_tips
    ? plat.platform_tips.split('\n').slice(0, 3).join(' ')
    : 'Lead with your strongest result in the first two lines.'

  const systemPrompt = `You are an expert freelance proposal writer for AI/ML professionals.
Write three proposal variants for a job application. Return ONLY valid JSON — no prose, no markdown wrapping.

Return this exact JSON shape:
{
  "concise":  "...",
  "standard": "...",
  "detailed": "..."
}

Word count targets:
- concise:  ${PROPOSAL.variants.concise.min}–${PROPOSAL.variants.concise.max} words
- standard: ${PROPOSAL.variants.standard.min}–${PROPOSAL.variants.standard.max} words
- detailed: ${PROPOSAL.variants.detailed.min}–${PROPOSAL.variants.detailed.max} words

Rules:
- NEVER start with "I" — open with the client's problem or a result
- The first 2 lines must hook the reader (${plat?.name ?? 'clients'} shows only a preview)
- Be specific — reference the job title or their stack
- Include the past result naturally with a number
- End with the client question
- No generic phrases: "passionate about", "team player", "would love to", "looking forward"
- No em-dashes (—) — use commas or periods instead

Platform: ${plat?.name ?? 'General'}
Platform style guidance: ${styleTip}`

  const userPrompt = `Job: ${job.title}
Required skills: ${(job.extracted_skills ?? []).join(', ')}
Job excerpt: ${job.description_excerpt ?? '(no excerpt)'}

My profile:
- Skills: ${skillNames.join(', ')}
- Experience: ${member?.years_experience ?? '?'} years
- About: ${member?.about?.slice(0, 200) ?? '(no bio)'}
${bestPortfolio ? `- Best portfolio match: ${bestPortfolio.name} — ${bestPortfolio.description ?? ''} — Result: ${bestPortfolio.outcome ?? ''}` : ''}

Context I'm providing:
- Value I bring: ${memberValue}
- Past result: ${pastResult}
- Question for client: ${clientQuestion}`

  try {
    const response = await anthropic.messages.create({
      model:      MODELS.proposals,
      max_tokens: 1024,
      messages:   [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const variants: ProposalVariants = JSON.parse(cleaned)

    if (!variants.concise || !variants.standard || !variants.detailed) {
      throw new Error('Incomplete response from AI')
    }

    // Log without storing text
    await admin.from('proposal_logs').insert({
      member_id:  user.id,
      job_id:     jobId,
      platform_id: null,
    })

    return NextResponse.json({ variants })
  } catch (err) {
    console.error('[proposals/generate] error:', err)
    return NextResponse.json({ error: 'Failed to generate proposals. Please try again.' }, { status: 500 })
  }
}
