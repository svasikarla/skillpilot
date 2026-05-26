'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Briefcase, LayoutDashboard, Building2, Map, Users, LogOut, Sparkles, Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/feed',      label: 'Feed',       icon: LayoutDashboard },
  { href: '/tracker',   label: 'Tracker',    icon: Briefcase },
  { href: '/platforms', label: 'Platforms',  icon: Building2 },
  { href: '/roadmap',   label: 'Roadmap',    icon: Map },
  { href: '/audit',     label: 'Audit',      icon: Sparkles },
  { href: '/community', label: 'Community',  icon: Users },
  { href: '/settings',  label: 'Settings',   icon: Settings },
]

export default function AppNav({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">AI</span>
          </div>
          <span className="font-semibold text-sm hidden sm:block tracking-tight">
            Freelance Hub
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:block">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User */}
        {userName && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary text-xs font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden lg:block text-foreground font-medium">{userName}</span>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:block">Sign out</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
