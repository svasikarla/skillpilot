import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim())

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!ADMIN_EMAILS.includes(user.email ?? '')) redirect('/feed')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md px-6 h-14 flex items-center gap-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Freelance Hub</span>
          <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5">Admin</span>
        </div>
        <nav className="flex items-center gap-1 flex-1">
          {[
            { href: '/admin/jobs',      label: 'Job Queue' },
            { href: '/admin/members',   label: 'Members' },
            { href: '/admin/reports',   label: 'Reports' },
            { href: '/admin/platforms', label: 'Platforms' },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <a href="/feed" className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0">
          ← Back to feed
        </a>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
