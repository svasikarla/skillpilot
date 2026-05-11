import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { WeeklyDigest } from '@/../emails/WeeklyDigest'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[weekly-digest] RESEND_API_KEY not set — skipping email send')
    return NextResponse.json({ ok: true, skipped: true, reason: 'No RESEND_API_KEY' })
  }

  const resend = new Resend(resendKey)
  const admin  = await createAdminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Wins this week (anonymised count)
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const { count: winsThisWeek } = await admin
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'won')
    .gte('updated_at', weekAgo)

  // Active members not opted out
  const { data: members } = await admin
    .from('members')
    .select('id, email, display_name')
    .eq('is_active', true)
    .eq('digest_opt_out', false)

  if (!members || members.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const member of members) {
    if (!member.email) continue

    // Top 5 new job matches from past week
    const { data: matches } = await admin
      .from('member_job_matches')
      .select('match_score, jobs ( title, source_url, platforms ( name ) )')
      .eq('member_id', member.id)
      .gte('computed_at', weekAgo)
      .order('match_score', { ascending: false })
      .limit(5)

    type JobRow = { title: string; source_url: string; platforms: { name: string } | { name: string }[] | null }
    const jobs = (matches ?? []).flatMap(m => {
      const job = (m.jobs as unknown) as JobRow | null
      if (!job) return []
      const platRaw = job.platforms
      const plat    = platRaw ? (Array.isArray(platRaw) ? platRaw[0] : platRaw) : null
      return [{
        title:      job.title,
        platform:   plat?.name ?? '—',
        matchScore: Math.round(Number(m.match_score)),
        url:        job.source_url,
      }]
    })

    // Upskill nudge: top gap skill with most jobs
    const { data: memberSkills } = await admin
      .from('member_skills')
      .select('skills ( name ), self_rating')
      .eq('member_id', member.id)
      .gte('self_rating', 3)

    const hasSkills = new Set<string>()
    for (const r of (memberSkills ?? [])) {
      const sk = r.skills as { name: string } | { name: string }[] | null
      const names = sk ? (Array.isArray(sk) ? sk.map(s => s.name) : [sk.name]) : []
      for (const n of names) hasSkills.add(n)
    }

    // Count gap skill frequency in recent approved jobs
    const { data: recentJobs } = await admin
      .from('jobs')
      .select('extracted_skills')
      .eq('status', 'approved')
      .gte('posted_at', weekAgo)
      .not('extracted_skills', 'is', null)

    const gapCounts = new Map<string, number>()
    for (const job of (recentJobs ?? [])) {
      for (const skill of (job.extracted_skills ?? []) as string[]) {
        if (!hasSkills.has(skill)) {
          gapCounts.set(skill, (gapCounts.get(skill) ?? 0) + 1)
        }
      }
    }

    let topGapSkill: string | null = null
    let topGapCount = 0
    for (const [skill, count] of gapCounts) {
      if (count > topGapCount) { topGapCount = count; topGapSkill = skill }
    }

    const upskillTip = topGapSkill
      ? `"${topGapSkill}" appeared in ${topGapCount} new jobs this week. Check your Roadmap for a learning resource.`
      : null

    try {
      await resend.emails.send({
        from:    'AI/ML Freelance Hub <digest@aimlfreelancehub.com>',
        to:      member.email,
        subject: `Your weekly digest — ${jobs.length} new match${jobs.length !== 1 ? 'es' : ''}`,
        react:   WeeklyDigest({
          displayName:  member.display_name ?? 'there',
          jobs,
          winsThisWeek: winsThisWeek ?? 0,
          upskillTip,
          appUrl,
        }),
      })
      sent++
    } catch (err) {
      console.error(`[weekly-digest] failed for ${member.email}:`, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: members.length })
}
