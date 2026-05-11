export const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100  text-green-800  border-green-200',
  2: 'bg-blue-100   text-blue-800   border-blue-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-orange-100 text-orange-800 border-orange-200',
}

export const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3', 4: 'Tier 4',
}

export const TIER_DESCRIPTIONS: Record<number, string> = {
  1: 'Verified escrow, identity verification, established history',
  2: 'Partial verification, milestone payments, established',
  3: 'Task-based, traceable corporate entity, payment history',
  4: 'Competitions, bounties, prize-based work',
}
