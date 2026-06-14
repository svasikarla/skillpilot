import {
  Briefcase, LayoutDashboard, Building2, Map, Users, Sparkles, Settings,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Short helper shown in tooltips / mobile drawer */
  hint?: string
}

/** Primary navigation — the persistent left rail. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/feed',      label: 'Feed',      icon: LayoutDashboard, hint: 'Matched gigs for your skills' },
  { href: '/tracker',   label: 'Tracker',   icon: Briefcase,       hint: 'Your application pipeline' },
  { href: '/platforms', label: 'Platforms', icon: Building2,       hint: 'Compare freelance platforms' },
  { href: '/roadmap',   label: 'Roadmap',   icon: Map,             hint: 'Skill & rate growth plan' },
  { href: '/audit',     label: 'Audit',     icon: Sparkles,        hint: 'Profile & presence audit' },
  { href: '/community', label: 'Community', icon: Users,           hint: 'Anonymised group intelligence' },
]

/** Secondary items pinned to the bottom of the rail. */
export const NAV_FOOTER_ITEMS: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, hint: 'Profile & preferences' },
]

/**
 * Routes that opt out of the app chrome (focus mode) — wizard / form flows
 * where the rails would distract from a single primary task.
 */
export function isFocusRoute(pathname: string): boolean {
  if (pathname.startsWith('/onboarding')) return true
  if (/^\/jobs\/[^/]+\/apply\/?$/.test(pathname)) return true
  return false
}

export function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}
