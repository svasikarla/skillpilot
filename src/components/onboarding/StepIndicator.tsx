'use client'

import { cn } from '@/lib/utils'

const STEPS = ['About you', 'Skills', 'Work prefs', 'Portfolio']

export default function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current
        const active  = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                done   ? 'bg-primary border-primary text-primary-foreground' :
                active ? 'border-primary text-primary bg-primary/10' :
                         'border-border text-muted-foreground bg-background'
              )}>
                {done ? '✓' : i + 1}
              </div>
              <span className={cn('text-xs whitespace-nowrap hidden sm:block',
                active ? 'text-primary font-medium' : 'text-muted-foreground'
              )}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 transition-colors', done ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
