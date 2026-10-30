'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Paperclip, CornerDownRight, Trash2, LayoutGrid, List } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { STATUSES, PRIORITIES, statusOf, priorityOf, isManagerRole, personName, canSetStatus } from '@/lib/constants'
import { formatDate, isOverdue, monthLabel, currentMonthStart } from '@/lib/dates'
import TaskModal from './TaskModal'
import FolderModal from './FolderModal'
import TimerButton from './TimerButton'
import Avatar from './Avatar'

function PriorityTag({ value }) {
  const p = priorityOf(value)
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: p.color }}>
      <i className="h-2 w-2 rounded-sm" style={{ backgroundColor: p.color }} />
      {p.label}
    </span>
  )
}

export default function ProjectTasks({
  project,
  initialTasks,
  initialFolders,
  people,
  currentUser,
  openTaskId,
  initialFolderId = 'all',
  openNewMonth = false,
  stats = {},
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [folders, setFolders] = useState(initialFolders)
  const [selected, setSelected] = useState(initialFolderId)
  const [view, setView] = useState('board')
  const [person, setPerson] = useState('')
  const [prio, setPrio] = useState('')
  const [pageError, setPageError] = useState('')
  const [modal, setModal] = useState(
    openTaskId && initialTasks.some((t) => t.id === openTaskId) ? { taskId: openTaskId } : null
  )
  const [folderModal, setFolderModal] = useState(openNewMonth)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const isManager = isManagerRole(currentUser.role)
  const peopleById = useMemo(() => Object.fromEntries(people.map((p) => [p.id, p])), [people])

  useEffect(() => {
    try {
      const v = localStorage.getItem('space-view')
      if (v === 'list' || v === 'board') setView(v)
    } catch {}
  }, [])
  function pickView(v) {
    setView(v)
    try {
      localStorage.setItem('space-view', v)
    } catch {}
  }

  useEffect(() => {
    if (openTaskId && tasks.some((t) => t.id === openTaskId)) setModal({ taskId: openTaskId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openTaskId])

  const chips = useMemo(() => [...folders].sort((a, b) => a.month.localeCompare(b.month)), [folders])

  const visible = useMemo(() => {
    return tasks
      .filter((t) => (selected === 'all' ? true : selected === 'none' ? !t.folder_id : t.folder_id === selected))
      .filter((t) => !person || (person === 'none' ? !t.assignee_id : t.assignee_id === person))
      .filter((t) => !prio || t.priority === prio)
      .sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
        if (a.due_date) return -1
        if (b.due_date) return 1
        return b.created_at.localeCompare(a.created_at)
      })
  }, [tasks, selected, person, prio])

  const defaultFolderId =
    selected !== 'all' && selected !== 'none'
      ? selected
      : (folders.find((f) => f.month === currentMonthStart())?.id ?? '')

  async function changeStatus(task, status) {
    if (task.status === status) return
    setPageError('')
    if (!canSetStatus(status, task, currentUser)) {
      setPageError('Only the reviewer or a manager can set Approved / Changes Required.')
      return
    }
    let reason = null
    if (status === 'changes_required') {
      reason = window.prompt('Changes required: what needs to change? (required)')
      if (!reason || !reason.trim()) return
    }
    const supabase = createClient()
    // optimistic
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status } : t)))
    if (reason) {
      await supabase.from('comments').insert({ task_id: task.id, user_id: currentUser.id, body: 'Changes requested: ' + reason.trim() })
    }
    const { data, error } = await supabase.from('tasks').update({ status }).eq('id', task.id).select().single()
    if (error) {
      setTasks((ts) => ts.map((t) => (t.id === task.id ? task : t)))
      setPageError(
        (error.message || '').includes('Only the reviewer')
          ? 'Only the reviewer or a manager can set Approved / Changes Required.'
          : 'Could not change status. Only the assignee, creator, reviewer or a manager can update this task.'
      )
      return
    }
    setTasks((ts) => ts.map((t) => (t.id === task.id ? data : t)))
    router.refresh()
  }

  async function deleteProject() {
    if (!confirm(`This will permanently delete "${project.name}" and all of its tasks. Continue?`)) return
    const { data, error } = await createClient().from('projects').delete().eq('id', project.id).select()
    if (error || !data || data.length === 0) {
      setPageError('Could not delete the space.')
      return
    }
    router.push('/projects')
    router.refresh()
  }

  const modalTask = modal && !modal.new ? tasks.find((t) => t.id === modal.taskId) : null
  const chip = (on) =>
    `rounded-full px-3.5 py-1.5 text-[13.5px] transition ${
      on ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
    }`
  const sel = 'h-9 rounded-md border border-slate-300 px-2.5 text-sm'

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl">
            <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: project.color }} />
            {project.name}
          </h1>
          <p className="text-sm text-slate-500">
            {visible.length} task{visible.length === 1 ? '' : 's'}
            {project.description ? ` · ${project.description}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5">
            {[
              ['board', 'Board', LayoutGrid],
              ['list', 'List', List],
            ].map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => pickView(v)}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${
                  view === v ? 'bg-indigo-100 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
          <Link
            href={`/chat?space=${project.id}`}
            className="flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50"
          >
            <MessageSquare size={14} /> Chat
          </Link>
          {isManager && (
            <button
              onClick={deleteProject}
              title="Delete space"
              className="flex h-9 items-center rounded-md px-2.5 text-sm text-[#b42318] hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={() => setModal({ new: true })}
            className="flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-4 text-sm font-semibold text-white"
          >
            <Plus size={16} /> New task
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSelected('all')} className={chip(selected === 'all')}>
            All months
          </button>
          {chips.map((f) => (
            <button key={f.id} onClick={() => setSelected(f.id)} className={chip(selected === f.id)}>
              {monthLabel(f.month)}
            </button>
          ))}
          {tasks.some((t) => !t.folder_id) && (
            <button onClick={() => setSelected('none')} className={chip(selected === 'none')}>
              No folder
            </button>
          )}
          <button
            onClick={() => setFolderModal(true)}
            className="rounded-full border border-dashed border-slate-400 px-3.5 py-1.5 text-[13.5px] text-slate-600 hover:bg-white"
          >
            + Month
          </button>
        </div>
        <div className="flex gap-2">
          <select value={person} onChange={(e) => setPerson(e.target.value)} className={sel}>
            <option value="">Everyone</option>
            <option value={currentUser.id}>Only me</option>
            <option value="none">Unassigned</option>
            {people
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {personName(p)}
                </option>
              ))}
          </select>
          <select value={prio} onChange={(e) => setPrio(e.target.value)} className={sel}>
            <option value="">Any priority</option>
            {[...PRIORITIES].reverse().map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {pageError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{pageError}</p>}

      {view === 'board' ? (
        <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {STATUSES.map((s) => {
              const col = visible.filter((t) => t.status === s.value)
              return (
                <div
                  key={s.value}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOverCol(s.value)
                  }}
                  onDragLeave={() => setOverCol((c) => (c === s.value ? null : c))}
                  onDrop={(e) => {
                    e.preventDefault()
                    const t = tasks.find((x) => x.id === dragId)
                    setOverCol(null)
                    setDragId(null)
                    if (t) changeStatus(t, s.value)
                  }}
                  className={`flex w-[268px] shrink-0 flex-col rounded-lg p-2 transition-colors ${
                    overCol === s.value ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between px-1.5 pb-2 pt-0.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${s.badge}`}>{s.label}</span>
                    <span className="text-[12.5px] font-medium text-slate-500">{col.length}</span>
                  </div>
                  <div className="flex min-h-[60px] flex-col gap-2">
                    {col.map((t) => {
                      const st = stats[t.id] || {}
                      const late = isOverdue(t) && t.status !== 'approved'
                      const who = t.assignee_id ? peopleById[t.assignee_id] : null
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            setDragId(t.id)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => {
                            setDragId(null)
                            setOverCol(null)
                          }}
                          onClick={() => setModal({ taskId: t.id })}
                          className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_1px_0_rgba(0,0,0,.02)] transition hover:border-slate-300 hover:shadow-[var(--shadow-lift)] ${
                            dragId === t.id ? 'opacity-40' : ''
                          }`}
                        >
                          {t.content_type && (
                            <span className="font-mono text-[11px] text-slate-500">{t.content_type}</span>
                          )}
                          <p className={`text-[14px] font-medium leading-snug ${t.status === 'done' ? 'text-slate-500 line-through' : ''}`}>
                            {t.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <PriorityTag value={t.priority} />
                            {t.due_date && (
                              <span className={`text-[12.5px] ${late ? 'font-semibold text-[#b42318]' : 'text-slate-500'}`}>
                                Due {formatDate(t.due_date)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {who ? (
                              <Avatar name={personName(who)} id={who.id} size={24} ring={false} />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px] text-slate-400">
                                ?
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-2.5 text-[12px] text-slate-500">
                              {st.sub > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <CornerDownRight size={12} /> {st.subDone}/{st.sub}
                                </span>
                              )}
                              {st.files > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Paperclip size={12} /> {st.files}
                                </span>
                              )}
                              {st.comments > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <MessageSquare size={12} /> {st.comments}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {col.length === 0 && (
                      <p className="rounded-lg border border-dashed border-slate-300 px-2 py-4 text-center text-[12px] text-slate-400">
                        Drop tasks here
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-slate-200 text-[11.5px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Timer</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    {tasks.length === 0 ? 'No tasks yet. Click "New task" to create the first one.' : 'No tasks match these filters.'}
                  </td>
                </tr>
              )}
              {visible.map((t) => {
                const late = isOverdue(t) && t.status !== 'approved'
                const who = t.assignee_id ? peopleById[t.assignee_id] : null
                return (
                  <tr key={t.id} onClick={() => setModal({ taskId: t.id })} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className={`font-medium ${t.status === 'done' ? 'text-slate-400 line-through' : ''}`}>{t.title}</p>
                      {t.content_type && <p className="text-xs text-slate-400">{t.content_type}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {who ? (
                        <span className="flex items-center gap-2">
                          <Avatar name={personName(who)} id={who.id} size={24} ring={false} /> {personName(who)}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.status}
                        onChange={(e) => changeStatus(t, e.target.value)}
                        className={`cursor-pointer rounded-full !border-0 px-2.5 py-1 text-xs font-semibold ${statusOf(t.status).badge}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value} disabled={s.value !== t.status && !canSetStatus(s.value, t, currentUser)}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityTag value={t.priority} />
                    </td>
                    <td className={`px-4 py-3 ${late ? 'font-semibold text-[#b42318]' : 'text-slate-600'}`} suppressHydrationWarning>
                      {formatDate(t.due_date)}
                      {late && ' · overdue'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <TimerButton taskId={t.id} compact />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (modal.new || modalTask) && (
        <TaskModal
          key={modal.new ? 'new' : modal.taskId}
          mode={modal.new ? 'new' : 'edit'}
          task={modalTask}
          project={project}
          projectId={project.id}
          folders={folders}
          defaultFolderId={defaultFolderId}
          people={people}
          currentUser={currentUser}
          justCreated={!!modal.created}
          onSaved={(saved) => {
            const existed = tasks.some((x) => x.id === saved.id)
            setTasks((ts) => (existed ? ts.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...ts]))
            setModal(existed ? null : { taskId: saved.id, created: true })
            router.refresh()
          }}
          onTaskUpdated={(updated) => setTasks((ts) => ts.map((x) => (x.id === updated.id ? updated : x)))}
          onDeleted={(id) => {
            setTasks((ts) => ts.filter((x) => x.id !== id))
            setModal(null)
            router.refresh()
          }}
          onClose={() => setModal(null)}
        />
      )}

      {folderModal && (
        <FolderModal
          project={project}
          folders={folders}
          selectedFolderId={selected}
          tasks={tasks}
          currentUser={currentUser}
          onCreated={(folder, copied) => {
            setFolders((fs) => [folder, ...fs].sort((a, b) => b.month.localeCompare(a.month)))
            if (copied.length) setTasks((ts) => [...copied, ...ts])
            setSelected(folder.id)
            setFolderModal(false)
            router.refresh()
          }}
          onClose={() => setFolderModal(false)}
        />
      )}
    </div>
  )
}
