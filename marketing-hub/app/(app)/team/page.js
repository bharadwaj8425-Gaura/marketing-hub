import Link from 'next/link'
import { Users, Activity, AlertTriangle, Clock, Lock, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { isManagerRole, personName, fmtDuration, statusOf } from '@/lib/constants'
import { formatDate, isOverdue, monthLabel, todayStr } from '@/lib/dates'
import { fetchMonthEntries, entrySeconds } from '@/lib/timeData'
import Avatar from '@/components/Avatar'
import { LiveElapsed, RoleSelect } from '@/components/TeamWidgets'

const ROLE_STYLE = {
  admin: 'bg-violet-100 text-violet-700',
  manager: 'bg-sky-100 text-sky-700',
  member: 'bg-slate-100 text-slate-600',
}

function Summary({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tone}`}>
        <Icon size={19} />
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  )
}

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const myRole = me?.role ?? 'member'

  if (!isManagerRole(myRole)) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Lock size={22} />
        </span>
        <h1 className="mt-4 text-lg font-bold">Restricted</h1>
        <p className="mt-1 text-sm text-slate-500">The team overview is available to managers and admins only.</p>
        <Link href="/dashboard" className="mt-5 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const ym = todayStr().slice(0, 7)
  const [peopleRes, tasksRes, entries, runningRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, assignee_id, project_id, projects(name, color)')
      .order('due_date', { ascending: true, nullsFirst: false }),
    fetchMonthEntries(supabase, ym),
    supabase
      .from('time_entries')
      .select('user_id, started_at, task_id, tasks(title, project_id)')
      .is('ended_at', null),
  ])

  const people = peopleRes.data ?? []
  const tasks = tasksRes.data ?? []
  const running = Object.fromEntries((runningRes.data ?? []).map((r) => [r.user_id, r]))

  const rows = people.map((p) => {
    const mine = tasks.filter((t) => t.assignee_id === p.id)
    const open = mine.filter((t) => t.status !== 'done')
    const seconds = entries.filter((e) => e.user_id === p.id).reduce((s, e) => s + entrySeconds(e), 0)
    return {
      person: p,
      open,
      review: open.filter((t) => t.status === 'review').length,
      overdue: open.filter((t) => isOverdue(t)).length,
      completed: mine.length - open.length,
      seconds,
      now: running[p.id],
    }
  })
  rows.sort((a, b) => Number(!!b.now) - Number(!!a.now) || b.open.length - a.open.length)

  const workingNow = rows.filter((r) => r.now).length
  const teamOverdue = rows.reduce((s, r) => s + r.overdue, 0)
  const teamSeconds = rows.reduce((s, r) => s + r.seconds, 0)
  const unassigned = tasks.filter((t) => !t.assignee_id && t.status !== 'done').length

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Team overview</h1>
          <p className="mt-1 text-slate-500">
            Everyone&apos;s workload, live timers and hours for {monthLabel(`${ym}-01`)}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
          <Eye size={13} /> Visible to managers &amp; admins only
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Summary icon={Users} label="Team members" value={people.length} tone="bg-indigo-50 text-indigo-600 ring-indigo-100" />
        <Summary icon={Activity} label="Working right now" value={workingNow} tone="bg-emerald-50 text-emerald-600 ring-emerald-100" />
        <Summary icon={AlertTriangle} label="Overdue tasks" value={teamOverdue} tone="bg-rose-50 text-rose-600 ring-rose-100" />
        <Summary icon={Clock} label="Team hours this month" value={fmtDuration(teamSeconds)} tone="bg-amber-50 text-amber-600 ring-amber-100" />
      </div>

      {unassigned > 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {unassigned} open task{unassigned > 1 ? 's are' : ' is'} not assigned to anyone.
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {rows.map((r) => {
          const p = r.person
          const name = personName(p)
          return (
            <section key={p.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <Avatar name={name} id={p.id} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {name}
                    {p.id === user.id && <span className="font-normal text-slate-400"> (you)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-400">{p.email}</p>
                </div>
                {myRole === 'admin' ? (
                  <RoleSelect userId={p.id} role={p.role} disabled={p.id === user.id} />
                ) : (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      ROLE_STYLE[p.role] || ROLE_STYLE.member
                    }`}
                  >
                    {p.role}
                  </span>
                )}
              </div>

              {r.now ? (
                <Link
                  href={r.now.tasks?.project_id ? `/projects/${r.now.tasks.project_id}?task=${r.now.task_id}` : '/projects'}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm ring-1 ring-emerald-100 hover:bg-emerald-100/60"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-emerald-700">Working on </span>
                    <span className="font-medium">{r.now.tasks?.title ?? 'a task'}</span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-emerald-700">
                    <LiveElapsed startedAt={r.now.started_at} />
                  </span>
                </Link>
              ) : (
                <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-400">No timer running</p>
              )}

              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                {[
                  ['Open', r.open.length, ''],
                  ['In review', r.review, 'text-amber-600'],
                  ['Overdue', r.overdue, r.overdue ? 'text-rose-600' : ''],
                  ['Hours', fmtDuration(r.seconds), ''],
                ].map(([label, val, cls]) => (
                  <div key={label} className="rounded-xl bg-slate-50 px-1 py-2">
                    <p className={`text-lg font-bold tabular-nums ${cls}`}>{val}</p>
                    <p className="text-[11px] text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {r.open.length > 0 && (
                <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {r.open.slice(0, 4).map((t) => {
                    const st = statusOf(t.status)
                    const late = isOverdue(t)
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/projects/${t.project_id}?task=${t.id}`}
                          className="flex items-center gap-2 py-2 text-sm hover:text-indigo-600"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: t.projects?.color || '#94a3b8' }}
                          />
                          <span className="min-w-0 flex-1 truncate">{t.title}</span>
                          <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium sm:inline ${st.badge}`}>
                            {st.label}
                          </span>
                          <span
                            className={`w-14 shrink-0 text-right text-xs ${late ? 'font-semibold text-rose-600' : 'text-slate-400'}`}
                          >
                            {t.due_date ? formatDate(t.due_date) : '—'}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                  {r.open.length > 4 && (
                    <li className="pt-2 text-xs text-slate-400">+ {r.open.length - 4} more open tasks</li>
                  )}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-400">{r.completed} completed in total</p>
            </section>
          )
        })}
      </div>
    </div>
  )
}
