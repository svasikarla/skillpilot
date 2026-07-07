import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMatch } from '@/lib/matching'
import { computeRoadmap } from '@/lib/roadmap'
import { prepareUserSkills } from '@/lib/skills-canonical'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  // Fetch all active members who haven't opted out
  const { data: members } = await supabase
    .from('profiles')
    .select('user_id, name, skills, skill_ratings, hourly_rate, learned_skills, digest_opt_out')
    .eq('is_active', true)
    .eq('digest_opt_out', false)

  if (!members?.length) return NextResponse.json({ ok: true, sent: 0 })

  // Fetch new jobs from last 7 days
  const { data: newJobs } = await supabase
    .from('jobs')
    .select('id, title, platform, url, skills, rate_min, rate_max, rate_type, posted_at')
    .eq('status', 'approved')
    .gte('posted_at', sevenDaysAgo)
    .limit(200)

  // Fetch all approved jobs for roadmap
  const { data: allJobs } = await supabase
    .from('jobs').select('skills, rate_min, rate_max, rate_type').eq('status', 'approved').limit(500)

  let sent = 0

  for (const member of members) {
    const userSkills    = prepareUserSkills(member.skills ?? [])
    const skillRatings  = (member.skill_ratings as Record<string, number>) ?? {}
    const hourlyRate    = member.hourly_rate ?? null
    const learnedSkills = (member.learned_skills as string[]) ?? []

    // Top 5 job matches from new jobs
    const scored = (newJobs ?? []).map(job => ({
      ...job,
      match: computeMatch({ userSkills, skillRatings, hourlyRate, jobSkills: job.skills ?? [], jobRateMin: job.rate_min, jobRateMax: job.rate_max, jobRateType: job.rate_type ?? 'hourly', jobPostedAt: job.posted_at }),
    }))
    scored.sort((a, b) => b.match.score - a.match.score)
    const top5 = scored.slice(0, 5)

    // Top roadmap gap
    const gaps = computeRoadmap(userSkills, learnedSkills, allJobs ?? [])
    const topGap = gaps[0] ?? null

    if (!top5.length) continue

    // Fetch member email from auth
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find(u => u.id === member.user_id)
    if (!authUser?.email) continue

    // Build plain-text digest email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) continue

    const jobLines = top5.map((j, i) =>
      `${i + 1}. ${j.title} on ${j.platform} — ${j.match.score}% match\n   ${j.url ?? 'No link'}`
    ).join('\n\n')

    const upskillLine = topGap
      ? `\nTop skill to add: ${topGap.skill} — unlocks ${topGap.jobsUnlocked} jobs averaging $${topGap.avgRate}/hr`
      : ''

    const emailBody = `Hi ${member.name ?? 'there'},\n\nHere are your top 5 new AI/ML gigs this week:\n\n${jobLines}${upskillLine}\n\nSee all matches: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://yourapp.vercel.app'}/feed\n\n—\nAI/ML Freelance Hub`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    'AI/ML Freelance Hub <digest@yourdomain.com>',
        to:      authUser.email,
        subject: `Your top ${top5.length} AI/ML gigs this week`,
        text:    emailBody,
      }),
    })

    sent++
  }

  return NextResponse.json({ ok: true, sent, members: members.length })
}
