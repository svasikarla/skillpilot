import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Password reset and admin invite flows land here with next=/update-password
      if (next === '/update-password') {
        return NextResponse.redirect(`${origin}/update-password`)
      }

      // Check if the user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()  // null (not error) when user has no member row yet

        if (!member) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // Code exchange failed — tell the user why
    const msg = error.message ?? 'auth_failed'
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`)
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`)
}
