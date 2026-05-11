'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  targetHourlyRate: z.number({ error: 'Enter your target hourly rate' }).min(1),
  minProjectBudget: z.number().min(0).optional(),
  hoursPerWeek:     z.number({ error: 'Enter hours per week' }).int().min(1).max(60),
  about:            z.string().min(20, 'Write at least 20 characters about yourself'),
  githubUrl:        z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

export type RatePrefsData = z.infer<typeof schema>

interface Props {
  defaultValues?: Partial<RatePrefsData>
  onNext: (data: RatePrefsData) => void
  onBack: () => void
}

export default function RatePrefs({ defaultValues, onNext, onBack }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<RatePrefsData>({
    resolver: zodResolver(schema),
    defaultValues: { hoursPerWeek: 20, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="targetHourlyRate">Target hourly rate (USD)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input id="targetHourlyRate" type="number" min={1} className="pl-7" placeholder="85" {...register('targetHourlyRate', { valueAsNumber: true })} />
          </div>
          {errors.targetHourlyRate && <p className="text-xs text-destructive">{errors.targetHourlyRate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="minProjectBudget">Min project budget (USD, optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input id="minProjectBudget" type="number" min={0} className="pl-7" placeholder="500" {...register('minProjectBudget', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hoursPerWeek">Hours available per week for freelance</Label>
        <Input id="hoursPerWeek" type="number" min={1} max={60} placeholder="20" {...register('hoursPerWeek', { valueAsNumber: true })} />
        {errors.hoursPerWeek && <p className="text-xs text-destructive">{errors.hoursPerWeek.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="about">Professional summary</Label>
        <Textarea
          id="about"
          rows={4}
          placeholder="I build RAG systems and LLM pipelines for enterprise clients. Specialised in LangChain, pgvector, and production AI deployments..."
          {...register('about')}
        />
        <p className="text-xs text-muted-foreground">Used in proposal generation and profile matching. Be specific about what you build and for whom.</p>
        {errors.about && <p className="text-xs text-destructive">{errors.about.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="githubUrl">GitHub profile URL (optional)</Label>
        <Input id="githubUrl" type="url" placeholder="https://github.com/yourname" {...register('githubUrl')} />
        {errors.githubUrl && <p className="text-xs text-destructive">{errors.githubUrl.message}</p>}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}
