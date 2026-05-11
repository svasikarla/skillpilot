import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const saveSchema = z.object({
  displayName:      z.string().min(2),
  timezone:         z.string(),
  yearsExperience:  z.number().int().min(0),
  workPreference:   z.enum(['short_project', 'long_contract', 'retainer', 'any']),
  privacyAgreed:    z.boolean(),
  skills: z.array(z.object({
    name:       z.string(),
    cluster:    z.string(),
    selfRating: z.number().int().min(1).max(5),
  })),
  ratePrefs: z.object({
    targetHourlyRate: z.number().min(1),
    minProjectBudget: z.number().optional(),
    hoursPerWeek:     z.number().int(),
    about:            z.string(),
    githubUrl:        z.string().optional(),
  }),
  portfolio: z.array(z.object({
    name:        z.string(),
    description: z.string(),
    stack:       z.array(z.string()),
    outcome:     z.string(),
  })),
  platformAccounts: z.array(z.object({
    platformName: z.string(),
    hasAccount:   z.boolean(),
  })),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { displayName, timezone, yearsExperience, workPreference, privacyAgreed,
          skills, ratePrefs, portfolio, platformAccounts } = parsed.data

  // Upsert member row
  const { error: memberErr } = await supabase.from('members').upsert({
    id:                 user.id,
    email:              user.email!,
    display_name:       displayName,
    timezone,
    years_experience:   yearsExperience,
    work_preference:    workPreference,
    privacy_agreed_at:  privacyAgreed ? new Date().toISOString() : null,
    target_hourly_rate: ratePrefs.targetHourlyRate,
    min_project_budget: ratePrefs.minProjectBudget ?? null,
    hours_per_week:     ratePrefs.hoursPerWeek,
    about:              ratePrefs.about,
    github_url:         ratePrefs.githubUrl ?? null,
    portfolio:          portfolio,
    last_active_at:     new Date().toISOString(),
  }, { onConflict: 'id' })

  if (memberErr) {
    console.error('member upsert:', memberErr)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }

  // Upsert skills — look up skill IDs by name then insert member_skills
  if (skills.length > 0) {
    const { data: skillRows } = await supabase
      .from('skills')
      .select('id, name')
      .in('name', skills.map(s => s.name))

    if (skillRows && skillRows.length > 0) {
      const nameToId = new Map(skillRows.map(r => [r.name, r.id]))

      // Remove existing and re-insert
      await supabase.from('member_skills').delete().eq('member_id', user.id)

      const skillInserts = skills
        .filter(s => nameToId.has(s.name))
        .map(s => ({
          member_id:   user.id,
          skill_id:    nameToId.get(s.name)!,
          self_rating: s.selfRating,
          status:      'active',
        }))

      if (skillInserts.length > 0) {
        const { error: skillErr } = await supabase.from('member_skills').insert(skillInserts)
        if (skillErr) console.error('skill insert:', skillErr)
      }
    }
  }

  // Upsert platform accounts for platforms marked as "have account"
  if (platformAccounts.length > 0) {
    const accountNames = platformAccounts.filter(p => p.hasAccount).map(p => p.platformName)
    if (accountNames.length > 0) {
      const { data: platformRows } = await supabase
        .from('platforms')
        .select('id, name')
        .in('name', accountNames)

      if (platformRows && platformRows.length > 0) {
        const accountInserts = platformRows.map(p => ({
          member_id:     user.id,
          platform_id:   p.id,
          has_account:   true,
          interest_level: 'have_account',
        }))

        await supabase
          .from('member_platform_accounts')
          .upsert(accountInserts, { onConflict: 'member_id,platform_id' })
      }
    }
  }

  // Trigger async profile embedding (fire-and-forget)
  fetch(`${request.nextUrl.origin}/api/profile/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberId: user.id }),
  }).catch(() => { /* non-critical */ })

  return NextResponse.json({ ok: true })
}
