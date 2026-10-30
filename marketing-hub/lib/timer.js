'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Ek hi jagah timer ki state rakhte hain, taaki sidebar, task list aur task
// window sab ek saath update hon.

let supabase
const sb = () => (supabase ||= createClient())

let state = { loaded: false, entry: null }
let loading = null
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn({ ...state }))
}

export function refreshTimer() {
  if (loading) return loading
  loading = (async () => {
    const {
      data: { user },
    } = await sb().auth.getUser()
    if (!user) {
      state = { loaded: true, entry: null }
    } else {
      const { data } = await sb()
        .from('time_entries')
        .select('id, task_id, started_at, tasks(title, project_id)')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .maybeSingle()
      state = { loaded: true, entry: data ?? null }
    }
    emit()
  })().finally(() => {
    loading = null
  })
  return loading
}

export async function startTimer(taskId) {
  const { error } = await sb().rpc('start_timer', { p_task: taskId })
  if (!error) await refreshTimer()
  return { error }
}

export async function stopTimer() {
  const { error } = await sb().rpc('stop_timer')
  if (!error) await refreshTimer()
  return { error }
}

export function resetTimer() {
  state = { loaded: false, entry: null }
  emit()
}

export function useRunningTimer() {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    if (!state.loaded) refreshTimer()
    else setS({ ...state })
    return () => {
      listeners.delete(setS)
    }
  }, [])
  return s
}

// Chalte hue timer ke seconds (har second update hota hai)
export function useElapsed(startedAt) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!startedAt) {
      setSec(0)
      return
    }
    const tick = () =>
      setSec(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return sec
}
