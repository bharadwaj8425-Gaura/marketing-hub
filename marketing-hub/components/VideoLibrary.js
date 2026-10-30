'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Trash2, Loader2, FileVideo, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fmtSize } from '@/lib/constants'
import { formatDate } from '@/lib/dates'
import Modal from './Modal'

const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50

export const VIDEO_STATUSES = [
  { value: 'raw', label: 'Raw', badge: 'bg-[#e2e8e5] text-[#55645f]' },
  { value: 'edited', label: 'Edited', badge: 'bg-[#fbebcb] text-[#8f5a0b]' },
  { value: 'final', label: 'Final', badge: 'bg-[#e6f0cf] text-[#4d7c0f]' },
  { value: 'published', label: 'Published', badge: 'bg-[#d6ede6] text-[#0b6e5b]' },
]
const vStatus = (v) => VIDEO_STATUSES.find((s) => s.value === v) || VIDEO_STATUSES[0]

const LINK_STYLE = {
  youtube: 'text-[#c0301b]',
  drive: 'text-[#4d7c0f]',
  doc: 'text-[#1f5fa8]',
  podcast: 'text-[#6b5b95]',
  vimeo: 'text-[#0f8b9e]',
  other: 'text-slate-500',
  file: 'text-slate-600',
}

export function linkType(url) {
  const u = String(url).toLowerCase()
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('docs.google.com')) return 'doc'
  if (u.includes('drive.google.com')) return 'drive'
  if (u.includes('spotify.com') || u.includes('podcasts.apple.com') || u.includes('anchor.fm')) return 'podcast'
  if (u.includes('vimeo.com')) return 'vimeo'
  return 'other'
}

function LinkChip({ type, label, href, onClick }) {
  const cls = 'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[12.5px] hover:border-slate-400'
  const inner = (
    <>
      <span className={`font-mono text-[10.5px] font-bold uppercase ${LINK_STYLE[type] || LINK_STYLE.other}`}>{type}</span>
      <span className="max-w-[140px] truncate">{label}</span>
    </>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={(e) => e.stopPropagation()}>
      {inner}
    </a>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  )
}

const EMPTY = {
  title: '',
  code: '',
  guest: '',
  media: 'video',
  project_id: '',
  status: 'raw',
  version: 1,
  length: '',
  publish_date: '',
  views: '',
  links: [],
}

function VideoForm({ video, projects, currentUser, canEdit, onSaved, onDeleted, onClose }) {
  const [supabase] = useState(() => createClient())
  const [f, setF] = useState(() => ({ ...EMPTY, ...(video || {}), publish_date: video?.publish_date ?? '', views: video?.views ?? '' }))
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const input = 'h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm disabled:bg-slate-50'
  const label = 'mb-1 block text-[12.5px] text-slate-500'

  function addLink() {
    const url = newLink.url.trim()
    if (!/^https?:\/\//i.test(url)) return setError('Links must start with https://')
    setError('')
    const type = linkType(url)
    set('links', [...(f.links || []), { label: newLink.label.trim() || type[0].toUpperCase() + type.slice(1), type, url }])
    setNewLink({ label: '', url: '' })
  }

  async function save(e) {
    e.preventDefault()
    if (!f.title.trim()) return setError('Title is required.')
    setBusy(true)
    setError('')
    let filePatch = {}
    if (file) {
      if (file.size > MAX_MB * 1024 * 1024) {
        setBusy(false)
        return setError(`File is larger than ${MAX_MB} MB. Upload it to Google Drive and paste the link instead.`)
      }
      const path = `videos/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, '_')}`
      const { error: upErr } = await supabase.storage.from('task-files').upload(path, file, { contentType: file.type || undefined })
      if (upErr) {
        setBusy(false)
        return setError(`Upload failed: ${upErr.message}`)
      }
      filePatch = { file_path: path, file_name: file.name, file_size: file.size }
    }
    const body = {
      title: f.title.trim(),
      code: f.code.trim() || null,
      guest: f.guest.trim() || null,
      media: f.media,
      project_id: f.project_id || null,
      status: f.status,
      version: Number(f.version) || 1,
      length: String(f.length || '').trim() || null,
      publish_date: f.publish_date || null,
      views: f.views === '' || f.views === null ? null : Number(f.views),
      links: f.links || [],
      updated_at: new Date().toISOString(),
      ...filePatch,
    }
    const res = video
      ? await supabase.from('videos').update(body).eq('id', video.id).select().single()
      : await supabase.from('videos').insert({ ...body, created_by: currentUser.id }).select().single()
    setBusy(false)
    if (res.error) return setError(res.error.message)
    onSaved(res.data)
  }

  async function remove() {
    if (!confirm('Delete this entry from the library?')) return
    const { data, error } = await supabase.from('videos').delete().eq('id', video.id).select()
    if (error || !data?.length) return setError('Only the person who added it or a manager can delete it.')
    if (video.file_path) await supabase.storage.from('task-files').remove([video.file_path])
    onDeleted(video.id)
  }

  return (
    <Modal variant="drawer" header={video ? 'Video library / Edit' : 'Video library / Add'} onClose={onClose}>
      <form onSubmit={save}>
        <input
          autoFocus={!video}
          disabled={!canEdit}
          value={f.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Title, e.g. Ep 42: Mutual Funds vs SIP"
          className="w-full !border-0 !bg-transparent p-0 font-display text-[22px] font-bold !shadow-none outline-none placeholder:text-slate-300"
        />
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
          <div>
            <label className={label}>Code</label>
            <input disabled={!canEdit} value={f.code ?? ''} onChange={(e) => set('code', e.target.value)} placeholder="EP 42" className={input} />
          </div>
          <div>
            <label className={label}>Type</label>
            <select disabled={!canEdit} value={f.media} onChange={(e) => set('media', e.target.value)} className={input}>
              <option value="video">Video</option>
              <option value="audio">Podcast / audio</option>
              <option value="shorts">Shorts batch</option>
            </select>
          </div>
          <div>
            <label className={label}>Space</label>
            <select disabled={!canEdit} value={f.project_id ?? ''} onChange={(e) => set('project_id', e.target.value)} className={input}>
              <option value="">-</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Status</label>
            <select disabled={!canEdit} value={f.status} onChange={(e) => set('status', e.target.value)} className={input}>
              {VIDEO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Version</label>
            <input type="number" min="1" disabled={!canEdit} value={f.version} onChange={(e) => set('version', e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Length</label>
            <input disabled={!canEdit} value={f.length ?? ''} onChange={(e) => set('length', e.target.value)} placeholder="24:18" className={input} />
          </div>
          <div>
            <label className={label}>Guest / host</label>
            <input disabled={!canEdit} value={f.guest ?? ''} onChange={(e) => set('guest', e.target.value)} placeholder="Host only" className={input} />
          </div>
          <div>
            <label className={label}>Publish date</label>
            <input type="date" disabled={!canEdit} value={f.publish_date ?? ''} onChange={(e) => set('publish_date', e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Views</label>
            <input type="number" min="0" disabled={!canEdit} value={f.views ?? ''} onChange={(e) => set('views', e.target.value)} className={input} />
          </div>
        </div>

        <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Video links</h3>
        <div className="flex flex-wrap gap-1.5">
          {(f.links || []).map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <LinkChip type={l.type} label={l.label} href={l.url} />
              {canEdit && (
                <button type="button" onClick={() => set('links', f.links.filter((_, j) => j !== i))} className="text-slate-400 hover:text-[#b42318]">
                  <X size={13} />
                </button>
              )}
            </span>
          ))}
          {(f.links || []).length === 0 && <p className="text-sm text-slate-400">No links yet.</p>}
        </div>
        {canEdit && (
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={newLink.label} onChange={(e) => setNewLink((x) => ({ ...x, label: e.target.value }))} placeholder="Label, e.g. Raw footage" className={`${input} !w-40`} />
            <input
              value={newLink.url}
              onChange={(e) => setNewLink((x) => ({ ...x, url: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
              placeholder="Paste YouTube / Drive / Docs / Spotify link"
              className={`${input} min-w-[200px] flex-1`}
            />
            <button type="button" onClick={addLink} className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50">
              Add link
            </button>
          </div>
        )}

        <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">File</h3>
        {video?.file_name && !file && (
          <p className="mb-2 flex items-center gap-2 text-sm">
            <FileVideo size={15} className="text-slate-500" /> {video.file_name}{' '}
            <span className="text-slate-400">{fmtSize(video.file_size)}</span>
          </p>
        )}
        {canEdit && (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm hover:border-indigo-400">
            <Upload size={17} className="text-indigo-600" />
            <span className="flex-1">
              {file ? `${file.name} (${fmtSize(file.size)})` : video?.file_name ? 'Replace file' : 'Choose a video or audio file'}
              <span className="block text-[12px] text-slate-500">Up to {MAX_MB} MB. For bigger files use a Drive link above.</span>
            </span>
            <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        )}

        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          {video && canEdit && (
            <button type="button" onClick={remove} className="mr-auto flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-[#b42318] hover:bg-red-50">
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="h-9 rounded-md border border-slate-300 px-4 text-sm hover:bg-slate-50">
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          {canEdit && (
            <button disabled={busy} className="flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy && file ? 'Uploading...' : video ? 'Save changes' : 'Add to library'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default function VideoLibrary({ initialVideos, projects, currentUser, isManager, setupError }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [videos, setVideos] = useState(initialVideos)
  const [space, setSpace] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(null) // null | 'new' | video
  const [err, setErr] = useState('')
  const fileRef = useRef(null)
  const projectsById = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects])

  const list = videos.filter((v) => (!space || v.project_id === space) && (!status || v.status === status))

  async function openFile(v) {
    const { data, error } = await supabase.storage.from('task-files').createSignedUrl(v.file_path, 600)
    if (error) return setErr(`Could not open file: ${error.message}`)
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const sel = 'h-9 rounded-md border border-slate-300 px-2.5 text-sm'

  return (
    <div className="mx-auto max-w-[1240px]">
      <h1 className="text-2xl">Video and podcast library</h1>
      <p className="text-sm text-slate-500">Every episode in one place: status, versions, files and all the links.</p>

      {setupError && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">{setupError}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3.5">
        <Upload size={22} className="text-indigo-600" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">Add a video or podcast session</p>
          <p className="text-[12.5px] text-slate-500">
            Upload a file up to {MAX_MB} MB, or add Drive / YouTube links for longer recordings.
          </p>
        </div>
        <button
          onClick={() => setOpen('new')}
          disabled={!!setupError}
          className="flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus size={16} /> Add entry
        </button>
        <input ref={fileRef} type="file" className="hidden" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <select value={space} onChange={(e) => setSpace(e.target.value)} className={`${sel} w-56`}>
          <option value="">All spaces</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
          <option value="">Any status</option>
          {VIDEO_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {err && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      <div className="mt-3 overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-200 text-[11.5px] uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Space</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ver.</th>
              <th className="px-4 py-3">Length</th>
              <th className="px-4 py-3">Video links</th>
              <th className="px-4 py-3">Publish date</th>
              <th className="px-4 py-3 text-right">Views</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  {videos.length === 0 ? 'No entries yet. Click "Add entry" to add your first video or podcast.' : 'Nothing matches these filters.'}
                </td>
              </tr>
            )}
            {list.map((v) => {
              const p = projectsById[v.project_id]
              const st = vStatus(v.status)
              return (
                <tr key={v.id} onClick={() => setOpen(v)} className="cursor-pointer border-t border-slate-100 align-middle hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{v.title}</p>
                    <p className="text-[12px] text-slate-500">
                      {[v.code, v.guest, v.media === 'audio' ? 'audio' : v.media === 'shorts' ? 'shorts' : null].filter(Boolean).join(' · ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {p ? (
                      <span className="flex items-center gap-2">
                        <i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                        {p.name}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${st.badge}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">v{v.version}</td>
                  <td className="px-4 py-3 font-mono">{v.length || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[320px] flex-wrap gap-1">
                      {(v.links || []).map((l, i) => (
                        <LinkChip key={i} type={l.type} label={l.label} href={l.url} />
                      ))}
                      {v.file_path && (
                        <LinkChip
                          type="file"
                          label={v.file_name}
                          onClick={(e) => {
                            e.stopPropagation()
                            openFile(v)
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{v.publish_date ? formatDate(v.publish_date) : '-'}</td>
                  <td className="px-4 py-3 text-right font-mono">{v.views != null ? Number(v.views).toLocaleString('en-IN') : '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <VideoForm
          key={open === 'new' ? 'new' : open.id}
          video={open === 'new' ? null : open}
          projects={projects}
          currentUser={currentUser}
          canEdit={open === 'new' || isManager || open.created_by === currentUser.id}
          onSaved={(v) => {
            setVideos((list) => (list.some((x) => x.id === v.id) ? list.map((x) => (x.id === v.id ? v : x)) : [v, ...list]))
            setOpen(null)
            router.refresh()
          }}
          onDeleted={(id) => {
            setVideos((list) => list.filter((x) => x.id !== id))
            setOpen(null)
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}
