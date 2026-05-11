import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SIGNAL_LABELS } from '@/lib/reliability'

interface Props {
  score:   number
  signals: Record<string, number>
  size?:   'sm' | 'md'
}

function badgeStyle(score: number): { label: string; classes: string } {
  if (score >= 70) return { label: 'Trusted',  classes: 'bg-green-100  text-green-800  border-green-200' }
  if (score >= 40) return { label: 'Verify',   classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
  if (score >= 20) return { label: 'Caution',  classes: 'bg-orange-100 text-orange-800 border-orange-200' }
  return            { label: 'Suspicious', classes: 'bg-red-100    text-red-800    border-red-200' }
}

export default function ReliabilityBadge({ score, signals, size = 'sm' }: Props) {
  const { label, classes } = badgeStyle(score)

  const positives = Object.entries(signals).filter(([, v]) => v > 0).map(([k]) => SIGNAL_LABELS[k] ?? k)
  const negatives = Object.entries(signals).filter(([, v]) => v < 0).map(([k]) => SIGNAL_LABELS[k] ?? k)

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={`inline-flex items-center gap-1 rounded-full border font-medium cursor-help ${px} ${classes}`} />}>
        {score} · {label}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-2 p-3">
        <p className="font-semibold text-sm">Reliability: {score}/100</p>
        {positives.length > 0 && (
          <div className="space-y-0.5">
            {positives.map((s, i) => (
              <p key={i} className="text-xs flex items-start gap-1.5">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                <span>{s}</span>
              </p>
            ))}
          </div>
        )}
        {negatives.length > 0 && (
          <div className="border-t pt-2 space-y-0.5">
            {negatives.map((s, i) => (
              <p key={i} className="text-xs flex items-start gap-1.5">
                <span className="text-destructive shrink-0 mt-0.5">✗</span>
                <span>{s}</span>
              </p>
            ))}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
