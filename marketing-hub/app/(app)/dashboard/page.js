import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { STATUSES, statusOf, priorityOf, personName, isManagerRole } from '@/lib/constants'
import { todayStr, monthRange, formatDate, addMonths, dayKey } from '@/lib/dates'
import { entrySeconds } from '@/lib/timeData'
import Avatar from '@/components/Avatar'
import DashboardFilters from '@/components/DashboardFilters'

const CLOSED = ['done', 'approved']

function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3.5">
      <p className="text-[13px] text-slate-500">{label}</p>
      <p className={`font-display text-[30px] font-bold leading-tight tabular-nums ${tone || ''}`}>{value}</p>
      <p className="text-[12.5px] text-slate-500">{sub}</p>
    </div>
  )
}

function Panel({ title, right, children, className = '' }) {
  return (
    <section className={`rounded-xl border bg-white p-4 ${className}`}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-semibold">{title}</h2>
        {right && <span className="text-[12.5px] text-slate-500">{right}</span>}
      </header>
      {children}
    </section>
  )
}

function TaskList({ items, projectsById, empty }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>
  return (
    <ul className="-mx-4 divide-y divide-slate-100">
      {items.slice(0, 6).map((t) => {
        const p = projectsById[t.project_id]
        return (
          <li key={t.id}>
            <Link href={`/projects/${t.project_id}?task=${t.id}`} className="block px-4 py-2.5 hover:bg-slate-50">
              <p className="truncate text-[13.5px] font-medium">{t.title}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: p?.color || '#8a9c96' }} />
                <span className="truncate">{p?.name ?? '-'}</span>
                <span className="ml-auto shrink-0">{t.due_date ? formatDate(t.due_date) : 'No date'}</span>
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = todayStr()
  const ym = today.slice(0, 7)
  const { from: monthFrom, to: monthTo } = monthRange(ym)
  const start14 = addDays(today, -13)
  const from14 = new Date(`${start14}T00:00:00+05:30`).toISOString()
  const earliest = from14 < monthFrom ? from14 : monthFrom

  const [meRes, tasksRes, projectsRes, peopleRes, timeRes] = await Promise.all([
    supabase.from('profiles').select('full_name, role').eq('id', user.id).maybeSingle(),
    supabase.from('tasks').select('id, title, status, priority, due_date, project_id, assignee_id, reviewer_id'),
    supabase.from('projects').select('id, name, color').eq('archived', false).order('created_at'),
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase
      .from('time_entries')
      .select('user_id, task_id, started_at, ended_at, duration_seconds, tasks(project_id)')
      .gte('started_at', earliest)
      .limit(10000),
  ])

  const me = meRes.data
  const isManager = isManagerRole(me?.role)
  const projects = projectsRes.data ?? []
  const people = peopleRes.data ?? []
  const projectsById = Object.fromEntries(projects.map((p) => [p.id, p]))

  const spaceF = sp.space && projectsById[sp.space] ? sp.space : ''
  const personF = sp.person && people.some((p) => p.id === sp.person) ? sp.person : ''

  let tasks = (tasksRes.data ?? []).filter((t) => projectsById[t.project_id])
  if (spaceF) tasks = tasks.filter((t) => t.project_id === spaceF)
  if (personF) tasks = tasks.filter((t) => t.assignee_id === personF)

  let entries = timeRes.data ?? []
  if (spaceF) entries = entries.filter((e) => e.tasks?.project_id === spaceF)
  if (personF) entries = entries.filter((e) => e.user_id === personF)
  const monthEntries = entries.filter((e) => e.started_at >= monthFrom && e.started_at < monthTo)
  const monthSeconds = monthEntries.reduce((s, e) => s + entrySeconds(e), 0)

  const open = tasks.filter((t) => !CLOSED.includes(t.status))
  const overdue = open.filter((t) => t.due_date && t.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date))
  const pending = tasks
    .filter((t) => t.status === 'review' && (isManager || t.reviewer_id === user.id))
    .sort((a, b) => (a.due_date || '9').localeCompare(b.due_date || '9'))
  const in7 = addDays(today, 7)
  const dueSoon = open
    .filter((t) => t.due_date && t.due_date >= today && t.due_date <= in7)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
  const openSpaces = new Set(open.map((t) => t.project_id)).size

  // Status bars
  const byStatus = STATUSES.map((s) => ({ ...s, n: tasks.filter((t) => t.status === s.value).length }))
  const maxStatus = Math.max(1, ...byStatus.map((s) => s.n))

  // Space bars
  const bySpace = projects
    .filter((p) => !spaceF || p.id === spaceF)
    .map((p) => {
      const list = tasks.filter((t) => t.project_id === p.id)
      return { ...p, total: list.length, closed: list.filter((t) => CLOSED.includes(t.status)).length }
    })
  const maxSpace = Math.max(1, ...bySpace.map((s) => s.total))

  // Workload
  const secondsBy = {}
  monthEntries.forEach((e) => (secondsBy[e.user_id] = (secondsBy[e.user_id] || 0) + entrySeconds(e)))
  const workload = people
    .map((p) => ({ p, open: open.filter((t) => t.assignee_id === p.id).length, sec: secondsBy[p.id] || 0 }))
    .filter((w) => (personF ? w.p.id === personF : w.open > 0 || w.sec > 0))
    .sort((a, b) => b.open - a.open || b.sec - a.sec)
  const maxOpen = Math.max(1, ...workload.map((w) => w.open))

  // Last 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(start14, i))
  const perDay = Object.fromEntries(days.map((d) => [d, 0]))
  entries.forEach((e) => {
    const k = dayKey(e.started_at)
    if (k in perDay) perDay[k] += entrySeconds(e) / 3600
  })
  const maxDay = Math.max(1, ...Object.values(perDay))

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  })
  const monthName = new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', timeZone: 'UTC' })

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">Marketing overview</h1>
          <p className="text-sm text-slate-500" suppressHydrationWarning>
            {dateLabel}
          </p>
        </div>
        <DashboardFilters projects={projects} people={people} space={spaceF} person={personF} />
      </div>

      {!me && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Your profile was not found. Sign out and sign up again after the database setup is complete.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Open tasks" value={open.length} sub={`across ${openSpaces} space${openSpaces === 1 ? '' : 's'}`} />
        <Kpi label="Overdue" value={overdue.length} sub="past due, not approved" tone={overdue.length ? 'text-[#b42318]' : ''} />
        <Kpi label="Waiting for approval" value={pending.length} sub="in Review Required" />
        <Kpi
          label={`Hours logged, ${monthName}`}
          value={(monthSeconds / 3600).toFixed(1)}
          sub={`${monthEntries.length} time entr${monthEntries.length === 1 ? 'y' : 'ies'}`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Tasks by status" right={`${tasks.length} tasks`}>
          <div className="space-y-2">
            {byStatus.map((s) => (
              <div key={s.value} className="grid grid-cols-[140px_1fr_28px] items-center gap-3">
                <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${s.badge}`}>{s.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${(s.n / maxStatus) * 100}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-right text-[13px] font-semibold tabular-nums">{s.n}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tasks by space" right="solid = approved or completed">
          {bySpace.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No spaces yet.</p>
          ) : (
            <div className="space-y-2.5">
              {bySpace.map((s) => (
                <Link key={s.id} href={`/projects/${s.id}`} className="grid grid-cols-[150px_1fr_40px] items-center gap-3 hover:opacity-80">
                  <span className="flex items-center gap-2 truncate text-[13.5px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="truncate">{s.name}</span>
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="relative h-full rounded-full" style={{ width: `${(s.total / maxSpace) * 100}%`, backgroundColor: s.color, opacity: 0.35 }} />
                    <div
                      className="-mt-2 h-full rounded-full"
                      style={{ width: `${(s.closed / maxSpace) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <span className="text-right text-[13px] font-semibold tabular-nums">
                    {s.closed}/{s.total}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Workload by person" right="open tasks · hours this month">
          {workload.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No assigned work yet.</p>
          ) : (
            <div className="space-y-2.5">
              {workload.map(({ p, open: n, sec }) => (
                <div key={p.id} className="grid grid-cols-[150px_1fr_70px] items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-[13.5px]">
                    <Avatar name={personName(p)} id={p.id} size={24} ring={false} />
                    <span className="truncate">{personName(p)}</span>
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${(n / maxOpen) * 100}%` }} />
                  </div>
                  <span className="text-right text-[12.5px] tabular-nums text-slate-500">
                    {n} · {(sec / 3600).toFixed(1)}h
                  </span>
                </div>
              ))}
              {!isManager && (
                <p className="pt-1 text-[11.5px] text-slate-400">Hours shown are only yours. Managers see the whole team.</p>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Time logged, last 14 days" right={`hours per day · top = ${maxDay.toFixed(1)}h`}>
          <div className="flex h-[150px] items-end gap-1.5 border-b border-slate-200">
            {days.map((d) => {
              const h = perDay[d]
              const isToday = d === today
              return (
                <div key={d} className="group relative flex h-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t ${isToday ? 'border-2 border-b-0 border-slate-800 bg-indigo-400' : 'bg-indigo-600'}`}
                    style={{ height: `${Math.max(h > 0 ? 3 : 1.5, (h / maxDay) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-white group-hover:block">
                    {h.toFixed(1)}h
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex gap-1.5 text-[11px] text-slate-400">
            {days.map((d, i) => (
              <span key={d} className="flex-1 text-center">
                {i % 2 === 0 ? Number(d.slice(8)) : ''}
              </span>
            ))}
          </div>
          <p className="mt-1 text-[12px] text-slate-500">Outlined bar is today.</p>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Overdue" right={overdue.length}>
          <TaskList items={overdue} projectsById={projectsById} empty="Nothing overdue." />
        </Panel>
        <Panel title="Pending approvals" right={pending.length}>
          <TaskList items={pending} projectsById={projectsById} empty="Nothing waiting for approval." />
        </Panel>
        <Panel title="Due in the next 7 days" right={dueSoon.length}>
          <TaskList items={dueSoon} projectsById={projectsById} empty="Nothing due this week." />
        </Panel>
      </div>
    </div>
  )
}
