'use client'

import { AlertTriangle } from 'lucide-react'

const SIGNAL_LABELS: Record<string, { label: string; positive: boolean }> = {
  tier1_platform:       { label: 'Posted on Tier 1 verified platform',         positive: true  },
  tier2_platform:       { label: 'Posted on Tier 2 established platform',       positive: true  },
  rate_disclosed:       { label: 'Rate range clearly disclosed',                positive: true  },
  long_description:     { label: 'Detailed description (200+ words)',           positive: true  },
  deliverables_named:   { label: 'Specific deliverables or milestones named',   positive: true  },
  company_url:          { label: 'Company name and website present',            positive: true  },
  recent_post:          { label: 'Posted within last 14 days',                  positive: true  },
  prior_hires:          { label: 'Client has prior hire history',               positive: true  },
  government_post:      { label: 'Federal/government posting (auto-trusted)',   positive: true  },
  telegram_contact:     { label: 'Requests contact via Telegram/WhatsApp',      positive: false },
  upfront_fee:          { label: 'Upfront payment or registration fee required',positive: false },
  crypto_only:          { label: 'Crypto-only payment mentioned',               positive: false },
  unrealistic_rate:     { label: 'Unrealistic rate claim',                      positive: false },
  free_email:           { label: 'Free email sender with no company domain',    positive: false },
  short_description:    { label: 'Description under 50 words',                  positive: false },
  easy_money:           { label: '"Easy money" or "no experience" language',    positive: false },
  duplicate_post:       { label: 'Copy-paste duplicate across sources',         positive: false },
}

export default function ReliabilityExplainer({
  score,
  signals,
}: {
  score: number
  signals: Record<string, boolean>
}) {
  const negatives = Object.entries(signals)
    .filter(([k, v]) => v && SIGNAL_LABELS[k] && !SIGNAL_LABELS[k].positive)

  if (score >= 70 || negatives.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs font-semibold">Why this listing is flagged</span>
      </div>
      <ul className="space-y-1">
        {negatives.map(([key]) => (
          <li key={key} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
            <span className="shrink-0 mt-0.5">•</span>
            {SIGNAL_LABELS[key].label}
          </li>
        ))}
      </ul>
      <p className="text-xs text-amber-700/70 dark:text-amber-400/60 pt-1 border-t border-amber-200 dark:border-amber-800">
        Proceed only if you can independently verify the company's identity.
      </p>
    </div>
  )
}
