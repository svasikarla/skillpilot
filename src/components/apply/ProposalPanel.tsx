'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Wand2, Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSuccessState } from '@/lib/use-success-state'

const PLATFORM_TIPS: Record<string, string> = {
  Upwork:    '100–150 words. Hook in first sentence. First 2 lines are preview text — make them count.',
  Toptal:    'Professional and technical. Lead with architecture decisions and past outcomes.',
  Contra:    'Short and personal. 3 punchy sentences beats a 200-word template.',
  Braintrust:'Results-focused. Use numbers wherever possible. Mention timezone and availability.',
}

export default function ProposalPanel({ jobId, platform }: { jobId: string; platform: string }) {
  const [memberValue, setMemberValue] = useState('')
  const [pastResult, setPastResult]   = useState('')
  const [question, setQuestion]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [variants, setVariants]       = useState<{ concise: string; standard: string; detailed: string } | null>(null)
  const [active, setActive]           = useState<'concise' | 'standard' | 'detailed'>('standard')
  const [copied, triggerCopied]       = useSuccessState()

  const platformTip = PLATFORM_TIPS[platform]

  async function generate() {
    if (!memberValue || !pastResult || !question) { toast.error('Fill in all three fields'); return }
    setLoading(true)
    const res = await fetch('/api/proposals/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, member_value: memberValue, past_result: pastResult, question_for_client: question }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Failed'); setLoading(false); return }
    setVariants(data.variants)
    setLoading(false)
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Proposal generator · {platform}
        </p>
      </div>

      {platformTip && (
        <div className="text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
          💡 {platformTip}
        </div>
      )}

      {!variants ? (
        <div className="space-y-3">
          {[
            { id: 'value',    label: 'What specific value do you bring to this job?', val: memberValue, set: setMemberValue, ph: 'e.g. Built 3 production RAG systems for fintech clients…' },
            { id: 'result',   label: 'One measurable past result',                    val: pastResult,  set: setPastResult,  ph: 'e.g. Reduced inference latency by 40% using vLLM…' },
            { id: 'question', label: 'One smart question for the client',             val: question,    set: setQuestion,    ph: 'e.g. Is the data already chunked, or will I own the pipeline?' },
          ].map(({ id, label, val, set, ph }) => (
            <div key={id} className="space-y-1">
              <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
              <Input id={id} className="text-xs h-8 bg-muted/30" placeholder={ph}
                value={val} onChange={e => set(e.target.value)} />
            </div>
          ))}
          <Button size="sm" onClick={generate} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {loading ? 'Generating…' : 'Generate 3 variants'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {(['concise', 'standard', 'detailed'] as const).map(v => (
              <button key={v} onClick={() => setActive(v)}
                className={cn('text-xs px-2.5 py-1 rounded-md font-medium transition-colors capitalize border',
                  active === v
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted text-muted-foreground')}>
                {v}
              </button>
            ))}
            <button onClick={() => setVariants(null)}
              className="text-xs text-muted-foreground ml-auto hover:text-foreground underline">
              Regenerate
            </button>
          </div>
          <Textarea
            className="text-xs min-h-[140px] bg-muted/20 resize-none"
            value={variants[active]}
            onChange={e => setVariants({ ...variants, [active]: e.target.value })}
          />
          <Button size="sm" variant="outline"
            className={cn('w-full gap-1.5 transition-colors', copied && 'border-emerald-400 text-emerald-700 bg-emerald-50')}
            onClick={() => { navigator.clipboard.writeText(variants[active]); triggerCopied(); toast.success('Copied!') }}>
            {copied ? <><Check className="h-3.5 w-3.5" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy to clipboard</>}
          </Button>
        </div>
      )}
    </div>
  )
}
