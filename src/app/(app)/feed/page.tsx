import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Map, SlidersHorizontal } from 'lucide-react'
import FeedContent from './FeedContent'
import { PageContainer, RailCard } from '@/components/app-shell/PageContainer'
import { ProfileCompletenessCard } from '@/components/app-shell/ProfileCompletenessCard'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, skills, onboarded, about, portfolio, hourly_rate, years_experience, work_preference')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const aside = (
    <>
      <ProfileCompletenessCard profile={profile} />
      <RailCard title="Get more matches" icon={SlidersHorizontal}>
        <p className="mb-3 text-sm text-muted-foreground">
          A sharper profile means better-ranked gigs in your feed.
        </p>
        <div className="space-y-1.5 text-sm">
          <Link href="/settings" className="flex items-center gap-2 text-primary hover:underline">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Refine your skills &amp; rate
          </Link>
          <Link href="/roadmap" className="flex items-center gap-2 text-primary hover:underline">
            <Map className="h-3.5 w-3.5" /> See which skills pay more
          </Link>
        </div>
      </RailCard>
    </>
  )

  return (
    <div className="bg-background">
      <PageContainer aside={aside}>
        <Suspense fallback={
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
          </div>
        }>
          <FeedContent userSkills={profile.skills ?? []} />
        </Suspense>
      </PageContainer>
    </div>
  )
}
