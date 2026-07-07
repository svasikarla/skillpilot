import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { fetchRemotive } from './remotive'
import { fetchRemoteOK } from './remoteok'
import { fetchHimalayas } from './himalayas'
import { fetchFindwork } from './findwork'
import { fetchHNWhoIsHiring } from './hnwih'
import { fetchWeWorkRemotely } from './weworkremotely'
import { fetchWorkingNomads } from './workingnomads'
import { fetchFreelancer } from './freelancer'
import { fetchHNFreelance } from './hnfreelance'
import { scoreReliability } from '@/lib/reliability'
import { generateEmbedding, jobEmbeddingText } from '@/lib/embeddings'
import { partitionFetchedJobs, staleCutoffISO } from '@/lib/job-freshness'
import type { RawJob } from './types'

export interface IngestResult {
  source: string
  found: number
  inserted: number
  duped: number
  error?: string
}

// Ingest is a trusted server-side cron, so it uses the service-role client. The
// anon/SSR client can INSERT jobs (permissive RLS policy) but has no UPDATE
// policy, so last_seen bumps and stale-archiving would silently no-op under RLS.
function ingestClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

async function getExistingUrls(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase.from('jobs').select('url')
  return new Set((data ?? []).map(j => j.url).filter(Boolean))
}

async function runAdapter(
  name: string,
  fetcher: () => Promise<RawJob[]>
): Promise<{ jobs: RawJob[]; error?: string }> {
  try {
    const jobs = await fetcher()
    return { jobs }
  } catch (err) {
    console.error(`[ingest] ${name} failed:`, err)
    return { jobs: [], error: String(err) }
  }
}

export async function ingestAllSources(): Promise<IngestResult[]> {
  const supabase = ingestClient()
  const existingUrls = await getExistingUrls(supabase)

  const adapters: Array<{ name: string; fetcher: () => Promise<RawJob[]> }> = [
    // Project marketplaces first — these are the core freelance/gig inventory.
    { name: 'freelancer',     fetcher: fetchFreelancer },
    { name: 'hnfreelance',    fetcher: fetchHNFreelance },
    { name: 'remotive',       fetcher: fetchRemotive },
    { name: 'remoteok',       fetcher: fetchRemoteOK },
    { name: 'himalayas',      fetcher: fetchHimalayas },
    { name: 'findwork',       fetcher: fetchFindwork },
    { name: 'hnwih',          fetcher: fetchHNWhoIsHiring },
    { name: 'weworkremotely', fetcher: fetchWeWorkRemotely },
    { name: 'workingnomads',  fetcher: fetchWorkingNomads },
  ]

  const results: IngestResult[] = []

  for (const { name, fetcher } of adapters) {
    const runId = crypto.randomUUID()
    await supabase.from('ingestion_runs').insert({
      id: runId, source: name, status: 'running',
    })

    const { jobs, error: fetchError } = await runAdapter(name, fetcher)
    let error = fetchError
    const { toInsert: newJobs, urlsToTouch } = partitionFetchedJobs(jobs, existingUrls)
    const duped = jobs.length - newJobs.length
    let inserted = 0

    // Refresh last_seen_at for jobs still present in the source feed so they
    // are not later archived as stale.
    if (urlsToTouch.length > 0) {
      await supabase.from('jobs')
        .update({ last_seen_at: new Date().toISOString() })
        .in('url', urlsToTouch)
    }

    if (newJobs.length > 0) {
      const rows = await Promise.all(newJobs.map(async j => {
        const { score, flags } = scoreReliability(j)
        const embedding = await generateEmbedding(
          jobEmbeddingText({ title: j.title, skills: j.skills ?? [], description: j.description ?? '' })
        ).catch(() => null)
        return {
          title:             j.title,
          company:           j.company,
          description:       j.description,
          platform:          j.platform,
          url:               j.url,
          skills:            j.skills,
          location:          j.location,
          // rate columns are int; sources can produce fractional rates (e.g. 31.25/hr)
          rate_min:          j.rate_min == null ? null : Math.round(j.rate_min),
          rate_max:          j.rate_max == null ? null : Math.round(j.rate_max),
          posted_at:         j.posted_at,
          employment_type:   j.employment_type,
          rate_type:         j.rate_type ?? 'hourly',
          duration:          j.duration ?? null,
          reliability_score: score,
          reliability_flags: flags,
          source:            j.source,
          status:            score >= 60 ? 'approved' : 'pending',
          last_seen_at:      new Date().toISOString(),
          ...(embedding ? { embedding: JSON.stringify(embedding) } : {}),
        }
      }))

      const { error: insertErr } = await supabase.from('jobs').insert(rows)
      if (insertErr) {
        // Surface insert failures in the result instead of claiming success.
        console.error(`[ingest] insert error for ${name}:`, insertErr.message)
        error = error ?? `insert failed: ${insertErr.message}`
      } else {
        inserted = newJobs.length
        // update known urls cache
        newJobs.forEach(j => { if (j.url != null) existingUrls.add(j.url) })
      }
    }

    await supabase.from('ingestion_runs').update({
      finished_at: new Date().toISOString(),
      jobs_found:  jobs.length,
      jobs_new:    inserted,
      jobs_duped:  duped,
      status:      error ? 'error' : 'done',
      error:       error ?? null,
    }).eq('id', runId)

    results.push({ source: name, found: jobs.length, inserted, duped, error })
  }

  // Archive ingested jobs that have not appeared in any source feed recently —
  // they are most likely filled or closed. Seed data is left untouched.
  const { error: archiveErr } = await supabase.from('jobs')
    .update({ status: 'archived' })
    .eq('status', 'approved')
    .neq('source', 'seed')
    .lt('last_seen_at', staleCutoffISO())
  if (archiveErr) console.error('[ingest] archive error:', archiveErr.message)

  return results
}
