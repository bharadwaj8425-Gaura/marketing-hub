'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { personName, statusOf } from '@/lib/constants'
import { formatDateTime, formatDate } from '@/lib/dates'

function describe(a) {
  const [from, to] = (a.detail || '').split('>')
  switch (a.action) {
    case 'created':
      return 'created the task'
    case 'status':
      return `changed status: ${statusOf(from).label} → ${statusOf(to).label}`
    case 'assignee':
      return `changed assignee: ${from} → ${to}`
    case 'reviewer':
      return `changed reviewer: ${from} → ${to}`
    case 'due_date':
      return `changed due date: ${from === 'none' ? 'none' : formatDate(from)} → ${
        to === 'none' ? 'none' : formatDate(to)
      }`
    default:
      return a.action
  }
}

// Task ki poori history: kisne kab kya badla
export default function TaskActivity({ taskId, people }) {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])

  useEffect(() => {
    let off = false
    supabase
      .from('task_activity')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (off) return
        setItems(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [taskId, supabase])

  if (loaded && items.length === 0) {
    return <p className="text-sm text-slate-400">No activity yet.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="flex items-start gap-2 text-sm">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-300" />
          <span>
            <span className="font-medium">{personName(peopleById[a.user_id])}</span> {describe(a)}
            <span className="block text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
