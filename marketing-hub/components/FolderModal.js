'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addMonths, currentMonthStart, monthLabel } from '@/lib/dates'
import Modal from './Modal'

export default function FolderModal({
  project,
  folders,
  selectedFolderId,
  tasks,
  currentUser,
  onCreated,
  onClose,
}) {
  const latest = folders[0] // folders month ke hisaab se newest-first aate hain
  const suggested = latest ? addMonths(latest.month, 1) : currentMonthStart()
  const source = folders.find((f) => f.id === selectedFolderId)
  const sourceTasks = source ? tasks.filter((t) => t.folder_id === source.id) : []

  const [ym, setYm] = useState(suggested.slice(0, 7))
  const [copy, setCopy] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{4}-\d{2}$/.test(ym)) {
      setError('Please select a month.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const month = `${ym}-01`

    const { data: folder, error: fErr } = await supabase
      .from('folders')
      .insert({ project_id: project.id, name: monthLabel(month), month, created_by: currentUser.id })
      .select()
      .single()

    if (fErr) {
      setSaving(false)
      setError(
        fErr.code === '23505' ? `A folder for ${monthLabel(month)} already exists.` : fErr.message
      )
      return
    }

    let copied = []
    if (copy && sourceTasks.length > 0) {
      const rows = sourceTasks.map((t) => ({
        project_id: project.id,
        folder_id: folder.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        assignee_id: t.assignee_id,
        reviewer_id: t.reviewer_id,
        content_type: t.content_type,
        created_by: currentUser.id,
        status: 'todo',
      }))
      const { data, error: tErr } = await supabase.from('tasks').insert(rows).select()
      if (tErr) {
        setSaving(false)
        setError(`Folder created, but tasks could not be copied: ${tErr.message}`)
        onCreated(folder, [])
        return
      }
      copied = data ?? []
    }

    setSaving(false)
    onCreated(folder, copied)
  }

  return (
    <Modal title="New month folder" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Month</label>
          <input
            type="month"
            required
            value={ym}
            onChange={(e) => setYm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            {/^\d{4}-\d{2}$/.test(ym) ? `Folder name: ${monthLabel(ym + '-01')}` : ''}
          </p>
        </div>

        {source && sourceTasks.length > 0 && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={copy}
              onChange={(e) => setCopy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              Copy {sourceTasks.length} tasks from {monthLabel(source.month)}
              <span className="block text-xs text-slate-500">
                They will be added as To Do (same title, assignee, reviewer and priority; dates are not
                copied).
              </span>
            </span>
          </label>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Creating...' : 'Create folder'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
