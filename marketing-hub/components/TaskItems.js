'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Subtasks or checklist items for a task
export default function TaskItems({ taskId, kind, title, currentUser, isManager, placeholder }) {
  const [supabase] = useState(() => createClient())
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let off = false
    supabase
      .from('task_items')
      .select('*')
      .eq('task_id', taskId)
      .eq('kind', kind)
      .order('position')
      .order('created_at')
      .then(({ data, error }) => {
        if (off) return
        if (error) setError(error.message.includes('task_items') ? 'Run schema_v4.sql in Supabase to enable this.' : error.message)
        setItems(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [supabase, taskId, kind])

  async function add(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setError('')
    const { data, error } = await supabase
      .from('task_items')
      .insert({ task_id: taskId, kind, title: t, position: items.length, created_by: currentUser.id })
      .select()
      .single()
    if (error) return setError(error.message)
    setItems((x) => [...x, data])
    setText('')
  }

  async function toggle(item) {
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))
    const { error } = await supabase.from('task_items').update({ done: !item.done }).eq('id', item.id)
    if (error) {
      setItems((x) => x.map((i) => (i.id === item.id ? item : i)))
      setError(error.message)
    }
  }

  async function remove(item) {
    const { data, error } = await supabase.from('task_items').delete().eq('id', item.id).select()
    if (error || !data?.length) return setError('Only the person who added it or a manager can delete this.')
    setItems((x) => x.filter((i) => i.id !== item.id))
  }

  const done = items.filter((i) => i.done).length

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</h3>
        <span className="text-[12px] text-slate-500">
          {done}/{items.length}
        </span>
      </div>
      {kind === 'check' && items.length > 0 && (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(done / items.length) * 100}%` }} />
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((i) => (
          <li key={i.id} className="group flex items-center gap-2.5 rounded-md px-1 py-1 hover:bg-slate-50">
            <input type="checkbox" checked={i.done} onChange={() => toggle(i)} className="h-4 w-4 shrink-0" />
            <span className={`flex-1 text-[14px] ${i.done ? 'text-slate-400 line-through' : ''}`}>{i.title}</span>
            {(i.created_by === currentUser.id || isManager) && (
              <button
                onClick={() => remove(i)}
                className="rounded p-1 text-slate-300 opacity-0 hover:text-[#b42318] group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {loaded && (
        <form onSubmit={add} className="mt-2 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
          />
          <button className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50">Add</button>
        </form>
      )}
      {error && <p className="mt-1.5 text-[12px] text-[#b42318]">{error}</p>}
    </section>
  )
}
