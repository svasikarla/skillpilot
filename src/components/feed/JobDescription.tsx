import { parseJobDescription, maybeBullets, type SectionKey } from '@/lib/parse-job-description'
import { Building2, Briefcase, ListChecks, GraduationCap, Sparkles, Gift, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS: Record<SectionKey, React.ComponentType<{ className?: string }>> = {
  about: Building2,
  role: Briefcase,
  responsibilities: ListChecks,
  requirements: GraduationCap,
  niceToHave: Sparkles,
  benefits: Gift,
  other: FileText,
}

export default function JobDescription({
  description,
  title,
  compact = false,
  maxBodyChars,
  className,
}: {
  description: string
  title?: string
  compact?: boolean
  maxBodyChars?: number
  className?: string
}) {
  const sections = parseJobDescription(description, title)
  if (sections.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      {sections.map(section => {
        const Icon = ICONS[section.key]
        const bullets = maybeBullets(section)
        const body =
          maxBodyChars && section.body.length > maxBodyChars
            ? section.body.slice(0, maxBodyChars).trimEnd() + '…'
            : section.body

        return (
          <div key={section.key}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className={cn(
                'font-semibold uppercase tracking-wider text-muted-foreground',
                compact ? 'text-[10px]' : 'text-xs',
              )}>
                {section.label}
              </span>
            </div>
            {bullets ? (
              <ul className={cn(
                'space-y-1 text-muted-foreground leading-relaxed pl-4 list-disc marker:text-muted-foreground/50',
                compact ? 'text-xs' : 'text-sm',
              )}>
                {bullets.slice(0, compact ? 5 : 10).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className={cn(
                'text-muted-foreground leading-relaxed',
                compact ? 'text-xs' : 'text-sm',
              )}>
                {body}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
