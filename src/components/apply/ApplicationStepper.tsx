'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { WorkflowStep } from '@/lib/application-workflow'
import PlatformMarkdown from '@/components/platforms/PlatformMarkdown'
import ProposalModal from '@/components/proposals/ProposalModal'

interface Props {
  steps:       WorkflowStep[]
  jobId:       string
  platformId:  number
  platformName: string
  userId:      string
  applicationId: string | null  // null until first save
  onSave:      (checklistState: Record<string, boolean[]>) => Promise<string>  // returns applicationId
}

const STEP_COLORS: Record<string, string> = {
  prereq:       'bg-slate-100  text-slate-700',
  context:      'bg-blue-100   text-blue-700',
  instructions: 'bg-purple-100 text-purple-700',
  generator:    'bg-green-100  text-green-700',
  checklist:    'bg-yellow-100 text-yellow-700',
  followup:     'bg-orange-100 text-orange-700',
}

export default function ApplicationStepper({ steps, jobId, platformId, platformName, userId, onSave }: Props) {
  const [current,   setCurrent]   = useState(0)
  const [checks,    setChecks]    = useState<Record<string, boolean[]>>(
    Object.fromEntries(steps.map(s => [s.id, s.checkItems.map(() => false)]))
  )
  const [saving,    setSaving]    = useState(false)
  const [proposalOpen, setProposalOpen] = useState(false)
  const [appId,     setAppId]     = useState<string | null>(null)

  const step      = steps[current]
  const progress  = Math.round(((current) / steps.length) * 100)
  const allDone   = checks[step.id]?.every(Boolean) ?? true

  function toggle(stepId: string, idx: number) {
    setChecks(prev => {
      const arr  = [...(prev[stepId] ?? [])]
      arr[idx]   = !arr[idx]
      return { ...prev, [stepId]: arr }
    })
  }

  async function handleSaveAndNext() {
    setSaving(true)
    const id = await onSave(checks)
    setAppId(id)
    setSaving(false)
    if (current < steps.length - 1) setCurrent(c => c + 1)
  }

  const completedSteps = steps.filter(s => checks[s.id]?.every(Boolean)).length

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {current + 1} of {steps.length}: {step.title}
          </span>
          <span className="text-muted-foreground">{completedSteps}/{steps.length} steps checked</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {steps.map((s, i) => {
          const done    = checks[s.id]?.every(Boolean) ?? false
          const active  = i === current
          return (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : done
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-muted text-muted-foreground border-transparent'
              }`}
            >
              {done ? '✓ ' : ''}{s.title}
            </button>
          )
        })}
      </div>

      <Separator />

      {/* Step content */}
      <div className="space-y-4">
        {/* Step type badge */}
        <Badge className={`text-xs ${STEP_COLORS[step.type] ?? 'bg-muted text-muted-foreground'}`}>
          {step.type}
        </Badge>

        {/* Member context callout */}
        {step.memberContext && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground border-l-4 border-primary">
            {step.memberContext}
          </div>
        )}

        {/* Main content (markdown) */}
        <div className="prose prose-sm max-w-none">
          <PlatformMarkdown content={step.content} />
        </div>

        {/* Proposal generator button on step 4 */}
        {step.type === 'generator' && (
          <Button
            onClick={() => setProposalOpen(true)}
            className="w-full"
            variant="default"
          >
            ✨ Generate AI Proposal Variants
          </Button>
        )}

        {/* Checklist items */}
        {step.checkItems.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Step checklist
            </p>
            {step.checkItems.map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                <Checkbox
                  checked={checks[step.id]?.[idx] ?? false}
                  onCheckedChange={() => toggle(step.id, idx)}
                  className="mt-0.5"
                />
                <span className={`text-sm leading-snug ${
                  checks[step.id]?.[idx] ? 'line-through text-muted-foreground' : ''
                }`}>
                  {item}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Back
        </Button>

        <Button
          size="sm"
          onClick={handleSaveAndNext}
          disabled={saving}
        >
          {saving ? 'Saving…' : current === steps.length - 1 ? 'Done' : 'Save & Next →'}
        </Button>
      </div>

      {/* Proposal modal */}
      <ProposalModal
        open={proposalOpen}
        onClose={() => setProposalOpen(false)}
        jobId={jobId}
        platformId={platformId}
        platformName={platformName}
        userId={userId}
      />
    </div>
  )
}
