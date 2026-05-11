import { createClient } from '@supabase/supabase-js'
import { SKILLS_TAXONOMY } from '../src/lib/skills-taxonomy'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function seed() {
  console.log(`Seeding ${SKILLS_TAXONOMY.length} skills…`)

  const rows = SKILLS_TAXONOMY.map(s => ({ name: s.name, cluster: s.cluster }))

  const { error } = await supabase
    .from('skills')
    .upsert(rows, { onConflict: 'name', ignoreDuplicates: true })

  if (error) {
    console.error('Error seeding skills:', error.message)
    process.exit(1)
  }

  const { count } = await supabase
    .from('skills')
    .select('*', { count: 'exact', head: true })

  console.log(`Done. Skills table now has ${count} rows.`)
}

seed()
