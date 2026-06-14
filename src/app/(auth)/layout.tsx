import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel — left on desktop, hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between p-12 surface-brand border-r border-border relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-primary/6 blur-3xl pointer-events-none" />

        <div className="relative">
          <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <span className="text-primary-foreground text-sm font-bold">AI</span>
            </div>
            <span className="font-semibold text-foreground">AI/ML Freelance Hub</span>
          </Link>

          <blockquote className="space-y-3">
            <p className="text-xl font-semibold tracking-tight text-foreground leading-snug">
              "Stop browsing job boards.<br />Start landing AI/ML contracts."
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              A private tool for 25–30 AI/ML practitioners — real gigs, reliability scoring, proposal generation, and collective intelligence.
            </p>
          </blockquote>
        </div>

        <div className="relative space-y-4">
          {[
            { stat: '3 sources', label: 'Live job ingestion daily' },
            { stat: '0–100', label: 'Reliability score per listing' },
            { stat: '3 variants', label: 'Claude-powered proposals' },
          ].map(({ stat, label }) => (
            <div key={stat} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary text-xs font-bold">{stat.split(' ')[0]}</span>
              </div>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth form — right panel */}
      <div className="flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
