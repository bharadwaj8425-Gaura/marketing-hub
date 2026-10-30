'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  STATUSES,
  PRIORITIES,
  CONTENT_TYPES,
  isManagerRole,
  personName,
  canSetStatus,
} from '@/lib/constants'
import { monthLabel } from '@/lib/dates'
import Modal from './Modal'
import TaskComments from './TaskComments'
import TaskLinks from './TaskLinks'
import TaskFiles from './TaskFiles'
import TaskTime from './TaskTime'
import TaskActivity from './TaskActivity'
import TaskItems from './TaskItems'
import TaskTimerBox from './TaskTimerBox'

const inputCls =
  'h-9 w-full rounded-md border border-slate-300 px-2.5 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500'
const labelCls = 'mb-1 block text-[12.5px] text-slate-500'
const sectionCls = 'mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500'

const TABS = [
  { id: 'comments', label: 'Comments' },
  { id: 'links', label: 'Video links' },
  { id: 'files', label: 'Files' },
  { id: 'time', label: 'Time log' },
  { id: 'activity', label: 'Activity' },
]

export default function TaskModal({
  mode, // 'new' or 'edit'
  task,
  project,
  projectId,
  folders,
  defaultFolderId,
  people,
  currentUser,
  justCreated,
  onSaved,
  onTaskUpdated,
  onDeleted,
  onClose,
}) {
  const [supabase] = useState(() => createClient())
  const isNew = mode === 'new'
  const isManager = isManagerRole(currentUser.role)
  const isReviewer = !isNew && task?.reviewer_id === currentUser.id
  const canEdit =
    isNew || isManager || task?.assignee_id === currentUser.id || task?.created_by === currentUser.id || isReviewer
  const canDelete = !isNew && (isManager || task?.created_by === currentUser.id)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(task?.status ?? 'todo')
  const [priority, setPriority] = useState(task?.priority ?? 'medium')
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? '')
  const [reviewerId, setReviewerId] = useState(task?.reviewer_id ?? '')
  const [folderId, setFolderId] = useState(task ? (task.folder_id ?? '') : (defaultFolderId ?? ''))
  const [contentType, setContentType] = useState(task?.content_type ?? '')
  const [startDate, setStartDate] = useState(task?.start_date ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [estHours, setEstHours] = useState(task?.est_hours ?? '')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('comments')

  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])
  const needsReason = !isNew && status === 'changes_required' && task?.status !== 'changes_required'

  async function save(e) {
    e.preventDefault()
    setErrorMsg('')

    if (startDate && dueDate && dueDate < startDate) {
      setErrorMsg('Due date cannot be before the start date.')
      return
    }
    if (needsReason && !reason.trim()) {
      setErrorMsg('Please describe the changes required.')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      assignee_id: assigneeId || null,
      reviewer_id: reviewerId || null,
      folder_id: folderId || null,
      content_type: contentType || null,
      start_date: startDate || null,
      due_date: dueDate || null,
    }
    const withEst = estHours !== '' && estHours !== null ? { ...payload, est_hours: Number(estHours) } : task && 'est_hours' in task ? { ...payload, est_hours: null } : payload

    setSaving(true)

    if (needsReason) {
      const { error: cErr } = await supabase.from('comments').insert({
        task_id: task.id,
        user_id: currentUser.id,
        body: 'Changes requested: ' + reason.trim(),
      })
      if (cErr) {
        setSaving(false)
        setErrorMsg(cErr.message)
        return
      }
    }

    const run = (body) =>
      isNew
        ? supabase.from('tasks').insert({ ...body, project_id: projectId, created_by: currentUser.id }).select().single()
        : supabase.from('tasks').update(body).eq('id', task.id).select().single()
    let result = await run(withEst)
    // Older database without the est_hours column (schema_v4 not run yet)
    if (result.error && (result.error.message || '').includes('est_hours')) result = await run(payload)
    setSaving(false)

    if (result.error) {
      const m = result.error.message || ''
      setErrorMsg(
        m.includes('Only the reviewer')
          ? 'Only the reviewer or a manager can set Approved / Changes Required.'
          : isNew
            ? m
            : 'Could not save. Only the assignee, creator, reviewer or a manager can edit this task.'
      )
      return
    }
    onSaved(result.data)
  }

  async function remove() {
    if (!confirm('Delete this task? This cannot be undone.')) return
    const { data, error } = await supabase.from('tasks').delete().eq('id', task.id).select()
    if (error || !data || data.length === 0) {
      setErrorMsg('Could not delete. Only the creator or a manager can delete this task.')
      return
    }
    onDeleted(task.id)
  }

  // Comments tab ke Approve / Request changes buttons yahan se status badalte hain
  async function setStatusDirect(newStatus) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)
      .select()
      .single()
    if (error) {
      setErrorMsg(
        error.message.includes('Only the reviewer')
          ? 'Only the reviewer or a manager can set this status.'
          : 'Could not change status.'
      )
      return false
    }
    setStatus(data.status)
    onTaskUpdated(data)
    return true
  }

  const folderName = folders.find((f) => f.id === folderId)
  const header = (
    <span className="flex items-center gap-1.5">
      <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: project?.color || '#8a9c96' }} />
      <span className="truncate">{project?.name ?? 'Space'}</span>
      {folderName && <span className="text-slate-400">/</span>}
      {folderName && <span>{monthLabel(folderName.month)}</span>}
      <span className="text-slate-400">/</span>
      <span>{isNew ? 'New task' : 'Task'}</span>
    </span>
  )

  return (
    <Modal variant="drawer" header={header} title={isNew ? 'New task' : 'Task details'} onClose={onClose}>
      {justCreated && (
        <p className="mb-3 rounded-md bg-[#d8f0e2] px-3 py-2 text-sm text-[#17794a]">
          Task created. Add subtasks, links and files below, or start the timer.
        </p>
      )}

      <form onSubmit={save}>
        {!canEdit && (
          <p className="mb-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
            View only. Only the assignee, creator, reviewer or a manager can edit this task. You can still comment,
            add links and files, and log time.
          </p>
        )}

        <textarea
          required
          rows={1}
          autoFocus={isNew}
          disabled={!canEdit}
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ' '))}
          placeholder="Task title"
          className="w-full resize-none !border-0 !bg-transparent p-0 font-display text-[22px] font-bold leading-snug !shadow-none outline-none placeholder:text-slate-300"
        />

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Status</label>
            <select disabled={!canEdit} value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value} disabled={s.value !== status && !canSetStatus(s.value, task, currentUser)}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select disabled={!canEdit} value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Start date</label>
            <input type="date" disabled={!canEdit} value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Due date</label>
            <input type="date" disabled={!canEdit} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Reviewer</label>
            <select disabled={!canEdit} value={reviewerId} onChange={(e) => setReviewerId(e.target.value)} className={inputCls}>
              <option value="">No reviewer</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Estimate, hours</label>
            <input
              type="number"
              min="0"
              step="0.5"
              disabled={!canEdit}
              value={estHours ?? ''}
              onChange={(e) => setEstHours(e.target.value)}
              className={inputCls}
              placeholder="-"
            />
          </div>
          <div>
            <label className={labelCls}>Assignee</label>
            <select disabled={!canEdit} value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputCls}>
              <option value="">Unassigned</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Content type</label>
            <select disabled={!canEdit} value={contentType} onChange={(e) => setContentType(e.target.value)} className={inputCls}>
              <option value="">-</option>
              {CONTENT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Month folder</label>
            <select disabled={!canEdit} value={folderId} onChange={(e) => setFolderId(e.target.value)} className={inputCls}>
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {monthLabel(f.month)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {needsReason && (
          <div className="mt-3">
            <label className={labelCls}>What needs to change? (required)</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm"
              placeholder="This will be saved as a comment on the task"
            />
          </div>
        )}

        {!isNew && <TaskTimerBox taskId={task.id} estHours={task.est_hours} />}

        <h3 className={`${sectionCls} mt-5`}>Brief</h3>
        <textarea
          rows={3}
          disabled={!canEdit}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What exactly needs to be delivered?"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-[14px] leading-relaxed"
        />

        {errorMsg && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-[12px] text-slate-400">
            {!isNew && task?.created_by ? `Created by ${personName(peopleById[task.created_by])}` : ''}
          </div>
          <div className="flex gap-2">
            {canDelete && (
              <button type="button" onClick={remove} className="h-9 rounded-md px-3 text-sm text-[#b42318] hover:bg-red-50">
                Delete
              </button>
            )}
            {canEdit && (
              <button type="submit" disabled={saving} className="h-9 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving...' : isNew ? 'Create task' : 'Save changes'}
              </button>
            )}
          </div>
        </div>
      </form>

      {!isNew && (
        <>
          <TaskItems
            taskId={task.id}
            kind="subtask"
            title="Subtasks"
            placeholder="Add a subtask and press Enter"
            currentUser={currentUser}
            isManager={isManager}
          />
          <TaskItems
            taskId={task.id}
            kind="check"
            title="Checklist"
            placeholder="Add a checklist item"
            currentUser={currentUser}
            isManager={isManager}
          />

          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-[13.5px] font-medium ${
                    tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'comments' && (
              <TaskComments
                taskId={task.id}
                people={people}
                currentUser={currentUser}
                isManager={isManager}
                canReview={isManager || isReviewer}
                taskStatus={task.status}
                onSetStatus={setStatusDirect}
              />
            )}
            {tab === 'links' && <TaskLinks taskId={task.id} currentUser={currentUser} isManager={isManager} />}
            {tab === 'files' && <TaskFiles taskId={task.id} people={people} currentUser={currentUser} isManager={isManager} />}
            {tab === 'time' && <TaskTime taskId={task.id} people={people} currentUser={currentUser} isManager={isManager} />}
            {tab === 'activity' && <TaskActivity taskId={task.id} people={people} />}
          </div>
        </>
      )}
    </Modal>
  )
}
