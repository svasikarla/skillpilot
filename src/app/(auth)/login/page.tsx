'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sparkles, Loader2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type View = 'login' | 'forgot' | 'forgot-sent'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  // Show errors redirected back from the auth callback (expired link, invalid code, etc.)
  const callbackError = searchParams.get('error')

  const [view,     setView]     = useState<View>('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  // ── Email + password login ──────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/feed')
  }

  // ── Forgot password ─────────────────────────────────────────────────────────
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/update-password`,
    })

    // Always show success — don't leak whether the email exists
    setLoading(false)
    setView('forgot-sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand mark */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 mx-auto">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
            Private · Invite-only
          </p>
        </div>

        <Card>
          {/* ── Login view ─────────────────────────────────────────────────── */}
          {view === 'login' && (
            <>
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-xl font-semibold">AI/ML Freelance Hub</CardTitle>
                <CardDescription>Sign in to your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => { setError(''); setView('forgot') }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {callbackError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      <strong>Link error:</strong> {
                        callbackError === 'invalid_link'
                          ? 'This link is invalid or has already been used.'
                          : callbackError === 'auth_failed'
                          ? 'Sign-in failed. Try requesting a new link.'
                          : callbackError
                      }
                    </div>
                  )}
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  No account? An admin must invite you first.
                </p>
              </CardContent>
            </>
          )}

          {/* ── Forgot password view ────────────────────────────────────────── */}
          {view === 'forgot' && (
            <>
              <CardHeader className="space-y-1">
                <button
                  onClick={() => { setError(''); setView('login') }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to sign in
                </button>
                <CardTitle className="text-xl font-semibold">Reset password</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a reset link.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Sending…' : 'Send reset link'}
                  </Button>
                </form>
              </CardContent>
            </>
          )}

          {/* ── Forgot sent confirmation ─────────────────────────────────────── */}
          {view === 'forgot-sent' && (
            <>
              <CardHeader className="text-center space-y-3">
                <CardTitle className="text-xl font-semibold">Check your inbox</CardTitle>
                <CardDescription>
                  If <strong className="text-foreground">{email}</strong> has an account, a
                  password reset link has been sent. It expires in 1 hour.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setView('login'); setError('') }}
                >
                  Back to sign in
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
