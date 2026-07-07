// One-off maintenance: rewrite jobs.skills into the canonical taxonomy
// vocabulary (src/lib/skills-canonical.ts). Run from the repo root:
//   npx tsx scripts/backfill-canonical-skills.ts
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { readFileSync } from 'node:fs'
import { canonicalizeSkill } from '../src/lib/skills-canonical'

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

// Preserve unrecognised names rather than dropping data.
function canonicalize(skills: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of skills) {
    const name = canonicalizeSkill(raw) ?? raw
    if (!seen.has(name)) { seen.add(name); out.push(name) }
  }
  return out
}

async function main() {
  const res = await fetch(`${BASE}/rest/v1/jobs?select=id,skills&limit=2000`, { headers: HEADERS })
  if (!res.ok) throw new Error(`fetch jobs failed: ${res.status}`)
  const jobs = await res.json() as Array<{ id: string; skills: string[] | null }>

  let changed = 0
  for (const job of jobs) {
    const before = job.skills ?? []
    const after = canonicalize(before)
    if (JSON.stringify(before) === JSON.stringify(after)) continue

    const patch = await fetch(`${BASE}/rest/v1/jobs?id=eq.${job.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ skills: after }),
    })
    if (!patch.ok) throw new Error(`patch ${job.id} failed: ${patch.status} ${await patch.text()}`)
    changed++
  }

  console.log(`scanned ${jobs.length} jobs, canonicalized skills on ${changed}`)
}

main().catch(err => { console.error(err); process.exit(1) })
