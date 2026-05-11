'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface PlatformAccount {
  platformName: string
  hasAccount:   boolean
}

const PLATFORMS_LIST = [
  { name: 'Upwork',           tier: 1, type: 'Marketplace' },
  { name: 'Toptal',           tier: 1, type: 'Talent Network' },
  { name: 'Arc.dev',          tier: 1, type: 'Curated Remote' },
  { name: 'Contra',           tier: 1, type: 'Commission-free' },
  { name: 'Braintrust',       tier: 1, type: 'Talent-owned' },
  { name: 'Gun.io',           tier: 1, type: 'Talent Network' },
  { name: 'Freelancer.com',   tier: 2, type: 'Marketplace' },
  { name: 'Fiverr Pro',       tier: 2, type: 'Gig Marketplace' },
  { name: 'PeoplePerHour',    tier: 2, type: 'Marketplace' },
  { name: 'Turing',           tier: 2, type: 'AI-matched' },
  { name: 'Lemon.io',         tier: 2, type: 'Curated' },
  { name: 'Outlier (Scale AI)', tier: 3, type: 'RLHF/Eval' },
  { name: 'Mercor',           tier: 3, type: 'AI-matched' },
  { name: 'DataAnnotation.tech', tier: 3, type: 'Task-based' },
  { name: 'Kaggle',           tier: 4, type: 'Competitions' },
  { name: 'HackerOne',        tier: 4, type: 'Bug Bounty' },
]

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
}

interface Props {
  defaultValues?: PlatformAccount[]
  onSubmit: (accounts: PlatformAccount[]) => void
  onBack: () => void
  loading?: boolean
}

export default function PlatformAccounts({ defaultValues = [], onSubmit, onBack, loading }: Props) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(defaultValues.filter(p => p.hasAccount).map(p => p.platformName))
  )

  function toggle(name: string) {
    const next = new Set(checked)
    next.has(name) ? next.delete(name) : next.add(name)
    setChecked(next)
  }

  function handleSubmit() {
    onSubmit(PLATFORMS_LIST.map(p => ({ platformName: p.name, hasAccount: checked.has(p.name) })))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Check every platform you already have an active account on. This helps us prioritise which job sources to show you first.
      </p>

      <div className="space-y-2">
        {PLATFORMS_LIST.map(platform => (
          <div
            key={platform.name}
            onClick={() => toggle(platform.name)}
            className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
          >
            <Checkbox checked={checked.has(platform.name)} onCheckedChange={() => toggle(platform.name)} />
            <span className="flex-1 text-sm font-medium">{platform.name}</span>
            <span className="text-xs text-muted-foreground">{platform.type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[platform.tier]}`}>
              T{platform.tier}
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Don't have accounts yet? No problem — you can add them later from Settings. The platform guides will walk you through creating standout profiles.
      </p>

      <div className="flex justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBack} disabled={loading}>Back</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving profile…' : 'Complete setup'}
        </Button>
      </div>
    </div>
  )
}
