'use client'

import { useEffect, useState } from 'react'
import { Play, Square } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRunningTimer, useElapsed, startTimer, stopTimer } from '@/lib/timer'
import { fmtClock, fmtDuration } from '@/lib/constants'

// Big timer panel inside the task drawer
export default function TaskTimerBox({ taskId, estHours }) {
  const [supabase] = useState(() => createClient())
  const { entry } = useRunningTimer()
  const running = entry?.task_id === taskId
  const live = useElapsed(running ? entry.started_at : null)
  const [logged, setLogged] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function load() {
    const { data } = await supabase.from('time_entries').select('duration_seconds, ended_at').eq('task_id', taskId)
    setLogged((data ?? []).filter((e) => e.ended_at).reduce((s, e) => s + (e.duration_seconds || 0), 0))
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, running])

  async function toggle() {
    setErr('')
    if (!running && entry && !confirm(`A timer is running on "${entry.tasks?.title ?? 'another task'}". Stop it and start this one?`)) return
    setBusy(true)
    const { error } = running ? await stopTimer() : await startTimer(taskId)
    setBusy(false)
    if (error) setErr(error.message)
  }

  const total = logged + (running ? live : 0)
  const est = Number(estHours) || 0
  const pct = est ? Math.min(100, (total / (est * 3600)) * 100) : 0

  return (
    <div className="mt-4 rounded-lg bg-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] text-slate-500">Time on this task{running ? ' · running' : ''}</p>
          <p className="font-mono text-[30px] font-semibold leading-tight tabular-nums">{fmtClock(total)}</p>
          <p className="text-[12.5px] text-slate-500">
            {fmtDuration(total)} logged{est ? ` of ${est}h estimate` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
            running ? 'bg-[#b42318] hover:bg-[#9a1e14]' : 'bg-indigo-600'
          }`}
        >
          {running ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          {running ? 'Stop timer' : 'Start timer'}
        </button>
      </div>
      {est > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-[#b42318]' : 'bg-indigo-600'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {err && <p className="mt-2 text-[12px] text-[#b42318]">{err}</p>}
    </div>
  )
}
