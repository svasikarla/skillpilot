import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { runAllSources } from '@/lib/sources/index'
import { scoreJob, shouldAutoApprove, shouldAutoReject } from '@/lib/reliability'
import type { JobListing } from '@/lib/sources/types'

function dedupHash(sourceId: string): string {
  return crypto.createHash('sha256').update(sourceId).digest('hex').slice(0, 32)
}

function excerpt(text: string, max = 300): string {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + '…'
}

export async function GET(req: Request) {
  // In dev, allow unauthenticated access so you can trigger it from the browser.
  // In production (CRON_SECRET set), require the Vercel cron bearer token.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createAdminClient()

  // Load platform tier map (slug → { id, trust_tier })
  const { data: platforms } = await supabase
    .from('platforms')
    .select('id, slug, trust_tier')
    .eq('is_active', true)

  const tierBySlug = new Map(
    (platforms ?? []).map((p: { slug: string; id: number; trust_tier: number | null }) => [
      p.slug, { id: p.id, tier: p.trust_tier }
    ])
  )

  // Run all source adapters
  const runId = crypto.randomUUID()
  const runStart = new Date().toISOString()

  await supabase.from('ingestion_runs').insert({
    id: runId,
    source_name: 'all',
    started_at:  runStart,
    status:      'running',
  })

  const sourceResults = await runAllSources()

  let totalFetched = 0
  let totalNew     = 0
  let totalDuped   = 0

  for (const result of sourceResults) {
    totalFetched += result.jobs.length

    for (const job of result.jobs) {
      const hash = dedupHash(job.sourceId)

      // Skip duplicates
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('dedup_hash', hash)
        .maybeSingle()

      if (existing) {
        totalDuped++
        continue
      }

      const isUSAJobs = result.name === 'usajobs'
      const platformInfo = job.platformId ? { id: job.platformId, tier: null } : undefined

      // Use platform tier if we know the source platform, otherwise null
      const reliability = scoreJob(job, platformInfo?.tier ?? null, isUSAJobs)

      let status = 'pending'
      if (shouldAutoReject(reliability)) status = 'rejected'
      else if (shouldAutoApprove(reliability, isUSAJobs)) status = 'approved'

      // Map adapter rate_type to DB-allowed values (DB has no 'unknown'/'daily')
      const dbRateType = (['hourly', 'fixed', 'monthly', 'undisclosed'] as const)
        .includes(job.rateType as 'hourly' | 'fixed' | 'monthly' | 'undisclosed')
        ? job.rateType
        : null

      const { error: insertErr } = await supabase.from('jobs').insert({
        platform_id:         job.platformId ?? null,
        source_job_id:       job.sourceId,
        source_url:          job.sourceUrl,
        title:               job.title,
        company:             job.company ?? null,
        description:         job.description,
        description_excerpt: excerpt(job.description),
        rate_min:            job.rateMin ?? null,
        rate_max:            job.rateMax ?? null,
        rate_type:           dbRateType,
        job_type:            null,   // adapters provide work-location not contract type
        is_remote:           job.isRemote,
        location:            job.location ?? null,
        posted_at:           job.postedAt.toISOString(),
        status,
        reliability_score:   reliability.score,
        reliability_signals: reliability.signals,
        dedup_hash:          hash,
      })

      if (insertErr) {
        console.error(`[ingest] insert failed for ${job.sourceId}:`, insertErr.message)
        continue
      }

      totalNew++

      // If auto-approved, queue embedding (fire-and-forget)
      if (status === 'approved') {
        // Will be picked up by refresh-matches cron; embedding requires OpenAI key
      }
    }
  }

  await supabase.from('ingestion_runs')
    .update({
      completed_at: new Date().toISOString(),
      jobs_fetched: totalFetched,
      jobs_new:     totalNew,
      jobs_duped:   totalDuped,
      status:       'success',
    })
    .eq('id', runId)

  return NextResponse.json({
    ok: true,
    fetched: totalFetched,
    new:     totalNew,
    duped:   totalDuped,
    sources: sourceResults.map(r => ({
      name:  r.name,
      jobs:  r.jobs.length,
      error: r.error,
      ms:    r.durationMs,
    })),
  })
}
