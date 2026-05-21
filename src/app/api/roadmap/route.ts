import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRoadmap } from '@/lib/roadmap'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, hourly_rate')
    .eq('user_id', user.id)
    .single()

  const userSkills = profile?.skills ?? []

  // Fetch all approved jobs with skills + rates
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('skills, rate_min, rate_max')
    .eq('status', 'approved')
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const gaps = computeRoadmap(userSkills, jobs ?? [])

  return NextResponse.json({
    gaps,
    userSkillCount: userSkills.length,
    totalJobs: (jobs ?? []).length,
  })
}
