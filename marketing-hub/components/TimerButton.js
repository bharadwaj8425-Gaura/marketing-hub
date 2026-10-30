'use client'

import { useState } from 'react'
import { useRunningTimer, useElapsed, startTimer, stopTimer } from '@/lib/timer'
import { fmtClock } from '@/lib/constants'

// Start / Stop button. Ek banda ek time par sirf ek timer chala sakta hai.
export default function TimerButton({ taskId, compact = false }) {
  const { entry } = useRunningTimer()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const running = entry?.task_id === taskId
  const elapsed = useElapsed(running ? entry.started_at : null)

  async function toggle(e) {
    e.stopPropagation()
    setErr('')
    if (!running && entry) {
      const ok = confirm(
        `A timer is already running on "${entry.tasks?.title ?? 'another task'}".\nStop it and start this one?`
      )
      if (!ok) return
    }
    setBusy(true)
    const { error } = running ? await stopTimer() : await startTimer(taskId)
    setBusy(false)
    if (error) setErr(error.message)
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`whitespace-nowrap rounded-lg font-medium disabled:opacity-60 ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'
        } ${
          running
            ? 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100'
            : 'bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100'
        }`}
      >
        {running ? `⏹ Stop ${fmtClock(elapsed)}` : '▶ Start'}
      </button>
      {err && <span className="mt-1 text-xs text-red-600">{err}</span>}
    </span>
  )
}
