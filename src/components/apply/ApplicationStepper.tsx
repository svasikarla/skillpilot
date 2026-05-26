'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, CheckCircle2, Circle, Wand2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Workflow, WorkflowStep } from '@/lib/application-workflow'
import ProposalPanel from '@/components/apply/ProposalPanel'
import { toast } from 'sonner'

type ChecklistState = Record<string, Record<string, boolean>>

interface Props {
  workflow: Workflow
  jobId: string
  jobTitle: string
  jobUrl: string | null
  applicationId: string | null
  initialChecklist: ChecklistState
}

export default function ApplicationStepper({
  workflow, jobId, jobTitle, jobUrl, applicationId, initialChecklist,
}: Props) {
  const [current, setCurrent]           = useState(0)
  const [checklist, setChecklist]       = useState<ChecklistState>(initialChecklist)
  const [showProposal, setShowProposal] = useState(false)
  const [saving, setSaving]             = useState(false)

  const steps   = workflow.steps
  const step    = steps[current]
  const stepState = checklist[step.id] ?? {}

  const stepComplete = step.checks.every((_, i) => stepState[i])
  const totalChecks  = steps.reduce((s, st) => s + st.checks.length, 0)
  const doneChecks   = Object.values(checklist).reduce(
    (s, sc) => s + Object.values(sc).filter(Boolean).length, 0
  )
  const progress = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0

  function toggleCheck(stepId: string, idx: number) {
    setChecklist(prev => ({
      ...prev,
      [stepId]: { ...(prev[stepId] ?? {}), [idx]: !(prev[stepId]?.[idx]) },
    }))
  }

  async function persistChecklist(next: ChecklistState) {
    if (!applicationId) return
    setSaving(true)
    await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checklist_state: next }),
    })
    setSaving(false)
  }

  async function handleCheck(stepId: string, idx: number) {
    const next: ChecklistState = {
      ...checklist,
      [stepId]: { ...(checklist[stepId] ?? {}), [idx]: !(checklist[stepId]?.[idx]) },
    }
    setChecklist(next)
    await persistChecklist(next)
  }

  async function markSubmitted() {
    if (!applicationId) return
    await fetch(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'submitted', applied_at: new Date().toISOString() }),
    })
    toast.success('Application marked as Submitted!')
  }

  const isLastStep = current === steps.length - 1

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {current + 1} of {steps.length}</span>
          <span>{progress}% complete</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step nav — pills on desktop, counter on mobile */}
      <div className="flex sm:hidden items-center justify-between text-sm font-medium">
        <span className="text-muted-foreground">Step {current + 1} of {steps.length}</span>
        <span className="text-foreground">{step.title}</span>
      </div>
      <div className="hidden sm:flex gap-1.5 flex-wrap">
        {steps.map((s, i) => {
          const done = s.checks.every((_, ci) => checklist[s.id]?.[ci])
          return (
            <button key={s.id} onClick={() => setCurrent(i)}
              className={cn(
                'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors',
                i === current
                  ? 'bg-primary text-primary-foreground border-primary'
                  : done
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}>
              {done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              {s.title}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <div className="border rounded-xl p-5 space-y-4 bg-card">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">{step.title}</h2>
            {stepComplete && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />Complete
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>

        {step.tip && (
          <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-primary">
            💡 {step.tip}
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-2.5">
          {step.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <Checkbox
                id={`${step.id}-${i}`}
                checked={!!stepState[i]}
                onCheckedChange={() => handleCheck(step.id, i)}
                className="mt-0.5"
              />
              <label htmlFor={`${step.id}-${i}`}
                className={cn('text-sm cursor-pointer leading-snug',
                  stepState[i] ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {check}
              </label>
            </div>
          ))}
        </div>

        {/* Action button */}
        {step.actionLabel && step.actionHref && (
          <a href={step.actionHref}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              {step.actionLabel} <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}

        {/* Proposal step */}
        {step.isProposalStep && (
          <div className="pt-1">
            <Button size="sm" variant={showProposal ? 'default' : 'outline'}
              className="gap-1.5 text-xs"
              onClick={() => setShowProposal(v => !v)}>
              <Wand2 className="h-3.5 w-3.5" />
              {showProposal ? 'Hide proposal generator' : 'Generate proposal'}
            </Button>
            {showProposal && (
              <div className="mt-4">
                <ProposalPanel jobId={jobId} platform={workflow.platform} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrent(s => s - 1)} disabled={current === 0} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex gap-2">
          {isLastStep && jobUrl && (
            <Button variant="outline" className="gap-1.5" render={<a href={jobUrl} target="_blank" rel="noopener noreferrer" />}>
              Apply on {workflow.platform} <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          {isLastStep ? (
            <Button onClick={markSubmitted} disabled={saving} className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Mark Submitted
            </Button>
          ) : (
            <Button onClick={() => setCurrent(s => s + 1)} className="gap-1.5">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
