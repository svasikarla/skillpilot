'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Users, MapPin, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/admin',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/jobs',     label: 'Job Queue',  icon: Briefcase },
  { href: '/admin/members',  label: 'Members',    icon: Users },
  { href: '/admin/platforms',label: 'Platforms',  icon: MapPin },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 border-r bg-card flex flex-col">
      <div className="px-4 py-5 border-b">
        <span className="font-semibold text-sm tracking-tight">Admin</span>
        <p className="text-xs text-muted-foreground mt-0.5">AI/ML Freelance Hub</p>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-2 py-4 border-t">
        <Link
          href="/feed"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          Back to app
        </Link>
      </div>
    </aside>
  )
}
