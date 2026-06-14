import Link from 'next/link'
import { CheckCircle2, Circle, UserCheck } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { RailCard } from './PageContainer'
import { cn } from '@/lib/utils'

export type ProfileForCompleteness = {
  name?: string | null
  about?: string | null
  portfolio?: unknown
  hourly_rate?: number | null
  skills?: string[] | null
  years_experience?: number | null
  work_preference?: string | null
}

type Check = { label: string; done: boolean }

function buildChecks(p: ProfileForCompleteness): Check[] {
  const portfolioCount = Array.isArray(p.portfolio) ? p.portfolio.length : 0
  return [
    { label: 'Add your name', done: Boolean(p.name?.trim()) },
    { label: 'Write a short bio', done: Boolean(p.about?.trim()) },
    { label: 'List your skills', done: (p.skills?.length ?? 0) >= 3 },
    { label: 'Set your hourly rate', done: (p.hourly_rate ?? 0) > 0 },
    { label: 'Add years of experience', done: (p.years_experience ?? 0) > 0 },
    { label: 'Set a work preference', done: Boolean(p.work_preference?.trim()) },
    { label: 'Add a portfolio item', done: portfolioCount > 0 },
  ]
}

export function ProfileCompletenessCard({ profile }: { profile: ProfileForCompleteness }) {
  const checks = buildChecks(profile)
  const done = checks.filter((c) => c.done).length
  const pct = Math.round((done / checks.length) * 100)
  const remaining = checks.filter((c) => !c.done)

  return (
    <RailCard title="Profile strength" icon={UserCheck}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight">{pct}%</span>
        <span className="text-xs text-muted-foreground">{done}/{checks.length} complete</span>
      </div>
      <Progress value={pct} aria-label="Profile completeness" className="mb-3" />

      {remaining.length > 0 ? (
        <>
          <ul className="space-y-1.5">
            {remaining.slice(0, 3).map((c) => (
              <li key={c.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                {c.label}
              </li>
            ))}
          </ul>
          <Link
            href="/settings"
            className={cn(
              'mt-3 inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2',
              'text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90',
            )}
          >
            Complete your profile
          </Link>
        </>
      ) : (
        <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Your profile is complete.
        </p>
      )}
    </RailCard>
  )
}
