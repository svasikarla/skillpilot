// One-off maintenance: re-screen ingested jobs against the tightened
// isAiMlJob filter and archive listings that no longer qualify (e.g. sales
// or travel roles that mentioned "machine learning" once in boilerplate).
// Seed rows are left untouched. Run from the repo root:
//   npx tsx scripts/rescreen-jobs.ts
// Pass --dry-run to preview without archiving.

import { readFileSync } from 'node:fs'
import { isAiMlJob } from '../src/lib/ingest/types'

function env(name: string): string {
  const line = readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .find(l => l.startsWith(`${name}=`))
  const value = line?.slice(name.length + 1).trim()
  if (!value) throw new Error(`${name} missing in .env.local`)
  return value
}

const BASE = env('NEXT_PUBLIC_SUPABASE_URL')
const KEY = env('SUPABASE_SERVICE_ROLE_KEY')
const HEADERS = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
const DRY_RUN = process.argv.includes('--dry-run')

interface JobRow {
  id: string
  title: string
  description: string | null
  skills: string[] | null
  platform: string
}

async function main() {
  const res = await fetch(
    `${BASE}/rest/v1/jobs?select=id,title,description,skills,platform&status=in.(approved,pending)&source=neq.seed&limit=2000`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error(`fetch jobs failed: ${res.status}`)
  const jobs = await res.json() as JobRow[]

  const junk = jobs.filter(j => !isAiMlJob(j.title, j.description ?? '', j.skills ?? []))
  for (const j of junk) {
    console.log(`archive: [${j.platform}] ${j.title}`)
    if (DRY_RUN) continue
    const patch = await fetch(`${BASE}/rest/v1/jobs?id=eq.${j.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ status: 'archived' }),
    })
    if (!patch.ok) throw new Error(`patch ${j.id} failed: ${patch.status} ${await patch.text()}`)
  }

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}screened ${jobs.length} live jobs, archived ${junk.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })
