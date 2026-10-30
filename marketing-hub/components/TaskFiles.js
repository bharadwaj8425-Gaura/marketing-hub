'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { personName, fmtSize } from '@/lib/constants'
import { formatDateTime } from '@/lib/dates'

const BUCKET = 'task-files'
// Supabase free plan: 50 MB per file. On Pro, raise the bucket limit (schema_v3.sql) and set NEXT_PUBLIC_MAX_UPLOAD_MB.
const MAX_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50
const MAX_BYTES = MAX_MB * 1024 * 1024

function iconFor(mime = '') {
  if (mime.startsWith('image/')) return '🖼️'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎧'
  if (mime === 'application/pdf') return '📄'
  return '📎'
}

export default function TaskFiles({ taskId, people, currentUser, isManager }) {
  const [supabase] = useState(() => createClient())
  const [files, setFiles] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState([])
  const [preview, setPreview] = useState(null) // { id, url, mime }
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])

  useEffect(() => {
    let off = false
    supabase
      .from('task_files')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (off) return
        setFiles(data ?? [])
        setLoaded(true)
      })
    return () => {
      off = true
    }
  }, [taskId, supabase])

  async function upload(fileList) {
    const list = Array.from(fileList || [])
    if (list.length === 0) return
    setErrors([])
    setUploading(true)
    const errs = []

    for (const file of list) {
      if (file.size > MAX_BYTES) {
        errs.push(
          `${file.name}: larger than ${MAX_MB} MB. For large videos, add a Google Drive link in the Links tab.`
        )
        continue
      }
      const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, '_')
      const path = `${taskId}/${crypto.randomUUID()}-${safe}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false })
      if (upErr) {
        errs.push(`${file.name}: upload failed (${upErr.message})`)
        continue
      }

      const { data, error: dbErr } = await supabase
        .from('task_files')
        .insert({
          task_id: taskId,
          name: file.name,
          path,
          size_bytes: file.size,
          mime: file.type || null,
          uploaded_by: currentUser.id,
        })
        .select()
        .single()
      if (dbErr) {
        await supabase.storage.from(BUCKET).remove([path])
        errs.push(`${file.name}: could not be saved (${dbErr.message})`)
        continue
      }
      setFiles((f) => [data, ...f])
    }

    setErrors(errs)
    setUploading(false)
  }

  async function download(f) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(f.path, 3600, { download: f.name })
    if (error) {
      setErrors([`Download failed: ${error.message}`])
      return
    }
    window.location.href = data.signedUrl
  }

  async function togglePreview(f) {
    if (preview?.id === f.id) {
      setPreview(null)
      return
    }
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(f.path, 3600)
    if (error) {
      setErrors([`Could not open preview: ${error.message}`])
      return
    }
    setPreview({ id: f.id, url: data.signedUrl, mime: f.mime || '' })
  }

  async function remove(f) {
    if (!confirm(`Delete "${f.name}"?`)) return
    const { data, error } = await supabase.from('task_files').delete().eq('id', f.id).select()
    if (error || !data || data.length === 0) {
      setErrors(['Could not delete. Only the uploader or a manager can delete this file.'])
      return
    }
    await supabase.storage.from(BUCKET).remove([f.path])
    setFiles((x) => x.filter((y) => y.id !== f.id))
    if (preview?.id === f.id) setPreview(null)
  }

  const canPreview = (mime = '') =>
    mime.startsWith('image/') ||
    mime.startsWith('video/') ||
    mime.startsWith('audio/') ||
    mime === 'application/pdf'

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          upload(e.dataTransfer.files)
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm ${
          dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ''
          }}
        />
        {uploading ? (
          <span className="font-medium text-indigo-700">Uploading... please keep this page open</span>
        ) : (
          <>
            <span className="font-medium text-slate-700">Drag files here or click to browse</span>
            <span className="mt-1 text-xs text-slate-500">
              Images, PDFs, documents and videos, up to {MAX_MB} MB each. For larger videos, add a
              Drive link in the Links tab.
            </span>
          </>
        )}
      </label>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {loaded && files.length === 0 && <p className="text-sm text-slate-400">No files yet.</p>}
        {files.map((f) => (
          <div key={f.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl">
                {iconFor(f.mime || '')}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {fmtSize(f.size_bytes)} · {personName(peopleById[f.uploaded_by])} ·{' '}
                  {formatDateTime(f.created_at)}
                </p>
              </div>
              {canPreview(f.mime || '') && (
                <button
                  type="button"
                  onClick={() => togglePreview(f)}
                  className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
                >
                  {preview?.id === f.id ? 'Hide' : 'Preview'}
                </button>
              )}
              <button
                type="button"
                onClick={() => download(f)}
                className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Download
              </button>
              {(f.uploaded_by === currentUser.id || isManager) && (
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className="shrink-0 text-sm text-slate-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>

            {preview?.id === f.id && (
              <div className="mt-3">
                {preview.mime.startsWith('image/') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.url} alt={f.name} className="max-h-96 rounded-lg" />
                )}
                {preview.mime.startsWith('video/') && (
                  <video src={preview.url} controls className="max-h-96 w-full rounded-lg bg-black" />
                )}
                {preview.mime.startsWith('audio/') && <audio src={preview.url} controls className="w-full" />}
                {preview.mime === 'application/pdf' && (
                  <iframe src={preview.url} title={f.name} className="h-96 w-full rounded-lg border" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
