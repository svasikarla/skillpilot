'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import ProposalVariantCard from './ProposalVariantCard'
import ProposalEditor from './ProposalEditor'
import { toast } from 'sonner'

interface Variants {
  concise:  string
  standard: string
  detailed: string
}

interface Props {
  open:         boolean
  onClose:      () => void
  jobId:        string
  platformId:   number
  platformName: string
  userId:       string
}

const VARIANT_META = [
  { key: 'concise'  as const, label: 'Concise',  words: '140–150 words' },
  { key: 'standard' as const, label: 'Standard', words: '175–185 words' },
  { key: 'detailed' as const, label: 'Detailed', words: '210–220 words' },
]

export default function ProposalModal({ open, onClose, jobId, platformName }: Props) {
  const [memberValue,    setMemberValue]    = useState('')
  const [pastResult,     setPastResult]     = useState('')
  const [clientQuestion, setClientQuestion] = useState('')
  const [generating,     setGenerating]     = useState(false)
  const [variants,       setVariants]       = useState<Variants | null>(null)
  const [selected,       setSelected]       = useState<keyof Variants | null>(null)
  const [editorText,     setEditorText]     = useState('')

  async function generate() {
    if (!memberValue.trim() || !pastResult.trim() || !clientQuestion.trim()) {
      toast.error('All three fields are required')
      return
    }
    setGenerating(true)
    setVariants(null)
    setSelected(null)
    setEditorText('')
    try {
      const res = await fetch('/api/proposals/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jobId, memberValue, pastResult, clientQuestion }),
      })
      const data = await res.json() as { variants?: Variants; error?: string }
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Generation failed')
        return
      }
      setVariants(data.variants!)
      toast.success('3 proposal variants ready')
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setGenerating(false)
    }
  }

  function selectVariant(key: keyof Variants) {
    setSelected(key)
    setEditorText(variants?.[key] ?? '')
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Proposal — {platformName}</DialogTitle>
        </DialogHeader>

        {/* Input form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="memberValue">
              What value do you bring to this specific job?
            </Label>
            <Textarea
              id="memberValue"
              rows={2}
              placeholder="I build production RAG systems using LangChain + pgvector — I've shipped 3 this year and know where the sharp edges are."
              value={memberValue}
              onChange={e => setMemberValue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pastResult">
              One relevant past result (with a number if possible)
            </Label>
            <Textarea
              id="pastResult"
              rows={2}
              placeholder="Cut document retrieval latency from 4s to 280ms for a 500k-document corpus using HNSW indexing."
              value={pastResult}
              onChange={e => setPastResult(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clientQuestion">
              Your smart question for the client
            </Label>
            <Textarea
              id="clientQuestion"
              rows={2}
              placeholder="Is this replacing an internal tool or building net-new? That'll shape whether I'd recommend fine-tuning or a retrieval approach."
              value={clientQuestion}
              onChange={e => setClientQuestion(e.target.value)}
            />
          </div>

          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? 'Generating 3 variants…' : '✨ Generate'}
          </Button>
        </div>

        {/* Variant cards */}
        {variants && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium">Choose a variant to edit</p>
              {VARIANT_META.map(({ key, label, words }) => (
                <ProposalVariantCard
                  key={key}
                  label={label}
                  words={words}
                  text={variants[key]}
                  selected={selected === key}
                  onSelect={() => selectVariant(key)}
                />
              ))}
            </div>

            {selected && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Edit &amp; copy</p>
                  <ProposalEditor
                    text={editorText}
                    onChange={setEditorText}
                  />
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
