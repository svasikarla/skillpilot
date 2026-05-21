import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedContent from './FeedContent'
import AppNav from '@/components/AppNav'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, skills, onboarded')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={profile.name} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
          </div>
        }>
          <FeedContent userSkills={profile.skills ?? []} />
        </Suspense>
      </main>
    </div>
  )
}
