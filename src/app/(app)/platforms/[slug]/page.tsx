'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ExternalLink, Star, Shield, CheckCircle, AlertTriangle, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

type Platform = {
  id: string; slug: string; name: string; tier: number; trust_score: number
  description: string | null; guide_md: string | null; tips: string[] | null
  red_flags: string[] | null; website: string | null
}
type Review = { id: string; rating: number; review_text: string; created_at: string }

function Stars({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'} ${onRate ? 'cursor-pointer' : ''}`}
          onClick={() => onRate?.(i)} />
      ))}
    </div>
  )
}

function daysAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  return d === 0 ? 'Today' : d === 1 ? '1 day ago' : `${d} days ago`
}

export default function PlatformDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [platform, setPlatform] = useState<Platform | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [rating, setRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/platforms/${slug}`)
      .then(r => r.json())
      .then(d => { setPlatform(d.platform); setReviews(d.reviews ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  async function submitReview() {
    if (rating === 0) { toast.error('Select a rating'); return }
    if (reviewText.length < 20) { toast.error('Write at least 20 characters'); return }
    setSubmitting(true)
    const res = await fetch('/api/platform-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform_id: platform?.id, rating, review_text: reviewText }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); setSubmitting(false); return }
    setReviews(prev => [data.review, ...prev.filter(r => r.id !== data.review.id)])
    setShowForm(false); setReviewText(''); setRating(0)
    toast.success('Review submitted! Thanks for helping the group.')
    setSubmitting(false)
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>
  if (!platform) return <div className="p-8 text-destructive text-sm">Platform not found.</div>

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-4">
        <a href="/platforms" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />Platforms
        </a>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-sm">{platform.name}</span>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{platform.name}</h1>
            {platform.description && <p className="text-muted-foreground mt-1">{platform.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" />Trust {platform.trust_score}/100</span>
              <span>Tier {platform.tier}</span>
            </div>
          </div>
          {platform.website && (
            <a href={platform.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                Visit <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>

        {/* Tips */}
        {platform.tips && platform.tips.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-600" />Tips for AI/ML freelancers</h2>
            <ul className="space-y-2">
              {platform.tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-emerald-600 shrink-0">✓</span>{tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red flags */}
        {platform.red_flags && platform.red_flags.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-600" />Red flags to watch for</h2>
            <ul className="space-y-2">
              {platform.red_flags.map((flag, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-yellow-600 shrink-0">⚠</span>{flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Member Reviews ({reviews.length})</h2>
            <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
              {showForm ? 'Cancel' : 'Write a review'}
            </Button>
          </div>

          {showForm && (
            <div className="border rounded-lg p-4 space-y-3 mb-4 bg-muted/20">
              <div className="space-y-1">
                <label className="text-xs font-medium">Your rating</label>
                <Stars rating={rating} onRate={setRating} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Your review</label>
                <Textarea
                  placeholder="Share your honest experience with this platform for AI/ML work…"
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  maxLength={300}
                  className="text-sm min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground text-right">{reviewText.length}/300 chars</p>
              </div>
              <Button size="sm" onClick={submitReview} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit review'}
              </Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg">No reviews yet. Be the first!</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-muted-foreground">{daysAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm">{r.review_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
