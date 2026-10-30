'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PROJECT_COLORS } from '@/lib/constants'
import Modal from './Modal'

export default function NewProjectButton({ userId, autoOpen = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(autoOpen)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  function close() {
    setOpen(false)
    setName('')
    setDescription('')
    setColor(PROJECT_COLORS[0])
    setErrorMsg('')
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        color,
        created_by: userId,
      })
      .select('id')
      .single()
    setSaving(false)
    if (error) {
      setErrorMsg(error.message)
      return
    }
    router.push(`/projects/${data.id}`)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        + New space
      </button>

      {open && (
        <Modal title="New space" onClose={close}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Space name</label>
              <input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Social Media"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description (optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    aria-label={c}
                    style={{ backgroundColor: c }}
                    className={`h-7 w-7 rounded-full ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Creating...' : 'Create space'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
