'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, PanelLeft, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppSidebar, SidebarNav } from './AppSidebar'
import { NAV_ITEMS, NAV_FOOTER_ITEMS, isActiveRoute, isFocusRoute } from './nav-items'

export const SIDEBAR_COLLAPSED_COOKIE = 'app-sidebar-collapsed'

function currentTitle(pathname: string): string {
  const match = [...NAV_ITEMS, ...NAV_FOOTER_ITEMS].find((i) => isActiveRoute(pathname, i.href))
  return match?.label ?? 'Freelance Hub'
}

export default function AppShell({
  children, userName, defaultCollapsed = false,
}: { children: React.ReactNode; userName?: string; defaultCollapsed?: boolean }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persist the preference in a cookie so the server renders the right width
  // on the next load — no flash, no hydration mismatch.
  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev
      document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
      return next
    })
  }

  // Focus routes (onboarding, apply) render without chrome.
  if (isFocusRoute(pathname)) return <>{children}</>

  const initial = userName?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-md">
          {/* Mobile: drawer trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Desktop: collapse toggle */}
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger
                onClick={toggleCollapse}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
              >
                <PanelLeft className="h-[18px] w-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <h1 className="truncate text-sm font-semibold tracking-tight">{currentTitle(pathname)}</h1>

          <div className="flex-1" />

          {/* User menu */}
          {userName && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initial}
                </span>
                <span className="hidden font-medium sm:block">{userName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="truncate">{userName}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href="/settings">Settings</a>} />
                <DropdownMenuSeparator />
                <form action="/api/auth/signout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive',
                      'transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none',
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* Content */}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
