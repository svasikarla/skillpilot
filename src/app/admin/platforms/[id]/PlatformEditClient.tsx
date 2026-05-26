'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface Platform {
  id: string
  slug: string
  name: string
  tier: number
  trust_score: number
  description: string | null
  guide_md: string | null
  setup_guide: string | null
  application_guide: string | null
  tips: string[] | null
  red_flags: string[] | null
  rate_min_aiml: number | null
  rate_max_aiml: number | null
}

export default function PlatformEditClient({ platform }: { platform: Platform }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:              platform.name,
    description:       platform.description ?? '',
    tier:              String(platform.tier),
    guide_md:          platform.guide_md ?? '',
    setup_guide:       platform.setup_guide ?? '',
    application_guide: platform.application_guide ?? '',
    tips:              (platform.tips ?? []).join('\n'),
    red_flags:         (platform.red_flags ?? []).join('\n'),
    rate_min_aiml:     platform.rate_min_aiml ? String(platform.rate_min_aiml) : '',
    rate_max_aiml:     platform.rate_max_aiml ? String(platform.rate_max_aiml) : '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/platforms/${platform.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:              form.name,
        description:       form.description || null,
        tier:              Number(form.tier),
        guide_md:          form.guide_md || null,
        setup_guide:       form.setup_guide || null,
        application_guide: form.application_guide || null,
        tips:      form.tips.split('\n').map(s => s.trim()).filter(Boolean),
        red_flags: form.red_flags.split('\n').map(s => s.trim()).filter(Boolean),
        rate_min_aiml: form.rate_min_aiml ? Number(form.rate_min_aiml) : null,
        rate_max_aiml: form.rate_max_aiml ? Number(form.rate_max_aiml) : null,
      }),
    })
    setSaving(false)
    if (res.ok) toast.success('Platform guide saved')
    else toast.error('Save failed — check console')
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{platform.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{platform.slug}</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Tier</Label>
          <Select value={form.tier} onValueChange={v => set('tier', v ?? form.tier)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 — Elite</SelectItem>
              <SelectItem value="2">2 — Strong</SelectItem>
              <SelectItem value="3">3 — Emerging</SelectItem>
              <SelectItem value="4">4 — Risky</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>AI/ML Rate Min ($/hr)</Label>
          <Input type="number" value={form.rate_min_aiml} onChange={e => set('rate_min_aiml', e.target.value)} placeholder="e.g. 70" />
        </div>
        <div className="space-y-1.5">
          <Label>AI/ML Rate Max ($/hr)</Label>
          <Input type="number" value={form.rate_max_aiml} onChange={e => set('rate_max_aiml', e.target.value)} placeholder="e.g. 150" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Short description</Label>
        <Textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Setup guide <span className="text-muted-foreground text-xs">(shown on platform card)</span></Label>
        <Textarea rows={4} value={form.setup_guide} onChange={e => set('setup_guide', e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Application guide <span className="text-muted-foreground text-xs">(shown on platform card)</span></Label>
        <Textarea rows={4} value={form.application_guide} onChange={e => set('application_guide', e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Tips <span className="text-muted-foreground text-xs">(one per line)</span></Label>
        <Textarea rows={5} value={form.tips} onChange={e => set('tips', e.target.value)} className="font-mono text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label>Red flags <span className="text-muted-foreground text-xs">(one per line)</span></Label>
        <Textarea rows={4} value={form.red_flags} onChange={e => set('red_flags', e.target.value)} className="font-mono text-sm" />
      </div>

      <div className="space-y-1.5">
        <Label>Full guide (Markdown) <span className="text-muted-foreground text-xs">— rendered on platform detail page</span></Label>
        <Textarea rows={24} value={form.guide_md} onChange={e => set('guide_md', e.target.value)} className="font-mono text-xs" />
      </div>

      <Button onClick={save} disabled={saving} className="gap-1.5 w-full">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save all changes
      </Button>
    </div>
  )
}
