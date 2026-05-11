'use client'

interface Props {
  label:    string       // "Concise", "Standard", "Detailed"
  words:    string       // "140–150 words"
  text:     string
  selected: boolean
  onSelect: () => void
}

export default function ProposalVariantCard({ label, words, text, selected, onSelect }: Props) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-lg border p-4 space-y-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{wordCount} words · {words} target</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
      {selected && (
        <p className="text-xs text-primary font-medium">✓ Loaded into editor below</p>
      )}
    </button>
  )
}
