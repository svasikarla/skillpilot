'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  text:     string
  onChange: (text: string) => void
}

export default function ProposalEditor({ text, onChange }: Props) {
  const [copied, setCopied] = useState(false)
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{wordCount} words</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={copy}
          disabled={!text}
        >
          {copied ? '✓ Copied' : 'Copy to clipboard'}
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={e => onChange(e.target.value)}
        rows={10}
        className="text-sm font-mono resize-none"
        placeholder="Select a variant above to load it here for editing…"
      />
      <p className="text-xs text-muted-foreground">
        Edit freely — only you see this. When ready, copy and paste into the platform.
      </p>
    </div>
  )
}
