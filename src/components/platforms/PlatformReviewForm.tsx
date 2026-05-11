'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  platformId: number
  memberId:   string
}

export default function PlatformReviewForm({ platformId, memberId }: Props) {
  const [review, setReview] = useState('')
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!review.trim() || rating === 0) {
      toast.error('Add a rating and a review')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('platform_reviews').insert({
      platform_id: platformId,
      member_id:   memberId,
      review_text: review.trim(),
      rating,
    })
    if (error) {
      toast.error('Failed to submit review')
    } else {
      toast.success('Review submitted')
      setSubmitted(true)
    }
    setLoading(false)
  }

  if (submitted) {
    return <p className="text-sm text-muted-foreground">Thanks for sharing your experience.</p>
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Share your experience with this platform</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`text-2xl ${r <= rating ? 'text-yellow-400' : 'text-muted-foreground'}`}
              >
                ★
              </button>
            ))}
          </div>
          <Textarea
            placeholder="2–3 sentences on your experience — quality of clients, payment reliability, any tips for AI/ML engineers on this platform."
            rows={3}
            value={review}
            onChange={e => setReview(e.target.value)}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{review.length}/500</span>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
