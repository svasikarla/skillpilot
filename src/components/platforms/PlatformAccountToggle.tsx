'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  platformId: number
  memberId:   string
  hasAccount: boolean
}

export default function PlatformAccountToggle({ platformId, memberId, hasAccount: initial }: Props) {
  const [hasAccount, setHasAccount] = useState(initial)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const next = !hasAccount

    const { error } = await supabase
      .from('member_platform_accounts')
      .upsert({
        member_id:     memberId,
        platform_id:   platformId,
        has_account:   next,
        interest_level: next ? 'have_account' : 'want_to_try',
      }, { onConflict: 'member_id,platform_id' })

    if (error) {
      toast.error('Failed to update account status')
    } else {
      setHasAccount(next)
    }
    setLoading(false)
  }

  return (
    <Button
      variant={hasAccount ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="text-xs h-7 px-2.5"
    >
      {hasAccount ? 'Have account ✓' : 'Have account?'}
    </Button>
  )
}
