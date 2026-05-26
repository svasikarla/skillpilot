import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlatformEditClient from './PlatformEditClient'

export default async function AdminPlatformEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: platform, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !platform) notFound()

  return (
    <div>
      <div className="mb-6">
        <a href="/admin/platforms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← All platforms
        </a>
      </div>
      <PlatformEditClient platform={platform} />
    </div>
  )
}
