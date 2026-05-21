import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrackerClient from './TrackerClient'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data, error }] = await Promise.all([
    supabase.from('profiles').select('name').eq('user_id', user.id).single(),
    supabase
      .from('applications')
      .select(`id, status, applied_at, rate_proposed, rate_agreed, notes, created_at, updated_at,
               jobs (id, title, company, platform, url, rate_min, rate_max)`)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
  ])

  if (error && error.code !== 'PGRST116') {
    return (
      <div className="p-8 text-destructive text-sm">
        Error: {error.message} — make sure you ran setup-v3.sql in Supabase.
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TrackerClient applications={(data ?? []) as any} userName={profile?.name} />
}
