'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { PROFILE } from '@/lib/config'

export interface PortfolioItem {
  name:        string
  description: string
  stack:       string[]
  outcome:     string
}

interface Props {
  defaultValues?: PortfolioItem[]
  onNext: (items: PortfolioItem[]) => void
  onBack: () => void
}

const empty = (): PortfolioItem => ({ name: '', description: '', stack: [], outcome: '' })

export default function Portfolio({ defaultValues = [], onNext, onBack }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>(defaultValues.length ? defaultValues : [empty()])

  function update(i: number, field: keyof PortfolioItem, value: string) {
    const next = [...items]
    if (field === 'stack') {
      next[i] = { ...next[i], stack: value.split(',').map(s => s.trim()).filter(Boolean) }
    } else {
      next[i] = { ...next[i], [field]: value }
    }
    setItems(next)
  }

  function addItem() {
    if (items.length < PROFILE.maxPortfolioItems) setItems([...items, empty()])
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function handleNext() {
    const valid = items.filter(it => it.name.trim() && it.description.trim())
    onNext(valid)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add up to {PROFILE.maxPortfolioItems} projects. These are used to generate proposals and in profile audits. A measurable outcome ("reduced latency by 40%") is worth 10x more than a generic description.
      </p>

      {items.map((item, i) => (
        <Card key={i}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <Label>Project name</Label>
                <Input
                  value={item.name}
                  onChange={e => update(i, 'name', e.target.value)}
                  placeholder="RAG-based document Q&A for legal firm"
                />
              </div>
              {items.length > 1 && (
                <Button variant="ghost" size="icon" className="mt-6" onClick={() => removeItem(i)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Brief description</Label>
              <Textarea
                rows={2}
                value={item.description}
                onChange={e => update(i, 'description', e.target.value)}
                placeholder="Built a RAG pipeline over 50K legal documents using LangChain + pgvector..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tech stack (comma-separated)</Label>
                <Input
                  value={item.stack.join(', ')}
                  onChange={e => update(i, 'stack', e.target.value)}
                  placeholder="LangChain, pgvector, FastAPI"
                />
              </div>
              <div className="space-y-2">
                <Label>Measurable outcome</Label>
                <Input
                  value={item.outcome}
                  onChange={e => update(i, 'outcome', e.target.value)}
                  placeholder="Reduced search time by 60%, 98% accuracy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length < PROFILE.maxPortfolioItems && (
        <Button variant="outline" onClick={addItem} className="w-full gap-2">
          <Plus className="h-4 w-4" /> Add project
        </Button>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" type="button" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  )
}
