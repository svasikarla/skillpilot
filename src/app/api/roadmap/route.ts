import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeRoadmap } from '@/lib/roadmap'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills, learned_skills, learning_skills, hourly_rate')
    .eq('user_id', user.id)
    .single()

  const userSkills    = profile?.skills ?? []
  const learnedSkills = (profile?.learned_skills as string[]) ?? []
  const learningSkills = (profile?.learning_skills as string[]) ?? []

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('skills, rate_min, rate_max')
    .eq('status', 'approved')
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const gaps = computeRoadmap(userSkills, learnedSkills, jobs ?? [])

  return NextResponse.json({
    gaps,
    learningSkills,
    learnedSkills,
    userSkillCount: userSkills.length,
    totalJobs: (jobs ?? []).length,
  })
}
