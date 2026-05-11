import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PlatformMarkdown from '@/components/platforms/PlatformMarkdown'
import PlatformReviewForm from '@/components/platforms/PlatformReviewForm'

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800 border-green-200',
  2: 'bg-blue-100 text-blue-800 border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-orange-100 text-orange-800 border-orange-200',
}

export default async function PlatformDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: platform } = await supabase
    .from('platforms').select('*').eq('slug', slug).single()

  if (!platform) notFound()

  const { data: platformReviews } = await supabase
    .from('platform_reviews')
    .select('id, review_text, rating, created_at, members(display_name)')
    .eq('platform_id', platform.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const tier = platform.trust_tier ?? 4

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/platforms" className="text-sm text-muted-foreground hover:underline">
              ← Platforms
            </Link>
          </div>
          <h1 className="text-2xl font-semibold">{platform.name}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${TIER_COLORS[tier]}`}>
              Tier {tier}
            </span>
            {platform.has_escrow && <Badge variant="secondary">Escrow</Badge>}
            {platform.has_id_verification && <Badge variant="secondary">ID Verified</Badge>}
            {platform.rate_min_aiml && (
              <span className="text-sm text-muted-foreground">
                ${platform.rate_min_aiml}–${platform.rate_max_aiml}/hr for AI/ML
              </span>
            )}
            {platform.typical_time_to_pay && (
              <span className="text-xs text-muted-foreground">
                Pays in: {platform.typical_time_to_pay}
              </span>
            )}
          </div>
        </div>
        <a
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex-shrink-0"
        >
          Visit platform ↗
        </a>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="setup">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="apply">How to Apply</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="reviews">Group Reviews ({platformReviews?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {platform.setup_guide ? (
                <PlatformMarkdown content={platform.setup_guide} />
              ) : (
                <p className="text-muted-foreground text-sm">Setup guide coming soon.</p>
              )}
            </CardContent>
          </Card>
          {platform.red_flags && (
            <Card className="mt-4 border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-800">Red Flags on {platform.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformMarkdown content={platform.red_flags} className="text-orange-900" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apply" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {platform.application_guide ? (
                <PlatformMarkdown content={platform.application_guide} />
              ) : (
                <p className="text-muted-foreground text-sm">Application guide coming soon.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {platform.platform_tips ? (
                <PlatformMarkdown content={platform.platform_tips} />
              ) : (
                <p className="text-muted-foreground text-sm">Tips coming soon.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-4">
          {user && (
            <PlatformReviewForm platformId={platform.id} memberId={user.id} />
          )}
          {(platformReviews ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No group reviews yet. Be the first.</p>
          ) : (
            (platformReviews ?? []).map(review => (
              <Card key={review.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {(review.members as { display_name?: string } | null)?.display_name ?? 'Member'}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (review.rating ?? 0) ? 'text-yellow-400' : 'text-muted'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.review_text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
