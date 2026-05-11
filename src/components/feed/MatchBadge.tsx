import { matchLabel } from '@/lib/matching'
import { MATCH_THRESHOLDS } from '@/lib/config'

interface Props {
  score:      number
  isNearMiss: boolean
}

function ringColor(score: number, isNearMiss: boolean): string {
  if (isNearMiss)                              return 'text-purple-600  stroke-purple-400'
  if (score >= MATCH_THRESHOLDS.applyReady)    return 'text-green-600   stroke-green-400'
  if (score >= MATCH_THRESHOLDS.nearMiss)      return 'text-primary     stroke-primary/60'
  return                                              'text-muted-foreground stroke-muted-foreground/40'
}

export default function MatchBadge({ score, isNearMiss }: Props) {
  const label  = matchLabel(score, isNearMiss)
  const color  = ringColor(score, isNearMiss)
  const r      = 16
  const circ   = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[52px]">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="3"
          className="text-muted/40" />
        <circle
          cx="20" cy="20" r={r} fill="none" strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          className={color.split(' ')[1]}
        />
        <text x="20" y="24" textAnchor="middle" fontSize="11" fontWeight="600"
          className="fill-foreground">
          {score}
        </text>
      </svg>
      <span className={`text-[10px] font-medium leading-tight text-center ${color.split(' ')[0]}`}>
        {label}
      </span>
    </div>
  )
}
