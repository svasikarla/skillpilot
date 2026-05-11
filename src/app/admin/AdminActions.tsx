'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface IngestResult {
  ok: boolean
  fetched?: number
  new?: number
  duped?: number
  error?: string
  sources?: Array<{ name: string; jobs: number; error?: string }>
}

interface MatchResult {
  ok: boolean
  members?: number
  jobs?: number
  matchesUpserted?: number
  error?: string
}

export default function AdminActions() {
  const router = useRouter()
  const [ingesting,  setIngesting]  = useState(false)
  const [matching,   setMatching]   = useState(false)
  const [lastIngest, setLastIngest] = useState<IngestResult | null>(null)
  const [lastMatch,  setLastMatch]  = useState<MatchResult | null>(null)

  async function runIngest() {
    setIngesting(true)
    setLastIngest(null)
    try {
      const res  = await fetch('/api/cron/ingest')
      const data = await res.json() as IngestResult
      if (!res.ok || !data.ok) {
        toast.error(`Ingest failed: ${data.error ?? res.statusText}`)
      } else {
        toast.success(`Ingest complete — ${data.new} new jobs from ${data.fetched} fetched`)
        setLastIngest(data)
        router.refresh()   // reload the ingestion runs table
      }
    } catch (err) {
      toast.error(`Ingest error: ${err instanceof Error ? err.message : 'Network error'}`)
    } finally {
      setIngesting(false)
    }
  }

  async function runRefreshMatches() {
    setMatching(true)
    setLastMatch(null)
    try {
      const res  = await fetch('/api/cron/refresh-matches')
      const data = await res.json() as MatchResult
      if (!res.ok || !data.ok) {
        toast.error(`Match refresh failed: ${data.error ?? res.statusText}`)
      } else {
        toast.success(`Matches refreshed — ${data.matchesUpserted} matches across ${data.members} member(s)`)
        setLastMatch(data)
      }
    } catch (err) {
      toast.error(`Match error: ${err instanceof Error ? err.message : 'Network error'}`)
    } finally {
      setMatching(false)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Manual controls</h2>
        <p className="text-xs text-muted-foreground">Trigger cron jobs on demand. Run ingest first, then refresh matches.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Run Ingest */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={runIngest}
            disabled={ingesting || matching}
            className="gap-2 min-w-36"
          >
            {ingesting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Ingesting…</>
              : <><RefreshCw className="h-3.5 w-3.5" />Run Ingest</>
            }
          </Button>
          {lastIngest && (
            <p className="text-xs text-muted-foreground pl-1">
              {lastIngest.new} new · {lastIngest.fetched} fetched · {lastIngest.duped} dupes
            </p>
          )}
        </div>

        {/* Refresh Matches */}
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={runRefreshMatches}
            disabled={ingesting || matching}
            className="gap-2 min-w-40"
          >
            {matching
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Matching…</>
              : <><Zap className="h-3.5 w-3.5" />Refresh Matches</>
            }
          </Button>
          {lastMatch && (
            <p className="text-xs text-muted-foreground pl-1">
              {lastMatch.matchesUpserted} matches · {lastMatch.members} member(s) · {lastMatch.jobs} jobs
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
