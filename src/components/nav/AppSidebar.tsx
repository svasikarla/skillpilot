'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Briefcase, LayoutDashboard, MapPin, BookOpen,
  BarChart2, Users, Settings, LogOut, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/feed',      label: 'Job Feed',     icon: LayoutDashboard },
  { href: '/tracker',   label: 'Tracker',      icon: Briefcase },
  { href: '/platforms', label: 'Platforms',    icon: MapPin },
  { href: '/roadmap',   label: 'Roadmap',      icon: BookOpen },
  { href: '/audit',     label: 'Profile Audit',icon: BarChart2 },
  { href: '/community', label: 'Community',    icon: Users },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-sidebar flex flex-col">
      {/* Brand header */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight tracking-tight truncate">AI/ML Hub</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Freelance Command Centre</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-70')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            pathname.startsWith('/settings')
              ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4 shrink-0 opacity-70" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-70" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
