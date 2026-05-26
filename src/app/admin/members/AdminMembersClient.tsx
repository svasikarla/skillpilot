'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { UserPlus, UserX, UserCheck, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Member = {
  user_id: string; name: string; skills: string[]
  hourly_rate: number | null; role: string; is_active: boolean; created_at: string
}

export default function AdminMembersClient({ members: initial }: { members: Member[] }) {
  const [members, setMembers]   = useState(initial)
  const [email, setEmail]       = useState('')
  const [inviting, setInviting] = useState(false)

  async function invite() {
    if (!email.trim()) return
    setInviting(true)
    const res = await fetch('/api/admin/members', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Invite failed')
    else { toast.success(`Invite sent to ${email}`); setEmail('') }
    setInviting(false)
  }

  async function toggleActive(userId: string, current: boolean) {
    const res = await fetch(`/api/admin/members/${userId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (res.ok) setMembers(m => m.map(mem => mem.user_id === userId ? { ...mem, is_active: !current } : mem))
    else toast.error('Failed to update member')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-header">Members</h1>
        <p className="page-subheader">{members.length} members · Invite via magic link</p>
      </div>

      {/* Invite form */}
      <div className="flex gap-2 p-4 border rounded-lg bg-muted/20">
        <Input placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && invite()} className="flex-1" />
        <Button onClick={invite} disabled={inviting || !email.trim()} className="gap-1.5 shrink-0">
          <UserPlus className="h-4 w-4" />{inviting ? 'Sending…' : 'Invite'}
        </Button>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.user_id} className={cn('border rounded-lg p-4 flex items-center justify-between gap-4', !m.is_active && 'opacity-50')}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{m.name || 'No name yet'}</span>
                {m.role === 'admin' && (
                  <Badge className="text-xs bg-primary/10 text-primary border-primary/20 gap-0.5">
                    <Shield className="h-2.5 w-2.5" />Admin
                  </Badge>
                )}
                <Badge variant={m.is_active ? 'outline' : 'secondary'} className="text-xs">
                  {m.is_active ? 'Active' : 'Deactivated'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{(m.skills ?? []).length} skills</span>
                {m.hourly_rate && <span>${m.hourly_rate}/hr target</span>}
                <span>Joined {new Date(m.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button size="sm" variant="outline"
              className={cn('gap-1.5 text-xs shrink-0', !m.is_active ? 'text-emerald-700 border-emerald-300' : 'text-red-600 border-red-200 hover:bg-red-50')}
              onClick={() => toggleActive(m.user_id, m.is_active)}>
              {m.is_active ? <><UserX className="h-3.5 w-3.5" />Deactivate</> : <><UserCheck className="h-3.5 w-3.5" />Reactivate</>}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
