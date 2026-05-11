import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { computeMatch } from '@/lib/matching'
import { FEED } from '@/lib/config'
import type { MemberProfile, JobForMatch } from '@/lib/matching'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()

  // Load active members with their skills
  const { data: members, error: membersErr } = await supabase
    .from('members')
    .select(`
      id, target_hourly_rate, hours_per_week, years_experience, profile_embedding,
      member_skills ( skill_id, self_rating, skills ( name ) )
    `)
    .eq('is_active', true)

  if (membersErr) {
    return NextResponse.json({ error: membersErr.message }, { status: 500 })
  }

  // Load approved jobs from the last N days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - FEED.maxJobAgedays)

  const { data: jobs, error: jobsErr } = await supabase
    .from('jobs')
    .select('id, extracted_skills, job_embedding, rate_min, rate_max, description')
    .eq('status', 'approved')
    .gte('posted_at', cutoff.toISOString())

  if (jobsErr) {
    return NextResponse.json({ error: jobsErr.message }, { status: 500 })
  }

  let matchesUpserted = 0

  for (const rawMember of (members ?? [])) {
    const memberProfile: MemberProfile = {
      id:               rawMember.id,
      targetHourlyRate: rawMember.target_hourly_rate ? Number(rawMember.target_hourly_rate) : null,
      hoursPerWeek:     rawMember.hours_per_week,
      yearsExperience:  rawMember.years_experience,
      profileEmbedding: rawMember.profile_embedding,
      skills: (rawMember.member_skills ?? []).map((ms: {
        self_rating: number
        skills: Array<{ name: string }> | { name: string } | null
      }) => {
        const skillName = Array.isArray(ms.skills) ? ms.skills[0]?.name : ms.skills?.name
        return { name: skillName ?? '', selfRating: ms.self_rating }
      }).filter((s: { name: string }) => s.name),
    }

    for (const rawJob of (jobs ?? [])) {
      const jobForMatch: JobForMatch = {
        id:              rawJob.id,
        extractedSkills: rawJob.extracted_skills,
        jobEmbedding:    rawJob.job_embedding,
        rateMin:         rawJob.rate_min ? Number(rawJob.rate_min) : null,
        rateMax:         rawJob.rate_max ? Number(rawJob.rate_max) : null,
        description:     rawJob.description,
      }

      const result = computeMatch(memberProfile, jobForMatch)

      await supabase.from('member_job_matches').upsert({
        member_id:      result.memberId,
        job_id:         result.jobId,
        match_score:    result.matchScore,
        skill_score:    result.skillScore,
        semantic_score: result.semanticScore,
        rate_score:     result.rateScore,
        exp_score:      result.expScore,
        avail_score:    result.availScore,
        matched_skills: result.matchedSkills,
        missing_skills: result.missingSkills,
        is_near_miss:   result.isNearMiss,
        computed_at:    new Date().toISOString(),
      }, { onConflict: 'member_id,job_id' })

      matchesUpserted++
    }
  }

  return NextResponse.json({
    ok:              true,
    members:         (members ?? []).length,
    jobs:            (jobs ?? []).length,
    matchesUpserted,
  })
}
