'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download,
  Upload,
  FileSpreadsheet,
  ListChecks,
  Clock,
  Archive,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { statusOf, priorityOf } from '@/lib/constants'
import { todayStr } from '@/lib/dates'
import {
  downloadTemplate,
  exportTasks,
  exportTime,
  exportBackup,
  readSpreadsheet,
  validateRows,
  importRows,
} from '@/lib/importExport'

function Card({ icon: Icon, tone, title, text, children }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${tone}`}>
          <Icon size={19} />
        </span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-500">{text}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

const btn =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
const primary =
  'inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'

export default function DataTools({ userId, canManage, people, projects }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null) // { type, text }
  const [month, setMonth] = useState(todayStr().slice(0, 7))

  // import state
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState(null)
  const [progress, setProgress] = useState(null)

  async function run(key, fn) {
    setBusy(key)
    setMsg(null)
    try {
      const out = await fn()
      if (out) setMsg({ type: 'ok', text: out })
    } catch (e) {
      setMsg({ type: 'error', text: e.message || String(e) })
    }
    setBusy('')
  }

  async function onFile(file) {
    if (!file) return
    setFileName(file.name)
    setRows(null)
    setMsg(null)
    await run('read', async () => {
      const raw = await readSpreadsheet(file)
      const v = validateRows(raw, { people, projects })
      if (v.length === 0) throw new Error('No rows found. Use the template and keep the header row.')
      setRows(v)
    })
  }

  const good = rows?.filter((r) => r.errors.length === 0) ?? []
  const bad = rows?.filter((r) => r.errors.length > 0) ?? []
  const newSpaces = [...new Set(good.filter((r) => !r.project).map((r) => r.space))]

  async function doImport() {
    await run('import', async () => {
      setProgress({ done: 0, total: good.length })
      const res = await importRows(supabase, rows, {
        userId,
        canCreateSpaces: canManage,
        onProgress: (done, total) => setProgress({ done, total }),
      })
      setRows(null)
      setFileName('')
      setProgress(null)
      router.refresh()
      return `Imported ${res.tasks} task${res.tasks === 1 ? '' : 's'}${
        res.spaces ? `, created ${res.spaces} space${res.spaces === 1 ? '' : 's'}` : ''
      }${res.folders ? ` and ${res.folders} month folder${res.folders === 1 ? '' : 's'}` : ''}.`
    })
    setProgress(null)
  }

  const spin = (k) => busy === k && <Loader2 size={15} className="animate-spin" />

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">Import &amp; Export</h1>
      <p className="mt-1 text-slate-500">
        Download your data as Excel or CSV, or bulk-upload tasks from a spreadsheet.
      </p>

      {msg && (
        <div
          className={`mt-5 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ring-1 ${
            msg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      {/* EXPORT */}
      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">Export</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <Card
          icon={ListChecks}
          tone="bg-indigo-50 text-indigo-600 ring-indigo-100"
          title="Tasks"
          text="All tasks with space, status, assignee, deadlines and month folder."
        >
          <button className={btn} disabled={!!busy} onClick={() => run('tx', async () => `Exported ${await exportTasks(supabase, 'xlsx')} tasks.`)}>
            {spin('tx') || <Download size={15} />} Excel
          </button>
          <button className={btn} disabled={!!busy} onClick={() => run('tc', async () => `Exported ${await exportTasks(supabase, 'csv')} tasks.`)}>
            {spin('tc') || <Download size={15} />} CSV
          </button>
        </Card>

        <Card
          icon={Clock}
          tone="bg-emerald-50 text-emerald-600 ring-emerald-100"
          title="Time tracking"
          text={canManage ? 'Hours logged by the whole team.' : 'Hours you have logged.'}
        >
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-sm"
          />
          <button
            className={btn}
            disabled={!!busy || !month}
            onClick={() => run('ti', async () => `Exported ${await exportTime(supabase, month, 'xlsx')} time entries.`)}
          >
            {spin('ti') || <Download size={15} />} Excel
          </button>
        </Card>

        <Card
          icon={Archive}
          tone="bg-amber-50 text-amber-600 ring-amber-100"
          title="Full backup"
          text="One Excel file: tasks, time, spaces, team and chat history."
        >
          <button className={primary} disabled={!!busy} onClick={() => run('bk', async () => (await exportBackup(supabase), 'Backup downloaded.'))}>
            {spin('bk') || <Download size={15} />} Download backup
          </button>
        </Card>
      </div>

      {/* IMPORT */}
      <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-slate-400">Import tasks</h2>
      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5">
        <ol className="grid gap-4 text-sm sm:grid-cols-3">
          {[
            ['1', 'Download the template', 'Excel file with the right columns and two example rows.'],
            ['2', 'Fill in your tasks', 'One row per task. Only Space and Title are required.'],
            ['3', 'Upload and review', 'We check every row before anything is saved.'],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">
                {n}
              </span>
              <span>
                <span className="font-semibold">{t}</span>
                <span className="block text-slate-500">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className={btn} disabled={!!busy} onClick={() => run('tpl', async () => (await downloadTemplate('xlsx'), ''))}>
            <FileSpreadsheet size={15} /> Template (Excel)
          </button>
          <button className={btn} disabled={!!busy} onClick={() => run('tplc', async () => (await downloadTemplate('csv'), ''))}>
            <FileSpreadsheet size={15} /> Template (CSV)
          </button>
        </div>

        <label
          className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files?.[0])
          }}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />
          {busy === 'read' ? <Loader2 className="animate-spin text-indigo-500" /> : <Upload className="text-indigo-500" />}
          <span className="mt-2 font-medium text-slate-700">{fileName || 'Drop your .xlsx or .csv file here, or click to browse'}</span>
          <span className="mt-1 text-xs text-slate-400">Nothing is saved until you click Import</span>
        </label>

        {rows && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                {good.length} ready
              </span>
              {bad.length > 0 && (
                <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700 ring-1 ring-rose-100">
                  {bad.length} with errors (will be skipped)
                </span>
              )}
              {newSpaces.length > 0 && (
                <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 ring-1 ring-amber-100">
                  {newSpaces.length} new space{newSpaces.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {newSpaces.length > 0 && !canManage && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-200">
                Only managers can create new spaces. Fix the space names ({newSpaces.join(', ')}) or ask a manager to create them.
              </p>
            )}

            <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Space</th>
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Assignee</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Check</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className={`border-t border-slate-100 align-top ${r.errors.length ? 'bg-rose-50/50' : ''}`}>
                      <td className="px-3 py-2 text-slate-400">{r.line}</td>
                      <td className="px-3 py-2">{r.space || '—'}</td>
                      <td className="px-3 py-2 font-medium">{r.task.title || '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusOf(r.task.status).badge}`}>
                          {statusOf(r.task.status).label}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityOf(r.task.priority).badge}`}>
                          {priorityOf(r.task.priority).label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.assigneeName || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{r.task.due_date || '—'}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.errors.map((e) => (
                          <p key={e} className="flex gap-1 text-rose-600">
                            <AlertCircle size={13} className="mt-0.5 shrink-0" /> {e}
                          </p>
                        ))}
                        {r.warnings.map((w) => (
                          <p key={w} className="flex gap-1 text-amber-600">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {w}
                          </p>
                        ))}
                        {!r.errors.length && !r.warnings.length && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={13} /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {progress && (
                <span className="mr-auto text-sm text-slate-500">
                  Importing {progress.done} / {progress.total}...
                </span>
              )}
              <button
                className={btn}
                disabled={busy === 'import'}
                onClick={() => {
                  setRows(null)
                  setFileName('')
                }}
              >
                Cancel
              </button>
              <button
                className={primary}
                disabled={!!busy || good.length === 0 || (newSpaces.length > 0 && !canManage)}
                onClick={doImport}
              >
                {spin('import') || <Upload size={15} />} Import {good.length} task{good.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
