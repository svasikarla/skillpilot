import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminMembersClient from './AdminMembersClient'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: self } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (self?.role !== 'admin') redirect('/feed')

  const { data: members } = await supabase
    .from('profiles')
    .select('user_id, name, skills, hourly_rate, role, is_active, created_at')
    .order('created_at', { ascending: false })

  return <AdminMembersClient members={members ?? []} />
}
