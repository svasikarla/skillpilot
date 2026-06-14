import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'
import { PageContainer } from '@/components/app-shell/PageContainer'
import { ProfileCompletenessCard } from '@/components/app-shell/ProfileCompletenessCard'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, skills, skill_ratings, hourly_rate, years_experience, work_preference, timezone, hours_per_week, min_budget, about, portfolio, learning_skills, learned_skills')
    .eq('user_id', user.id)
    .single()

  const aside = profile ? <ProfileCompletenessCard profile={profile} /> : undefined

  return (
    <div className="bg-background">
      <PageContainer aside={aside} maxWidth="max-w-5xl">
        <div className="mb-8">
          <h1 className="page-header">Settings</h1>
          <p className="page-subheader">Update your profile, skills, and work preferences.</p>
        </div>
        <SettingsClient profile={profile} />
      </PageContainer>
    </div>
  )
}
