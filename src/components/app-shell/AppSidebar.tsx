'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { NAV_ITEMS, NAV_FOOTER_ITEMS, isActiveRoute, type NavItem } from './nav-items'

function NavLink({
  item, collapsed, onNavigate,
}: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = isActiveRoute(pathname, item.href)
  const Icon = item.icon

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
      )}
    >
      {/* Active indicator bar */}
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-sidebar-primary')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )

  if (!collapsed) return link

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right" className="font-medium">
        {item.label}
        {item.hint && <span className="ml-1.5 text-muted-foreground">· {item.hint}</span>}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The sidebar body — logo, primary nav, footer nav. Reused by both the
 * desktop rail and the mobile drawer.
 */
export function SidebarNav({
  collapsed = false, onNavigate,
}: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <TooltipProvider delay={300}>
      <div className="flex h-full flex-col gap-1">
        {/* Brand */}
        <Link
          href="/feed"
          onClick={onNavigate}
          className={cn(
            'flex h-14 items-center gap-2.5 px-3 shrink-0',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary">
            <span className="text-xs font-bold text-sidebar-primary-foreground">AI</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Freelance Hub
            </span>
          )}
        </Link>

        {/* Primary nav */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </nav>

        {/* Footer nav */}
        <nav className="flex flex-col gap-0.5 border-t border-sidebar-border px-2 py-2" aria-label="Secondary">
          {NAV_FOOTER_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </nav>
      </div>
    </TooltipProvider>
  )
}

/** Desktop-only fixed left rail. Width animates between expanded / collapsed. */
export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar lg:block',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      <SidebarNav collapsed={collapsed} />
    </aside>
  )
}
