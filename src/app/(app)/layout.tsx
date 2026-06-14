import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AppShell, { SIDEBAR_COLLAPSED_COOKIE } from '@/components/app-shell/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, cookieStore] = await Promise.all([
    supabase.from('profiles').select('name').eq('user_id', user.id).single(),
    cookies(),
  ])

  const defaultCollapsed = cookieStore.get(SIDEBAR_COLLAPSED_COOKIE)?.value === '1'

  return (
    <AppShell userName={profile?.name ?? undefined} defaultCollapsed={defaultCollapsed}>
      {children}
    </AppShell>
  )
}
