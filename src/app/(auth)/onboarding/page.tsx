'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import BasicInfo, { type BasicInfoData } from './steps/BasicInfo'
import SkillSelect, { type SkillEntry } from './steps/SkillSelect'
import RatePrefs, { type RatePrefsData } from './steps/RatePrefs'
import Portfolio, { type PortfolioItem } from './steps/Portfolio'
import PlatformAccounts, { type PlatformAccount } from './steps/PlatformAccounts'

type WizardState = {
  basicInfo?:         BasicInfoData
  skills?:            SkillEntry[]
  ratePrefs?:         RatePrefsData
  portfolio?:         PortfolioItem[]
  platformAccounts?:  PlatformAccount[]
}

const STEPS = [
  'About you',
  'Your skills',
  'Rates & availability',
  'Portfolio',
  'Platform accounts',
]

export default function OnboardingPage() {
  const router  = useRouter()
  const [step,    setStep]    = useState(0)
  const [state,   setState]   = useState<WizardState>({})
  const [loading, setLoading] = useState(false)

  // Already-onboarded users should go straight to the feed
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return  // middleware handles the redirect to /login
      const { data: member } = await supabase
        .from('members').select('id').eq('id', user.id).maybeSingle()
      if (member) router.replace('/feed')
    })
  }, [router])

  function updateState(patch: Partial<WizardState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  async function handleFinalSubmit(platformAccounts: PlatformAccount[]) {
    setLoading(true)
    try {
      const payload = {
        ...state.basicInfo,
        skills:           state.skills,
        ratePrefs:        state.ratePrefs,
        portfolio:        state.portfolio,
        platformAccounts,
      }

      const res = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? 'Failed to save profile')
      }

      toast.success('Profile saved! Welcome to the hub.')
      router.push('/feed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <h1 className="text-2xl font-semibold">
            {step === 0 && 'Welcome — let\'s set up your profile'}
            {step === 1 && 'Which AI/ML skills do you have?'}
            {step === 2 && 'What are your rate expectations?'}
            {step === 3 && 'Add your best portfolio projects'}
            {step === 4 && 'Which platforms do you already use?'}
          </h1>
        </div>

        {/* Step content */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          {step === 0 && (
            <BasicInfo
              defaultValues={state.basicInfo}
              onNext={(data) => { updateState({ basicInfo: data }); setStep(1) }}
            />
          )}
          {step === 1 && (
            <SkillSelect
              defaultValues={state.skills}
              onNext={(skills) => { updateState({ skills }); setStep(2) }}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <RatePrefs
              defaultValues={state.ratePrefs}
              onNext={(data) => { updateState({ ratePrefs: data }); setStep(3) }}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Portfolio
              defaultValues={state.portfolio}
              onNext={(items) => { updateState({ portfolio: items }); setStep(4) }}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <PlatformAccounts
              defaultValues={state.platformAccounts}
              onSubmit={handleFinalSubmit}
              onBack={() => setStep(3)}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
