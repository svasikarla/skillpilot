import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

/**
 * Centered page wrapper with an optional right rail. When `aside` is provided,
 * the main content and rail sit side-by-side on xl+ screens (rail sticks while
 * the main column scrolls) and stack vertically below xl.
 */
export function PageContainer({
  children, aside, className, maxWidth = 'max-w-6xl',
}: {
  children: React.ReactNode
  aside?: React.ReactNode
  className?: string
  /** Tailwind max-width class for the whole row. */
  maxWidth?: string
}) {
  if (!aside) {
    return (
      <main className={cn('mx-auto w-full px-4 py-8', maxWidth, className)}>{children}</main>
    )
  }

  return (
    <div className={cn('mx-auto w-full px-4 py-8', maxWidth)}>
      <div className="flex flex-col gap-8 xl:flex-row">
        <main className={cn('min-w-0 flex-1', className)}>{children}</main>
        <aside className="w-full shrink-0 xl:w-[300px]">
          <div className="space-y-4 xl:sticky xl:top-20">{aside}</div>
        </aside>
      </div>
    </div>
  )
}

/** A titled section card for the right rail. */
export function RailCard({
  title, icon: Icon, children, className,
}: {
  title?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('card-base rounded-xl p-4', className)}>
      {title && (
        <header className="mb-3 flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
        </header>
      )}
      {children}
    </section>
  )
}
