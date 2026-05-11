'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  displayName:     z.string().min(2, 'Name must be at least 2 characters'),
  timezone:        z.string().min(1),
  yearsExperience: z.number({ error: 'Enter your years of experience' }).int().min(0).max(40),
  workPreference:  z.enum(['short_project', 'long_contract', 'retainer', 'any']),
  privacyAgreed:   z.boolean().refine(v => v, 'You must agree to the privacy terms'),
})

export type BasicInfoData = z.infer<typeof schema>

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
]

interface Props {
  defaultValues?: Partial<BasicInfoData>
  onNext: (data: BasicInfoData) => void
}

export default function BasicInfo({ defaultValues, onNext }: Props) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BasicInfoData>({
    resolver: zodResolver(schema),
    defaultValues: { workPreference: 'any', timezone: 'UTC', privacyAgreed: false, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">Full name / display name</Label>
        <Input id="displayName" placeholder="Ada Lovelace" {...register('displayName')} />
        {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Your timezone</Label>
        <Select defaultValue="UTC" onValueChange={(v) => v && setValue('timezone', v)}>
          <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="yearsExperience">Years of AI/ML experience</Label>
        <Input id="yearsExperience" type="number" min={0} max={40} placeholder="3" {...register('yearsExperience', { valueAsNumber: true })} />
        {errors.yearsExperience && <p className="text-xs text-destructive">{errors.yearsExperience.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Preferred work type</Label>
        <Select defaultValue="any" onValueChange={(v) => setValue('workPreference', v as BasicInfoData['workPreference'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="short_project">Short projects (1–4 weeks)</SelectItem>
            <SelectItem value="long_contract">Long contracts (3–12 months)</SelectItem>
            <SelectItem value="retainer">Ongoing retainer</SelectItem>
            <SelectItem value="any">Any / open to all</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
        <Checkbox
          id="privacy"
          onCheckedChange={(checked) => setValue('privacyAgreed', checked === true)}
        />
        <label htmlFor="privacy" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
          I agree that my profile data and anonymised application outcomes will be shared with other members of this private group for collective intelligence features. No personal identifying data is ever shared externally.
        </label>
      </div>
      {errors.privacyAgreed && <p className="text-xs text-destructive">{errors.privacyAgreed.message}</p>}

      <Button type="submit" className="w-full">Continue</Button>
    </form>
  )
}
