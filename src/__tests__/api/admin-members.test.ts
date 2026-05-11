import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient:      vi.fn(),
  createAdminClient: vi.fn(),
}))

import { GET, POST } from '@/app/api/admin/members/route'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const ADMIN_USER   = { id: 'admin-1', email: 'admin@test.com' }
const MEMBER_USER  = { id: 'user-1',  email: 'user@test.com' }

// ─── Mock builders ───────────────────────────────────────────────────────────

/** Mock for createClient() — used by requireAdmin() */
function makeAuthClient(user: unknown, role: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: role !== null ? { role } : null,
            error: null,
          }),
        }),
      }),
    }),
  }
}

/** Mock for createAdminClient() used by GET — lists members */
function makeAdminListClient(members: unknown[], queryError: unknown = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: members, error: queryError }),
      }),
    }),
    auth: { admin: { inviteUserByEmail: vi.fn() } },
  }
}

/** Mock for createAdminClient() used by POST — invite */
function makeAdminInviteClient(inviteError: unknown = null) {
  const inviteMock = vi.fn().mockResolvedValue({ error: inviteError })
  return {
    from: vi.fn(),
    auth: { admin: { inviteUserByEmail: inviteMock } },
    _inviteMock: inviteMock,
  }
}

// ─── GET /api/admin/members ───────────────────────────────────────────────────

describe('GET /api/admin/members — auth gate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when no authenticated user', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(null, null) as never)

    const res  = await GET()
    const json = await res.json() as { error: string }

    expect(res.status).toBe(403)
    expect(json.error).toBe('Forbidden')
  })

  it('returns 403 when authenticated user has role "member"', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(MEMBER_USER, 'member') as never)

    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns 200 with members array when role is "admin"', async () => {
    const members = [
      { id: '1', email: 'a@test.com', role: 'admin',  is_active: true, created_at: '2024-01-01' },
      { id: '2', email: 'b@test.com', role: 'member', is_active: true, created_at: '2024-01-02' },
    ]
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(makeAdminListClient(members) as never)

    const res  = await GET()
    const json = await res.json() as { members: unknown[] }

    expect(res.status).toBe(200)
    expect(json.members).toEqual(members)
  })

  it('returns 200 with empty array when no members exist', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(makeAdminListClient([]) as never)

    const res  = await GET()
    const json = await res.json() as { members: unknown[] }

    expect(res.status).toBe(200)
    expect(json.members).toHaveLength(0)
  })

  it('returns 500 when the admin query fails', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(
      makeAdminListClient([], { message: 'connection refused' }) as never
    )

    const res  = await GET()
    const json = await res.json() as { error: string }

    expect(res.status).toBe(500)
    expect(json.error).toBe('connection refused')
  })
})

// ─── POST /api/admin/members ──────────────────────────────────────────────────

describe('POST /api/admin/members — invite', () => {
  beforeEach(() => vi.clearAllMocks())

  function makePostRequest(body: unknown) {
    return new Request('http://localhost/api/admin/members', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
  }

  it('returns 403 when caller is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(null, null) as never)

    const res = await POST(makePostRequest({ email: 'invite@test.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when caller is a regular member', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(MEMBER_USER, 'member') as never)

    const res = await POST(makePostRequest({ email: 'invite@test.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 for a non-email string', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)

    const res = await POST(makePostRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing email field', async () => {
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)

    const res = await POST(makePostRequest({}))
    expect(res.status).toBe(400)
  })

  it('calls inviteUserByEmail with the correct email and redirectTo', async () => {
    const adminClient = makeAdminInviteClient()
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(adminClient as never)

    const res  = await POST(makePostRequest({ email: 'newmember@test.com' }))
    const json = await res.json() as { ok: boolean }

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(adminClient._inviteMock).toHaveBeenCalledOnce()
    expect(adminClient._inviteMock).toHaveBeenCalledWith(
      'newmember@test.com',
      expect.objectContaining({
        redirectTo: expect.stringContaining('/api/auth/callback'),
      })
    )
  })

  it('redirectTo contains /update-password as the next param', async () => {
    const adminClient = makeAdminInviteClient()
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(adminClient as never)

    await POST(makePostRequest({ email: 'newmember@test.com' }))

    const [, opts] = adminClient._inviteMock.mock.calls[0] as [string, { redirectTo: string }]
    expect(opts.redirectTo).toContain('/update-password')
  })

  it('returns 500 when Supabase invite returns an error', async () => {
    const adminClient = makeAdminInviteClient({ message: 'User already registered' })
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(adminClient as never)

    const res  = await POST(makePostRequest({ email: 'existing@test.com' }))
    const json = await res.json() as { error: string }

    expect(res.status).toBe(500)
    expect(json.error).toBe('User already registered')
  })

  it('uses NEXT_PUBLIC_SITE_URL env var in the redirectTo when set', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://app.skillpilot.com'
    const adminClient = makeAdminInviteClient()
    vi.mocked(createClient).mockResolvedValue(makeAuthClient(ADMIN_USER, 'admin') as never)
    vi.mocked(createAdminClient).mockResolvedValue(adminClient as never)

    await POST(makePostRequest({ email: 'site@test.com' }))

    const [, opts] = adminClient._inviteMock.mock.calls[0] as [string, { redirectTo: string }]
    expect(opts.redirectTo).toContain('https://app.skillpilot.com')

    delete process.env.NEXT_PUBLIC_SITE_URL
  })
})
