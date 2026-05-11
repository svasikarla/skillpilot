import type { JobListing } from './types'
import { fetchRemotive }       from './remotive'
import { fetchWeWorkRemotely } from './weworkremotely'
import { fetchRemoteOK }       from './remoteok'
import { fetchHimalayas }      from './himalayas'
import { fetchFindwork }       from './findwork'
import { fetchHNWhoIsHiring }  from './hn-algolia'
import { fetchUSAJobs }        from './usajobs'
import { fetchWellfound }      from './wellfound'

type SourceFn = () => Promise<JobListing[]>

const SOURCES: Array<{ name: string; fn: SourceFn }> = [
  { name: 'remotive',       fn: fetchRemotive },
  { name: 'weworkremotely', fn: fetchWeWorkRemotely },
  { name: 'remoteok',       fn: fetchRemoteOK },
  { name: 'himalayas',      fn: fetchHimalayas },
  { name: 'findwork',       fn: fetchFindwork },
  { name: 'hn-algolia',     fn: fetchHNWhoIsHiring },
  { name: 'usajobs',        fn: fetchUSAJobs },
  { name: 'wellfound',      fn: fetchWellfound },
]

export interface SourceResult {
  name:    string
  jobs:    JobListing[]
  error?:  string
  durationMs: number
}

export async function runAllSources(): Promise<SourceResult[]> {
  const results: SourceResult[] = []

  for (const { name, fn } of SOURCES) {
    const t0 = Date.now()
    try {
      const jobs = await fn()
      results.push({ name, jobs, durationMs: Date.now() - t0 })
      console.log(`[sources] ${name}: ${jobs.length} AI/ML jobs (${Date.now() - t0}ms)`)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      results.push({ name, jobs: [], error, durationMs: Date.now() - t0 })
      console.error(`[sources] ${name} FAILED: ${error}`)
    }
  }

  return results
}

export type { JobListing }
