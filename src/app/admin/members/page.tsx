'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Member {
  id:             string
  email:          string | null
  display_name:   string | null
  role:           string
  is_active:      boolean
  created_at:     string
  last_active_at: string | null
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/members')
      .then(r => r.json())
      .then((d: { members?: Member[] }) => setMembers(d.members ?? []))
      .catch(() => toast.error('Failed to load members'))
      .finally(() => setLoading(false))
  }, [])

  async function invite() {
    if (!email.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/admin/members', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      })
      const d = await res.json() as { ok?: boolean; error?: string }
      if (res.ok) { toast.success(`Invite sent to ${email}`); setEmail('') }
      else toast.error(d.error ?? 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !current }),
      })
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m))
        toast.success(current ? 'Member deactivated' : 'Member activated')
      } else toast.error('Failed to update')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Member Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{members.length} members total</p>
      </div>

      {/* Invite form */}
      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold">Invite a new member</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && invite()}
            placeholder="member@example.com"
            className="flex-1 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" onClick={invite} disabled={inviting || !email.trim()}>
            {inviting ? 'Sending…' : 'Send invite'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">They&apos;ll receive a magic link to set up their account.</p>
      </div>

      {/* Members table */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Member</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Role</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Joined</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Last active</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <p className="font-medium">{m.display_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{m.email ?? '—'}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={m.role === 'admin' ? 'default' : 'outline'} className="text-xs">
                      {m.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(m.created_at)}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(m.last_active_at)}</td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${m.is_active ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}
                    >
                      {m.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-6"
                      disabled={toggling === m.id}
                      onClick={() => toggleActive(m.id, m.is_active)}
                    >
                      {toggling === m.id ? '…' : m.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
