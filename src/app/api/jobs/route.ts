import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMatch } from '@/lib/matching'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q        = searchParams.get('q')?.trim() ?? ''
  const skill    = searchParams.get('skill')?.trim() ?? ''
  const verified = searchParams.get('verified') === '1'

  const supabase = await createClient()

  // Fetch user profile for match scoring
  const { data: { user } } = await supabase.auth.getUser()
  let userSkills: string[] = []
  let skillRatings: Record<string, number> = {}
  let hourlyRate: number | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, skill_ratings, hourly_rate')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      userSkills   = profile.skills ?? []
      skillRatings = (profile.skill_ratings as Record<string, number>) ?? {}
      hourlyRate   = profile.hourly_rate ?? null
    }
  }

  let query = supabase
    .from('jobs')
    .select('id, title, company, description, platform, url, skills, location, rate_min, rate_max, posted_at, reliability_score')
    .eq('status', 'approved')
    .order('posted_at', { ascending: false })
    .limit(100)

  if (q) {
    query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`)
  }
  if (skill) {
    query = query.contains('skills', [skill])
  }
  if (verified) {
    query = query.gte('reliability_score', 70)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute match scores and sort by score desc
  const jobs = (data ?? []).map(job => {
    const match = computeMatch({
      userSkills,
      skillRatings,
      hourlyRate,
      jobSkills:    job.skills ?? [],
      jobRateMin:   job.rate_min,
      jobRateMax:   job.rate_max,
      jobPostedAt:  job.posted_at,
    })
    return { ...job, match_score: match.score, matched_skills: match.matchedSkills }
  })

  jobs.sort((a, b) => b.match_score - a.match_score)

  return NextResponse.json({ jobs: jobs.slice(0, 50) })
}
