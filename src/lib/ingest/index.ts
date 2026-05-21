import { createClient } from '@/lib/supabase/server'
import { fetchRemotive } from './remotive'
import { fetchRemoteOK } from './remoteok'
import { fetchHimalayas } from './himalayas'
import { scoreReliability } from '@/lib/reliability'
import type { RawJob } from './types'

export interface IngestResult {
  source: string
  found: number
  inserted: number
  duped: number
  error?: string
}

async function getExistingUrls(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Set<string>> {
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
  const supabase = await createClient()
  const existingUrls = await getExistingUrls(supabase)

  const adapters: Array<{ name: string; fetcher: () => Promise<RawJob[]> }> = [
    { name: 'remotive',  fetcher: fetchRemotive },
    { name: 'remoteok',  fetcher: fetchRemoteOK },
    { name: 'himalayas', fetcher: fetchHimalayas },
  ]

  const results: IngestResult[] = []

  for (const { name, fetcher } of adapters) {
    const runId = crypto.randomUUID()
    await supabase.from('ingestion_runs').insert({
      id: runId, source: name, status: 'running',
    })

    const { jobs, error } = await runAdapter(name, fetcher)
    const newJobs = jobs.filter(j => !existingUrls.has(j.url))
    const duped = jobs.length - newJobs.length

    if (newJobs.length > 0) {
      const rows = newJobs.map(j => {
        const { score, flags } = scoreReliability(j)
        return {
          title:             j.title,
          company:           j.company,
          description:       j.description,
          platform:          j.platform,
          url:               j.url,
          skills:            j.skills,
          location:          j.location,
          rate_min:          j.rate_min,
          rate_max:          j.rate_max,
          posted_at:         j.posted_at,
          reliability_score: score,
          reliability_flags: flags,
          source:            j.source,
          status:            score >= 60 ? 'approved' : 'pending',
        }
      })

      const { error: insertErr } = await supabase.from('jobs').insert(rows)
      if (insertErr) console.error(`[ingest] insert error for ${name}:`, insertErr.message)

      // update known urls cache
      newJobs.forEach(j => existingUrls.add(j.url))
    }

    await supabase.from('ingestion_runs').update({
      finished_at: new Date().toISOString(),
      jobs_found:  jobs.length,
      jobs_new:    newJobs.length,
      jobs_duped:  duped,
      status:      error ? 'error' : 'done',
      error:       error ?? null,
    }).eq('id', runId)

    results.push({ source: name, found: jobs.length, inserted: newJobs.length, duped, error })
  }

  return results
}
