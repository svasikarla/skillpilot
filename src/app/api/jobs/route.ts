import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMatch } from '@/lib/matching'
import { cosineSimilarity } from '@/lib/embeddings'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q           = searchParams.get('q')?.trim() ?? ''
  const skill       = searchParams.get('skill')?.trim() ?? ''
  const platform    = searchParams.get('platform')?.trim() ?? ''
  const verified    = searchParams.get('verified') === '1'
  const rateMin     = searchParams.get('rate_min') ? Number(searchParams.get('rate_min')) : null
  const rateMax     = searchParams.get('rate_max') ? Number(searchParams.get('rate_max')) : null
  const days        = searchParams.get('days') ? Number(searchParams.get('days')) : null
  const matchMin    = searchParams.get('match_min') ? Number(searchParams.get('match_min')) : null
  const nearMiss    = searchParams.get('near_miss') === '1'
  const showHidden  = searchParams.get('show_hidden') === '1'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let userSkills: string[]                 = []
  let skillRatings: Record<string, number> = {}
  let hourlyRate: number | null            = null
  let profileVector: number[] | null       = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, skill_ratings, hourly_rate, embedding')
      .eq('user_id', user.id)
      .single()
    if (profile) {
      userSkills    = profile.skills ?? []
      skillRatings  = (profile.skill_ratings as Record<string, number>) ?? {}
      hourlyRate    = profile.hourly_rate ?? null
      profileVector = profile.embedding ? JSON.parse(profile.embedding as string) : null
    }
  }

  let query = supabase
    .from('jobs')
    .select('id, title, company, description, platform, url, skills, location, rate_min, rate_max, posted_at, reliability_score, reliability_flags, embedding')
    .order('posted_at', { ascending: false })
    .limit(150)

  // Status filter — show hidden listings when requested
  if (showHidden) {
    query = query.in('status', ['approved', 'pending'])
  } else {
    query = query.eq('status', 'approved')
  }

  if (q)        query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`)
  if (skill)    query = query.contains('skills', [skill])
  if (platform) query = query.eq('platform', platform)
  if (verified) query = query.gte('reliability_score', 70)
  if (rateMin)  query = query.gte('rate_min', rateMin)
  if (rateMax)  query = query.lte('rate_max', rateMax)
  if (days) {
    const since = new Date(Date.now() - days * 86400000).toISOString()
    query = query.gte('posted_at', since)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const jobs = (data ?? []).map(job => {
    const jobVector = job.embedding ? JSON.parse(job.embedding as string) as number[] : null
    const semanticRaw = profileVector && jobVector
      ? cosineSimilarity(profileVector, jobVector)
      : undefined
    // Cosine similarity [-1,1] → scale to [0,100]; clamp negatives to 0
    const semanticScore = semanticRaw !== undefined
      ? Math.round(Math.max(0, semanticRaw) * 100)
      : undefined

    const match = computeMatch({
      userSkills, skillRatings, hourlyRate,
      jobSkills:   job.skills ?? [],
      jobRateMin:  job.rate_min,
      jobRateMax:  job.rate_max,
      jobPostedAt: job.posted_at,
      semanticScore,
    })
    // Exclude raw embedding vector from API response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { embedding: _emb, ...jobFields } = job
    return {
      ...jobFields,
      match_score:      match.score,
      matched_skills:   match.matchedSkills,
      skill_score:      match.skillScore,
      rate_score:       match.rateScore,
      recency_score:    match.recencyScore,
      semantic_score:   match.semanticScore,
    }
  })

  // Apply client-side match filters (post-scoring)
  let filtered = jobs
  if (matchMin !== null) filtered = filtered.filter(j => j.match_score >= matchMin)
  if (nearMiss)          filtered = filtered.filter(j => j.match_score >= 45 && j.match_score < 70)

  filtered.sort((a, b) => b.match_score - a.match_score)

  return NextResponse.json({ jobs: filtered.slice(0, 50) })
}
