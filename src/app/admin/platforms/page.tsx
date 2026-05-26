import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

const TIER_LABELS: Record<number, string> = { 1: 'Elite', 2: 'Strong', 3: 'Emerging', 4: 'Risky' }
const TIER_COLORS: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
  4: 'bg-red-50 text-red-700 border-red-200',
}

export default async function AdminPlatformsPage() {
  const supabase = await createClient()
  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, slug, name, tier, trust_score, rate_min_aiml, rate_max_aiml')
    .order('tier')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Guides</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit setup guides, application tips, rate ranges, and red flags for each platform.
        </p>
      </div>

      <div className="border rounded-lg divide-y">
        {(platforms ?? []).map(p => (
          <a
            key={p.id}
            href={`/admin/platforms/${p.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{p.slug}</span>
              </div>
              {(p.rate_min_aiml || p.rate_max_aiml) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI/ML rates: ${p.rate_min_aiml ?? '?'}–${p.rate_max_aiml ?? '?'}/hr
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={`text-xs ${TIER_COLORS[p.tier] ?? ''}`}>
                T{p.tier} {TIER_LABELS[p.tier]}
              </Badge>
              <span className="text-xs text-muted-foreground">Trust {p.trust_score}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
