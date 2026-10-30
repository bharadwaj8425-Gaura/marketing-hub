'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LINK_KINDS,
  kindOf,
  normalizeUrl,
  detectLinkKind,
  youtubeId,
  safeUrl,
} from '@/lib/links'

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

// Video / Drive / script / thumbnail links. Bade videos yahin Drive link se daalo.
export default function TaskLinks({ taskId, currentUser, isManager }) {
  const [supabase] = useState(() => createClient())
  const [links, setLinks] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState('other')
  const [kindTouched, setKindTouched] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let off = false
    supabase
      .from('task_links')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (off) return
        setLinks(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [taskId, supabase])

  function onUrlChange(v) {
    setUrl(v)
    if (!kindTouched) {
      const n = normalizeUrl(v)
      setKind(n ? detectLinkKind(n) : 'other')
    }
  }

  async function add(e) {
    e.preventDefault()
    setError('')
    const clean = normalizeUrl(url)
    if (!clean) {
      setError('Please enter a valid link starting with https://')
      return
    }
    setBusy(true)
    const { data, error } = await supabase
      .from('task_links')
      .insert({
        task_id: taskId,
        label: label.trim() || kindOf(kind).label,
        kind,
        url: clean,
        created_by: currentUser.id,
      })
      .select()
      .single()
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setLinks((l) => [...l, data])
    setUrl('')
    setLabel('')
    setKind('other')
    setKindTouched(false)
  }

  async function remove(id) {
    const { data, error } = await supabase.from('task_links').delete().eq('id', id).select()
    if (error || !data || data.length === 0) {
      setError('Could not delete the link. Only the person who added it or a manager can delete it.')
      return
    }
    setLinks((l) => l.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="space-y-2">
        {loaded && links.length === 0 && (
          <p className="text-sm text-slate-400">
            No links yet. Add a YouTube, Google Drive, script or thumbnail link below.
          </p>
        )}
        {links.map((l) => {
          const k = kindOf(l.kind)
          const yt = l.kind === 'youtube' ? youtubeId(l.url) : null
          return (
            <div
              key={l.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
            >
              {yt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://img.youtube.com/vi/${yt}/mqdefault.jpg`}
                  alt=""
                  className="h-12 w-20 shrink-0 rounded object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl">
                  {k.icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{l.label}</p>
                <p className="truncate text-xs text-slate-500">
                  {k.label} · {l.url}
                </p>
              </div>
              <a
                href={safeUrl(l.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Open
              </a>
              {(l.created_by === currentUser.id || isManager) && (
                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  className="shrink-0 text-sm text-slate-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={add} className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3">
        <input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="Paste a link (YouTube, Google Drive, Vimeo...)"
          className={inputCls}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional), e.g. Raw footage"
            className={inputCls}
          />
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value)
              setKindTouched(true)
            }}
            className={inputCls}
          >
            {LINK_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.icon} {k.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy || !url.trim()}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40"
          >
            Add link
          </button>
        </div>
      </form>
    </div>
  )
}
