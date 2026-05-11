import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildWorkflow } from '@/lib/application-workflow'
import type { WorkflowMemberContext } from '@/lib/application-workflow'
import ApplyClient from './ApplyClient'

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load job with platform
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      id, title, description, extracted_skills, status,
      platforms ( id, name, slug, application_guide, platform_tips )
    `)
    .eq('id', jobId)
    .single()

  if (!job || job.status === 'rejected') notFound()

  // Load member profile + skills
  const { data: member } = await supabase
    .from('members')
    .select('id, display_name, target_hourly_rate, years_experience, portfolio')
    .eq('id', user.id)
    .single()

  const { data: memberSkills } = await supabase
    .from('member_skills')
    .select('skills ( name )')
    .eq('member_id', user.id)
    .gte('self_rating', 2)

  type PlatRow = { id: number; name: string; slug: string; application_guide: string | null; platform_tips: string | null }
  const platRaw = job.platforms as PlatRow | PlatRow[] | null
  const plat    = platRaw ? (Array.isArray(platRaw) ? platRaw[0] : platRaw) : null

  const { data: platformAccount } = await supabase
    .from('member_platform_accounts')
    .select('has_account')
    .eq('member_id', user.id)
    .eq('platform_id', plat?.id ?? 0)
    .maybeSingle()

  // Load existing application if any
  const { data: existingApp } = await supabase
    .from('applications')
    .select('id, status, checklist_state')
    .eq('member_id', user.id)
    .eq('job_id', jobId)
    .maybeSingle()

  // Build member context
  const memberSkillNames = (memberSkills ?? []).flatMap((r: { skills: Array<{ name: string }> | { name: string } | null }) => {
    if (!r.skills) return []
    return Array.isArray(r.skills) ? r.skills.map((s: { name: string }) => s.name) : [r.skills.name]
  })

  const jobSkills = job.extracted_skills ?? []
  const matched  = memberSkillNames.filter((s: string) => jobSkills.includes(s))
  const missing  = jobSkills.filter((s: string) => !memberSkillNames.includes(s))

  const portfolio = Array.isArray(member?.portfolio) ? member.portfolio as unknown[] : []

  const ctx: WorkflowMemberContext = {
    hasAccount:          platformAccount?.has_account ?? false,
    displayName:         member?.display_name ?? 'Member',
    targetHourlyRate:    member?.target_hourly_rate ? Number(member.target_hourly_rate) : null,
    yearsExperience:     member?.years_experience ?? null,
    skillsMatched:       matched,
    skillsMissing:       missing,
    profileCompleteness: member ? 60 + (portfolio.length > 0 ? 20 : 0) + (memberSkillNames.length > 3 ? 20 : 0) : 0,
    portfolioCount:      portfolio.length,
  }

  if (!plat) notFound()

  const workflow = buildWorkflow(
    { id: job.id, title: job.title, extractedSkills: job.extracted_skills },
    { id: plat.id, name: plat.name, slug: plat.slug, applicationGuide: plat.application_guide, platformTips: plat.platform_tips },
    ctx,
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Application workflow · {plat.name}
        </p>
      </div>

      <ApplyClient
        workflow={workflow}
        jobId={jobId}
        platformId={plat.id}
        platformName={plat.name}
        userId={user.id}
        existingAppId={existingApp?.id ?? null}
        initialChecklist={existingApp?.checklist_state as Record<string, boolean[]> | null}
      />
    </div>
  )
}
