'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useElapsed } from '@/lib/timer'
import { fmtClock } from '@/lib/constants'

// Live "working for 00:12:34" counter
export function LiveElapsed({ startedAt }) {
  const sec = useElapsed(startedAt)
  return <span className="font-mono tabular-nums">{fmtClock(sec)}</span>
}

// Admin-only role switcher
export function RoleSelect({ userId, role, disabled }) {
  const router = useRouter()
  const [value, setValue] = useState(role)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change(next) {
    setBusy(true)
    setError('')
    const { error } = await createClient().rpc('set_user_role', { p_user: userId, p_role: next })
    setBusy(false)
    if (error) {
      setError(
        error.message.includes('function') ? 'Run schema_v3.sql in Supabase to enable role changes.' : error.message
      )
      return
    }
    setValue(next)
    router.refresh()
  }

  return (
    <span className="inline-flex flex-col items-end">
      <select
        value={value}
        disabled={disabled || busy}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium capitalize text-slate-600 disabled:opacity-60"
      >
        <option value="member">Member</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
      {error && <span className="mt-1 max-w-[12rem] text-right text-[11px] text-rose-600">{error}</span>}
    </span>
  )
}
