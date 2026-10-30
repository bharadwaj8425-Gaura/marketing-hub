'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { personName, fmtDuration } from '@/lib/constants'
import { todayStr, formatDateTime } from '@/lib/dates'
import { useRunningTimer } from '@/lib/timer'
import TimerButton from './TimerButton'

const inputCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

function secondsOf(e) {
  if (e.duration_seconds != null) return e.duration_seconds
  return 0
}

export default function TaskTime({ taskId, people, currentUser, isManager }) {
  const [supabase] = useState(() => createClient())
  const { entry: running } = useRunningTimer()
  const [entries, setEntries] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [date, setDate] = useState(todayStr())
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])

  // Timer start / stop hone par list dobara laao
  useEffect(() => {
    let off = false
    supabase
      .from('time_entries')
      .select('*')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })
      .then(({ data }) => {
        if (off) return
        setEntries(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [taskId, supabase, running?.id])

  const total = entries.reduce((sum, e) => sum + secondsOf(e), 0)

  async function addManual(e) {
    e.preventDefault()
    setError('')
    const mins = (parseInt(hours || '0', 10) || 0) * 60 + (parseInt(minutes || '0', 10) || 0)
    if (mins <= 0) {
      setError('Enter a duration (hours or minutes).')
      return
    }
    if (mins > 24 * 60) {
      setError('A single entry cannot exceed 24 hours.')
      return
    }
    setBusy(true)
    const start = new Date(`${date}T09:00:00+05:30`)
    const end = new Date(start.getTime() + mins * 60000)
    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        task_id: taskId,
        user_id: currentUser.id,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        note: note.trim() || null,
      })
      .select()
      .single()
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setEntries((x) => [data, ...x].sort((a, b) => b.started_at.localeCompare(a.started_at)))
    setHours('')
    setMinutes('')
    setNote('')
  }

  async function remove(id) {
    if (!confirm('Delete this time entry?')) return
    const { data, error } = await supabase.from('time_entries').delete().eq('id', id).select()
    if (error || !data || data.length === 0) {
      setError('Could not delete.')
      return
    }
    setEntries((x) => x.filter((y) => y.id !== id))
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {isManager ? 'Total time (whole team)' : 'Your total time'}
          </p>
          <p className="text-2xl font-semibold">{fmtDuration(total)}</p>
        </div>
        <TimerButton taskId={taskId} />
      </div>

      <form onSubmit={addManual} className="mt-4 rounded-lg border border-slate-200 p-3">
        <p className="mb-2 text-sm font-medium">Add time manually</p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Date</label>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Hours</label>
            <input type="number" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Minutes</label>
            <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={`${inputCls} w-20`} />
          </div>
          <div className="min-w-[8rem] flex-1">
            <label className="mb-1 block text-xs text-slate-500">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} w-full`} />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 space-y-1.5">
        {loaded && entries.length === 0 && <p className="text-sm text-slate-400">No time entries yet.</p>}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p>
                <span className="font-medium">
                  {e.ended_at ? fmtDuration(secondsOf(e)) : 'Running...'}
                </span>{' '}
                <span className="text-slate-500">
                  · {formatDateTime(e.started_at)}
                  {e.user_id !== currentUser.id && ` · ${personName(peopleById[e.user_id])}`}
                </span>
              </p>
              {e.note && <p className="truncate text-xs text-slate-500">{e.note}</p>}
            </div>
            {e.ended_at && (e.user_id === currentUser.id || isManager) && (
              <button type="button" onClick={() => remove(e.id)} className="shrink-0 text-slate-400 hover:text-red-600">
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
