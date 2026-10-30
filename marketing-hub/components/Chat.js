'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, SendHorizontal, Trash2, Users, Smile } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { personName, isManagerRole } from '@/lib/constants'
import { dayKey, formatTime, todayStr } from '@/lib/dates'
import { safeUrl } from '@/lib/links'
import Avatar from './Avatar'

const QUICK_EMOJI = ['👍', '🔥', '✅', '🙏', '😂', '🎉', '👀', '🚀']
const GROUP_GAP_MS = 5 * 60 * 1000

function channelTitle(c) {
  return c.projects?.name || c.name
}

// Text ke andar ke links ko clickable bana deta hai
function Linkified({ text, mine }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={safeUrl(part)}
        target="_blank"
        rel="noopener noreferrer"
        className={`break-all underline underline-offset-2 ${mine ? 'decoration-white/60' : 'text-indigo-600 decoration-indigo-300'}`}
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function dayLabel(key) {
  if (key === todayStr()) return 'Today'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Chat({ channels, people, currentUser, initialChannelId }) {
  const [supabase] = useState(() => createClient())
  const [activeId, setActiveId] = useState(initialChannelId || channels[0]?.id)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState({}) // channel_id -> count (is session mein)
  const [online, setOnline] = useState(new Set())
  const [typing, setTyping] = useState({}) // user_id -> timestamp
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const activeRef = useRef(activeId)
  const roomRef = useRef(null)
  const lastTypingSent = useRef(0)
  const isManager = isManagerRole(currentUser.role)
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])
  const active = channels.find((c) => c.id === activeId)

  function merge(list) {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]))
      list.forEach((m) => map.set(m.id, m))
      return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at))
    })
  }

  // Sabhi channels ke naye messages + kaun online hai (poore chat page ke liye ek baar)
  useEffect(() => {
    const live = supabase
      .channel('chat-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const m = payload.new
        if (m.channel_id === activeRef.current) {
          merge([m])
        } else if (m.user_id !== currentUser.id) {
          setUnread((u) => ({ ...u, [m.channel_id]: (u[m.channel_id] || 0) + 1 }))
        }
        setTyping((t) => {
          if (!t[m.user_id]) return t
          const n = { ...t }
          delete n[m.user_id]
          return n
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        setMessages((prev) => prev.filter((x) => x.id !== payload.old.id))
      })
      .subscribe()

    const presence = supabase.channel('chat-presence', { config: { presence: { key: currentUser.id } } })
    presence
      .on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(presence.presenceState()))))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') presence.track({ at: Date.now() })
      })

    return () => {
      supabase.removeChannel(live)
      supabase.removeChannel(presence)
    }
  }, [supabase, currentUser.id])

  // Channel badalne par: purane messages laao, typing room join karo, 15 sec ka backup poll
  useEffect(() => {
    if (!activeId) return
    activeRef.current = activeId
    let off = false
    setMessages([])
    setLoading(true)
    setError('')
    setTyping({})
    setUnread((u) => ({ ...u, [activeId]: 0 }))

    supabase
      .from('chat_messages')
      .select('*')
      .eq('channel_id', activeId)
      .order('created_at', { ascending: false })
      .limit(150)
      .then(({ data }) => {
        if (off) return
        setMessages((data ?? []).reverse())
        setLoading(false)
      })

    const room = supabase
      .channel(`typing-${activeId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id && payload.user_id !== currentUser.id) {
          setTyping((t) => ({ ...t, [payload.user_id]: Date.now() }))
        }
      })
      .subscribe()
    roomRef.current = room

    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', activeId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (!off && data) {
        merge(data)
        const ids = new Set(data.map((m) => m.id))
        const oldest = data.length ? data[data.length - 1].created_at : null
        if (oldest) setMessages((prev) => prev.filter((m) => m.created_at < oldest || ids.has(m.id)))
      }
    }, 15000)

    return () => {
      off = true
      clearInterval(poll)
      supabase.removeChannel(room)
      roomRef.current = null
    }
  }, [activeId, supabase, currentUser.id])

  // Purane "typing..." hata do
  useEffect(() => {
    const t = setInterval(() => {
      setTyping((prev) => {
        const now = Date.now()
        const next = Object.fromEntries(Object.entries(prev).filter(([, ts]) => now - ts < 4000))
        return Object.keys(next).length === Object.keys(prev).length ? prev : next
      })
    }, 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, activeId])

  function onType(value) {
    setText(value)
    const now = Date.now()
    if (value && roomRef.current && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now
      roomRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: currentUser.id } })
    }
  }

  async function send(e) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ channel_id: activeId, user_id: currentUser.id, body })
      .select()
      .single()
    setSending(false)
    if (error) {
      setError(error.message)
      return
    }
    merge([data])
    setText('')
    lastTypingSent.current = 0
    inputRef.current?.focus()
  }

  async function remove(id) {
    const { data, error } = await supabase.from('chat_messages').delete().eq('id', id).select()
    if (error || !data || data.length === 0) {
      setError('Could not delete the message.')
      return
    }
    setMessages((m) => m.filter((x) => x.id !== id))
  }

  // Din ke hisaab se group, aur ek hi bande ke lagataar messages ek saath
  const groups = []
  messages.forEach((m, i) => {
    const k = dayKey(m.created_at)
    let g = groups[groups.length - 1]
    if (!g || g.key !== k) {
      g = { key: k, items: [] }
      groups.push(g)
    }
    const prev = messages[i - 1]
    const startsRun =
      !prev ||
      prev.user_id !== m.user_id ||
      dayKey(prev.created_at) !== k ||
      new Date(m.created_at) - new Date(prev.created_at) > GROUP_GAP_MS
    g.items.push({ ...m, startsRun })
  })

  const typingNames = Object.keys(typing).map((id) => personName(peopleById[id]).split(' ')[0])
  const onlinePeople = people.filter((p) => online.has(p.id))
  const sortedPeople = [...people].sort((a, b) => Number(online.has(b.id)) - Number(online.has(a.id)))

  return (
    <div className="mx-auto flex h-[calc(100dvh-6.5rem)] max-w-7xl overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Channel list (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60 md:flex">
        <div className="px-4 pb-3 pt-5">
          <h2 className="text-lg font-bold tracking-tight">Team Chat</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {onlinePeople.length} online
          </p>
        </div>
        <p className="px-4 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Channels</p>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {channels.map((c) => {
            const isActive = c.id === activeId
            const n = unread[c.id] || 0
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? 'bg-white font-semibold text-indigo-700 shadow-sm ring-1 ring-slate-200'
                    : n
                      ? 'font-semibold text-slate-900 hover:bg-white'
                      : 'text-slate-600 hover:bg-white'
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: c.projects?.color || '#6366f1' }}
                >
                  <Hash size={13} strokeWidth={2.5} />
                </span>
                <span className="flex-1 truncate">{channelTitle(c)}</span>
                {n > 0 && !isActive && (
                  <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{n}</span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium md:hidden"
          >
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                # {channelTitle(c)}
                {unread[c.id] ? ` (${unread[c.id]})` : ''}
              </option>
            ))}
          </select>
          <div className="hidden min-w-0 items-center gap-2.5 md:flex">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: active?.projects?.color || '#6366f1' }}
            >
              <Hash size={16} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-bold leading-tight">{active ? channelTitle(active) : ''}</h1>
              <p className="text-xs text-slate-400">{active?.project_id ? 'Space channel' : 'Poori team'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMembers((v) => !v)}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            title="Members"
          >
            <span className="hidden -space-x-2 sm:flex">
              {sortedPeople.slice(0, 4).map((p) => (
                <Avatar key={p.id} name={personName(p)} id={p.id} size={28} />
              ))}
            </span>
            <span className="hidden sm:inline">{people.length}</span>
            <Users size={16} className="sm:hidden" />
          </button>
        </header>

        <div className="relative flex min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/40 to-white px-3 py-4 sm:px-6">
            {loading && (
              <div className="space-y-4 pt-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex animate-pulse gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-slate-100" />
                      <div className="h-3 w-2/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">👋</span>
                <p className="mt-3 font-semibold">Welcome to #{active ? channelTitle(active) : ''}</p>
                <p className="mt-1 text-sm text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            )}

            {groups.map((g) => (
              <div key={g.key}>
                <div className="sticky top-0 z-10 my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200/70" />
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                    {dayLabel(g.key)}
                  </span>
                  <div className="h-px flex-1 bg-slate-200/70" />
                </div>
                {g.items.map((m) => {
                  const mine = m.user_id === currentUser.id
                  const who = personName(peopleById[m.user_id])
                  return (
                    <div
                      key={m.id}
                      className={`group flex items-end gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${
                        m.startsRun ? 'mt-3' : 'mt-0.5'
                      }`}
                    >
                      <div className="w-8 shrink-0">
                        {!mine && m.startsRun && (
                          <Avatar name={who} id={m.user_id} size={32} online={online.has(m.user_id)} />
                        )}
                      </div>
                      <div className={`flex max-w-[82%] flex-col md:max-w-[68%] ${mine ? 'items-end' : 'items-start'}`}>
                        {m.startsRun && (
                          <p className={`mb-1 flex items-baseline gap-2 px-1 text-xs ${mine ? 'flex-row-reverse' : ''}`}>
                            <span className="font-semibold text-slate-700">{mine ? 'You' : who}</span>
                            <span className="text-slate-400">{formatTime(m.created_at)}</span>
                          </p>
                        )}
                        <div className={`flex items-center gap-1.5 ${mine ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`rounded-2xl px-3.5 py-2 text-[14.5px] leading-relaxed ${
                              mine
                                ? `bg-indigo-600 text-white ${m.startsRun ? 'rounded-tr-md' : ''}`
                                : `bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80 ${m.startsRun ? 'rounded-tl-md' : ''}`
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              <Linkified text={m.body} mine={mine} />
                            </p>
                          </div>
                          {(mine || isManager) && (
                            <button
                              onClick={() => remove(m.id)}
                              title="Delete"
                              className="rounded-lg p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Members panel */}
          {showMembers && (
            <aside className="absolute inset-y-0 right-0 z-20 w-64 shrink-0 overflow-y-auto border-l border-slate-100 bg-white p-4 shadow-xl lg:static lg:shadow-none">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Members · {onlinePeople.length} online
              </p>
              <ul className="mt-3 space-y-2.5">
                {sortedPeople.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <Avatar name={personName(p)} id={p.id} size={30} online={online.has(p.id)} />
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${online.has(p.id) ? 'font-medium' : 'text-slate-500'}`}>
                        {personName(p)}
                        {p.id === currentUser.id && <span className="text-slate-400"> (you)</span>}
                      </p>
                      <p className="text-[11px] capitalize text-slate-400">{p.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        <form onSubmit={send} className="border-t border-slate-100 bg-white px-3 pb-3 pt-2 sm:px-5">
          <div className="h-5 px-1 text-xs text-slate-400">
            {typingNames.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400" />
                </span>
                {typingNames.slice(0, 2).join(', ')}
                {typingNames.length > 2 ? ` +${typingNames.length - 2}` : ''} typing...
              </span>
            )}
          </div>
          {error && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-1.5 text-sm text-rose-600">{error}</p>}
          <div className="relative flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-1.5 transition focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(99_102_241/0.10)]">
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Emoji"
            >
              <Smile size={19} />
            </button>
            {showEmoji && (
              <div className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-lg animate-pop">
                {QUICK_EMOJI.map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => {
                      onType(text + e)
                      setShowEmoji(false)
                      inputRef.current?.focus()
                    }}
                    className="rounded-lg p-1.5 text-lg hover:bg-slate-100"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder={`Message #${active ? channelTitle(active) : ''}`}
              className="max-h-32 min-h-[2.5rem] flex-1 resize-none !border-0 !bg-transparent px-1 py-2 text-sm !shadow-none outline-none"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40"
              title="Send (Enter)"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
          <p className="mt-1.5 hidden px-1 text-[11px] text-slate-400 sm:block">
            Enter to send · Shift+Enter for a new line · Pasted Drive / YouTube links become clickable
          </p>
        </form>
      </section>
    </div>
  )
}
