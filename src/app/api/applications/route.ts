import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  /api/applications — list all applications for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, status, applied_at, rate_proposed, rate_agreed, days_to_response,
      notes, checklist_state, created_at, updated_at,
      jobs ( id, title, description_excerpt, source_url, extracted_skills ),
      platforms ( id, name, trust_tier )
    `)
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data })
}

// POST /api/applications — create or update (upsert by job_id)
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    jobId:          string
    applicationId?: string
    checklistState?: Record<string, boolean[]>
    status?:        string
    rateProposed?:  number
    notes?:         string
    appliedAt?:     string
  }

  const { jobId, applicationId, checklistState, status, rateProposed, notes, appliedAt } = body

  // Fetch platform_id from the job
  const { data: job } = await supabase
    .from('jobs')
    .select('platform_id')
    .eq('id', jobId)
    .single()

  const payload: Record<string, unknown> = {
    member_id:    user.id,
    job_id:       jobId,
    platform_id:  job?.platform_id ?? null,
    updated_at:   new Date().toISOString(),
  }
  if (checklistState !== undefined) payload.checklist_state = checklistState
  if (status          !== undefined) payload.status          = status
  if (rateProposed    !== undefined) payload.rate_proposed   = rateProposed
  if (notes           !== undefined) payload.notes           = notes
  if (appliedAt       !== undefined) payload.applied_at      = appliedAt

  let id = applicationId

  if (id) {
    await supabase.from('applications').update(payload).eq('id', id).eq('member_id', user.id)
  } else {
    // Check for existing application for this job
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('member_id', user.id)
      .eq('job_id', jobId)
      .maybeSingle()

    if (existing) {
      id = existing.id
      await supabase.from('applications').update(payload).eq('id', id)
    } else {
      payload.status     = payload.status ?? 'saved'
      payload.created_at = new Date().toISOString()
      const { data: created } = await supabase.from('applications').insert(payload).select('id').single()
      id = created?.id
    }
  }

  return NextResponse.json({ id })
}
