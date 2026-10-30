'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { personName } from '@/lib/constants'
import { formatDateTime } from '@/lib/dates'

// Task ki chat: comments, aur reviewer ke liye Approve / Request changes buttons
export default function TaskComments({
  taskId,
  people,
  currentUser,
  isManager,
  canReview,
  taskStatus,
  onSetStatus,
}) {
  const [supabase] = useState(() => createClient())
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])

  useEffect(() => {
    let off = false
    supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (off) return
        setComments(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [taskId, supabase])

  async function insertComment(body) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: currentUser.id, body })
      .select()
      .single()
    if (error) {
      setError(error.message)
      return null
    }
    setComments((c) => [...c, data])
    return data
  }

  async function add(e) {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setError('')
    setBusy(true)
    const c = await insertComment(body)
    setBusy(false)
    if (c) setText('')
  }

  async function approve() {
    setError('')
    setBusy(true)
    const ok = await onSetStatus('approved')
    if (ok) await insertComment('✅ Approved')
    setBusy(false)
  }

  async function requestChanges() {
    const body = text.trim()
    if (!body) {
      setError('To request changes, first add a comment below describing what needs to change.')
      return
    }
    setError('')
    setBusy(true)
    const c = await insertComment('🔁 Changes requested: ' + body)
    if (c) {
      const ok = await onSetStatus('changes_required')
      if (ok) setText('')
    }
    setBusy(false)
  }

  async function remove(id) {
    const { data, error } = await supabase.from('comments').delete().eq('id', id).select()
    if (error || !data || data.length === 0) {
      setError('Could not delete the comment.')
      return
    }
    setComments((c) => c.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="space-y-3">
        {loaded && comments.length === 0 && (
          <p className="text-sm text-slate-400">No comments yet.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">{personName(peopleById[c.user_id])}</span>
              <span className="flex items-center gap-3">
                {formatDateTime(c.created_at)}
                {(c.user_id === currentUser.id || isManager) && (
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    delete
                  </button>
                )}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-3">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {canReview && taskStatus === 'review' && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={approve}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                >
                  ✓ Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={requestChanges}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  ↩ Request changes
                </button>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40"
          >
            Add comment
          </button>
        </div>
      </form>
    </div>
  )
}
