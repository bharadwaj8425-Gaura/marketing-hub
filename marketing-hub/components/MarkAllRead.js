'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function MarkAllRead({ disabled }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    await createClient().from('notifications').update({ is_read: true }).eq('is_read', false)
    setBusy(false)
    router.refresh()
  }

  return (
    <button
      onClick={run}
      disabled={busy || disabled}
      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
    >
      Mark all as read
    </button>
  )
}
