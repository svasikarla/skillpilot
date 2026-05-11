import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PlatformAccountToggle from '@/components/platforms/PlatformAccountToggle'
// Supabase returns snake_case column names — define locally to avoid Drizzle camelCase mismatch
type PlatformRow = {
  id: number; name: string; slug: string; url: string
  platform_type: string | null; trust_tier: number | null; trust_score: number | null
  rate_min_aiml: string | null; rate_max_aiml: string | null
  payment_model: string | null; has_escrow: boolean | null
  has_id_verification: boolean | null; typical_time_to_pay: string | null
  is_active: boolean | null
}

const TIER_LABELS: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3', 4: 'Tier 4' }
const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
}
const TYPE_LABELS: Record<string, string> = {
  marketplace: 'Marketplace', talent_network: 'Talent Network',
  rlhf_eval: 'RLHF/Eval', competition: 'Competition', bounty: 'Bug Bounty',
}

export default async function PlatformsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: platforms }, { data: myAccounts }] = await Promise.all([
    supabase.from('platforms').select('*').eq('is_active', true).order('trust_tier'),
    user ? supabase.from('member_platform_accounts')
      .select('platform_id, has_account, interest_level')
      .eq('member_id', user.id) : { data: [] },
  ])

  const myAccountMap = new Map(
    (myAccounts ?? []).map(a => [a.platform_id, a])
  )

  const byTier = (platforms ?? []).reduce((acc, p) => {
    const tier = p.trust_tier ?? 4
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(p)
    return acc
  }, {} as Record<number, PlatformRow[]>)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Platform Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Every AI/ML freelance platform assessed for trustworthiness, rate ranges, and application norms.
        </p>
      </div>

      {[1, 2, 3, 4].map(tier => {
        const tieredPlatforms = byTier[tier] ?? []
        if (!tieredPlatforms.length) return null

        return (
          <section key={tier}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${TIER_COLORS[tier]}`}>
                {TIER_LABELS[tier]}
              </span>
              <span className="text-sm text-muted-foreground">
                {tier === 1 && 'Verified escrow, identity verification, established history'}
                {tier === 2 && 'Partial verification, milestone payments, established'}
                {tier === 3 && 'Task-based, traceable corporate entity, payment history'}
                {tier === 4 && 'Competitions, bounties, prize-based work'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tieredPlatforms as PlatformRow[]).map((platform: PlatformRow) => {
                const account = myAccountMap.get(platform.id)
                return (
                  <Card key={platform.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">
                            <Link href={`/platforms/${platform.slug}`} className="hover:underline">
                              {platform.name}
                            </Link>
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {TYPE_LABELS[platform.platform_type ?? ''] ?? platform.platform_type}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TIER_COLORS[tier]}`}>
                          T{tier}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {platform.rate_min_aiml && platform.rate_max_aiml ? (
                        <p className="text-sm font-medium">
                          ${platform.rate_min_aiml}–${platform.rate_max_aiml}/hr
                          <span className="text-muted-foreground font-normal"> AI/ML</span>
                        </p>
                      ) : platform.payment_model === 'prize' ? (
                        <p className="text-sm text-muted-foreground">Prize-based</p>
                      ) : null}

                      <div className="flex flex-wrap gap-1.5">
                        {platform.has_escrow && (
                          <Badge variant="secondary" className="text-xs">Escrow</Badge>
                        )}
                        {platform.has_id_verification && (
                          <Badge variant="secondary" className="text-xs">ID Verified</Badge>
                        )}
                        {platform.payment_model && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {platform.payment_model}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {user && (
                          <PlatformAccountToggle
                            platformId={platform.id}
                            memberId={user.id}
                            hasAccount={account?.has_account ?? false}
                          />
                        )}
                        <Link
                          href={`/platforms/${platform.slug}`}
                          className="text-xs text-primary hover:underline ml-auto"
                        >
                          Full guide →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
