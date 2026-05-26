import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AppNav from '@/components/AppNav'
import ApplicationStepper from '@/components/apply/ApplicationStepper'
import { getWorkflow } from '@/lib/application-workflow'
import { ChevronLeft } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

export default async function ApplyPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from('jobs').select('id, title, company, platform, url, skills, description').eq('id', id).single(),
    supabase.from('profiles').select('name, skills').eq('user_id', user.id).single(),
  ])

  if (!job) notFound()

  // Get or create application record
  const { data: existing } = await supabase
    .from('applications')
    .select('id, checklist_state')
    .eq('user_id', user.id)
    .eq('job_id', id)
    .single()

  let applicationId = existing?.id ?? null
  let checklistState = (existing?.checklist_state as Record<string, Record<string, boolean>>) ?? {}

  if (!applicationId) {
    const { data: created } = await supabase
      .from('applications')
      .insert({ user_id: user.id, job_id: id, status: 'in_progress' })
      .select('id')
      .single()
    applicationId = created?.id ?? null
  }

  const workflow = getWorkflow(job.platform)

  return (
    <div className="min-h-screen bg-background">
      <AppNav userName={profile?.name} />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <a href="/feed" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ChevronLeft className="h-4 w-4" /> Back to feed
          </a>
          <h1 className="page-header">How to Apply</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-foreground">{job.title}</span>
            {job.company && <span> · {job.company}</span>}
            <span className="text-primary font-medium"> · {job.platform}</span>
          </p>
        </div>

        <ApplicationStepper
          workflow={workflow}
          jobId={id}
          jobTitle={job.title}
          jobUrl={job.url}
          applicationId={applicationId}
          initialChecklist={checklistState}
        />
      </main>
    </div>
  )
}
