import { cn } from '@/lib/utils'

interface Props {
  content:   string
  className?: string
}

export default function PlatformMarkdown({ content, className }: Props) {
  // Simple markdown rendering — convert headers, bold, bullets, code
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li.*<\/li>(\n|$))+/g, (m) => `<ul class="space-y-1 my-2">${m}</ul>`)
    .replace(/✓/g, '<span class="text-green-600">✓</span>')
    .replace(/\n\n/g, '</p><p class="mt-3">')
    .replace(/^(?!<[hul]|<\/[hul]|<p)(.+)$/gm, '<p class="mt-2">$1</p>')

  return (
    <div
      className={cn('prose prose-sm max-w-none text-foreground', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
