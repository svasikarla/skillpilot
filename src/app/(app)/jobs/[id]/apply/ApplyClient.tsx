'use client'

import { useCallback, useState } from 'react'
import type { Workflow } from '@/lib/application-workflow'
import ApplicationStepper from '@/components/apply/ApplicationStepper'

interface Props {
  workflow:         Workflow
  jobId:            string
  platformId:       number
  platformName:     string
  userId:           string
  existingAppId:    string | null
  initialChecklist: Record<string, boolean[]> | null
}

export default function ApplyClient({
  workflow, jobId, platformId, platformName, userId, existingAppId, initialChecklist,
}: Props) {
  const [appId, setAppId] = useState<string | null>(existingAppId)

  const handleSave = useCallback(async (checklistState: Record<string, boolean[]>): Promise<string> => {
    const res = await fetch('/api/applications', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        applicationId:  appId,
        checklistState,
      }),
    })
    const data = await res.json() as { id: string }
    setAppId(data.id)
    return data.id
  }, [jobId, appId])

  return (
    <ApplicationStepper
      steps={workflow.steps}
      jobId={jobId}
      platformId={platformId}
      platformName={platformName}
      userId={userId}
      applicationId={appId}
      onSave={handleSave}
    />
  )
}
