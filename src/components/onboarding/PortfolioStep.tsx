'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Briefcase } from 'lucide-react'

export interface PortfolioItem {
  name: string
  description: string
  stack: string[]
  result: string
}

const EMPTY: PortfolioItem = { name: '', description: '', stack: [], result: '' }

export default function PortfolioStep({
  items,
  onChange,
}: {
  items: PortfolioItem[]
  onChange: (items: PortfolioItem[]) => void
}) {
  const [stackInput, setStackInput] = useState<Record<number, string>>({})

  function addItem() {
    if (items.length >= 5) return
    onChange([...items, { ...EMPTY }])
  }

  function removeItem(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i: number, field: keyof PortfolioItem, value: string | string[]) {
    onChange(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function handleStackKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = (stackInput[i] ?? '').trim()
      if (val && !items[i].stack.includes(val)) {
        updateItem(i, 'stack', [...items[i].stack, val])
      }
      setStackInput(prev => ({ ...prev, [i]: '' }))
    }
    if (e.key === 'Backspace' && !(stackInput[i] ?? '')) {
      const stack = items[i].stack
      if (stack.length) updateItem(i, 'stack', stack.slice(0, -1))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Portfolio projects</p>
          <p className="text-xs text-muted-foreground">Up to 5 projects — used in proposals and profile audit</p>
        </div>
        {items.length < 5 && (
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1.5 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add project
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <button type="button" onClick={addItem}
          className="w-full border border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
          <Briefcase className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Add a project to strengthen your proposals</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Optional but recommended</p>
        </button>
      )}

      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project {i + 1}</span>
            <button type="button" onClick={() => removeItem(i)} aria-label={`Remove project ${i + 1}`}
              className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Project name *</Label>
              <Input className="h-8 text-xs" placeholder="RAG document search engine"
                value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Measurable result *</Label>
              <Input className="h-8 text-xs" placeholder="Reduced search time by 60%"
                value={item.result} onChange={e => updateItem(i, 'result', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Brief description</Label>
            <Textarea className="text-xs min-h-[64px] resize-none" placeholder="What did you build and for whom?"
              value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tech stack <span className="text-muted-foreground">(Enter or comma to add)</span></Label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] px-2 py-1.5 border rounded-md bg-background focus-within:ring-1 focus-within:ring-primary/30">
              {item.stack.map((t, ti) => (
                <span key={ti} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                  {t}
                  <button type="button" onClick={() => updateItem(i, 'stack', item.stack.filter((_, si) => si !== ti))}
                    className="hover:text-destructive">×</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[80px] text-xs outline-none bg-transparent"
                placeholder={item.stack.length ? '' : 'LangChain, pgvector…'}
                value={stackInput[i] ?? ''}
                onChange={e => setStackInput(prev => ({ ...prev, [i]: e.target.value }))}
                onKeyDown={e => handleStackKeyDown(i, e)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
