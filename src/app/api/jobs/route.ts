import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMatch } from '@/lib/matching'
import { prepareUserSkills } from '@/lib/skills-canonical'
import { parseSearchTerms, termToOrClause } from '@/lib/job-search'
import { cosineSimilarity } from '@/lib/embeddings'
import { feedRecencySinceISO, DEFAULT_FEED_RECENCY_DAYS } from '@/lib/job-freshness'

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
  // employment_type=contract | full_time | all  (default: contract)
  const typeParam   = searchParams.get('employment_type')?.trim() ?? 'contract'
  // In the contract view, 'unknown'-type listings are opt-in: they are mostly
  // full-time roles the classifier couldn't label, and showing them by default
  // filled the freelance feed with non-gig noise.
  const includeUnknown = searchParams.get('include_unknown') === '1'

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
      // Canonicalize + add umbrella skills so specific user skills (Pinecone)
      // also match generic job tags (RAG Pipelines).
      userSkills    = prepareUserSkills(profile.skills ?? [])
      skillRatings  = (profile.skill_ratings as Record<string, number>) ?? {}
      hourlyRate    = profile.hourly_rate ?? null
      profileVector = profile.embedding ? JSON.parse(profile.embedding as string) : null
    }
  }

  let query = supabase
    .from('jobs')
    .select('id, title, company, description, platform, url, skills, location, rate_min, rate_max, rate_type, duration, posted_at, reliability_score, reliability_flags, employment_type, embedding')
    .order('posted_at', { ascending: false })
    .limit(150)

  // Filters shared by the main query and the hidden-unclassified count query.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyCommonFilters = <T extends { or: any; contains: any; eq: any; gte: any; lte: any }>(qb: T): T => {
    let b = qb
    // Multi-term search: every term must match, where a term matches the text
    // columns or (via the canonical vocabulary) the skills array.
    for (const term of parseSearchTerms(q)) b = b.or(termToOrClause(term))
    if (skill)    b = b.contains('skills', [skill])
    if (platform) b = b.eq('platform', platform)
    if (verified) b = b.gte('reliability_score', 70)
    // Hourly-rate filters only make sense against hourly listings; a $500 fixed
    // budget is not "$500/hr", so fixed-budget projects are excluded when set.
    if (rateMin || rateMax) b = b.eq('rate_type', 'hourly')
    if (rateMin)  b = b.gte('rate_min', rateMin)
    if (rateMax)  b = b.lte('rate_max', rateMax)
    // Apply a recency cutoff. Defaults to DEFAULT_FEED_RECENCY_DAYS so stale
    // listings are hidden even when the caller doesn't pass `days`; admins viewing
    // hidden listings get no default cutoff (they can still pass `days` explicitly).
    const since = feedRecencySinceISO(days, new Date(), showHidden ? 0 : DEFAULT_FEED_RECENCY_DAYS)
    if (since) b = b.gte('posted_at', since)
    return b
  }

  // Employment-type filter — default to confirmed contract listings only.
  if (typeParam === 'contract') {
    query = includeUnknown
      ? query.in('employment_type', ['contract', 'unknown'])
      : query.eq('employment_type', 'contract')
  } else if (typeParam === 'full_time') {
    query = query.eq('employment_type', 'full_time')
  } // 'all' → no filter

  // Status filter — show hidden listings when requested
  if (showHidden) {
    query = query.in('status', ['approved', 'pending'])
  } else {
    query = query.eq('status', 'approved')
  }

  query = applyCommonFilters(query)

  // When the contract view hides unclassified listings, count what's hidden so
  // the UI can offer a one-click reveal instead of looking simply empty.
  const unclassifiedCountPromise: PromiseLike<number> =
    typeParam === 'contract' && !includeUnknown
      ? applyCommonFilters(
          supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('employment_type', 'unknown')
            .eq('status', 'approved')
        ).then(({ count }: { count: number | null }) => count ?? 0)
      : Promise.resolve(0)

  const [{ data, error }, unclassifiedCount] = await Promise.all([query, unclassifiedCountPromise])
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
      jobRateType: job.rate_type ?? 'hourly',
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

  // In the contract view, confirmed contract/freelance listings outrank
  // 'unknown' ones (which are included as a fallback but are often full-time
  // roles the classifier couldn't label). Match score breaks ties.
  if (typeParam === 'contract') {
    filtered.sort((a, b) => {
      const aConfirmed = a.employment_type === 'contract' ? 1 : 0
      const bConfirmed = b.employment_type === 'contract' ? 1 : 0
      if (aConfirmed !== bConfirmed) return bConfirmed - aConfirmed
      return b.match_score - a.match_score
    })
  } else {
    filtered.sort((a, b) => b.match_score - a.match_score)
  }

  return NextResponse.json({ jobs: filtered.slice(0, 50), unclassified_count: unclassifiedCount })
}
