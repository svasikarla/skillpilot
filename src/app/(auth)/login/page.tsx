'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      router.push('/feed')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Check your email to confirm your account, then sign in.')
    }
    setLoading(false)
  }

  const fields = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            className="pl-9 h-10 bg-muted/40 border-border focus:bg-card"
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password" type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            className="pl-9 h-10 bg-muted/40 border-border focus:bg-card"
            required minLength={6}
          />
        </div>
      </div>
      <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {submitLabel}
      </Button>
    </form>
  )

  return (
    <div className="w-full max-w-sm space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>

      {/* Mobile logo */}
      <Link href="/" className="flex lg:hidden items-center gap-2.5 justify-center hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">AI</span>
        </div>
        <span className="font-semibold">AI/ML Freelance Hub</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your private workspace</p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="w-full h-9 bg-muted/60">
          <TabsTrigger value="login" className="flex-1 text-xs font-medium">Sign in</TabsTrigger>
          <TabsTrigger value="register" className="flex-1 text-xs font-medium">Create account</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="login">{fields(handleLogin, 'Sign in')}</TabsContent>
          <TabsContent value="register">{fields(handleRegister, 'Create account')}</TabsContent>
        </div>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Private group tool · By invite only
      </p>
    </div>
  )
}
