import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isManagerRole, personName, fmtDuration } from '@/lib/constants'
import { addMonths, monthLabel, dayKey, formatTime } from '@/lib/dates'
import { fetchMonthEntries, entrySeconds, validMonth } from '@/lib/timeData'

function Bar({ label, seconds, max, color = '#6366f1' }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <span className="w-40 shrink-0 truncate sm:w-56">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${max ? Math.max(2, (seconds / max) * 100) : 0}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-16 shrink-0 text-right font-medium">{fmtDuration(seconds)}</span>
    </div>
  )
}

export default async function TimePage({ searchParams }) {
  const sp = await searchParams
  const ym = validMonth(sp.m)
  const monthStart = `${ym}-01`

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [entries, peopleRes, meRes] = await Promise.all([
    fetchMonthEntries(supabase, ym),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])
  const people = Object.fromEntries((peopleRes.data ?? []).map((p) => [p.id, p]))
  const isManager = isManagerRole(meRes.data?.role)

  const mine = entries.filter((e) => e.user_id === user.id)
  const total = mine.reduce((s, e) => s + entrySeconds(e), 0)

  const bySpace = {}
  const byTask = {}
  const byDay = {}
  mine.forEach((e) => {
    const sec = entrySeconds(e)
    const proj = e.tasks?.projects
    const pk = proj?.name || 'Unknown'
    bySpace[pk] ||= { seconds: 0, color: proj?.color }
    bySpace[pk].seconds += sec
    byTask[e.task_id] ||= { title: e.tasks?.title || 'Deleted task', space: pk, seconds: 0 }
    byTask[e.task_id].seconds += sec
    const dk = dayKey(e.started_at)
    byDay[dk] = (byDay[dk] || 0) + sec
  })
  const spaceRows = Object.entries(bySpace).sort((a, b) => b[1].seconds - a[1].seconds)
  const taskRows = Object.values(byTask).sort((a, b) => b.seconds - a.seconds).slice(0, 10)
  const dayRows = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]))

  const byPerson = {}
  if (isManager) {
    entries.forEach((e) => {
      byPerson[e.user_id] = (byPerson[e.user_id] || 0) + entrySeconds(e)
    })
  }
  const personRows = Object.entries(byPerson).sort((a, b) => b[1] - a[1])

  const prev = addMonths(monthStart, -1).slice(0, 7)
  const next = addMonths(monthStart, 1).slice(0, 7)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Time Tracking</h1>
          <p className="mt-1 text-slate-500">Your tracked time, month by month.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/time?m=${prev}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            ←
          </Link>
          <span className="min-w-[8rem] text-center font-medium">{monthLabel(monthStart)}</span>
          <Link href={`/time?m=${next}`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            →
          </Link>
          <a
            href={`/time/export?m=${ym}`}
            className="ml-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ⬇ CSV
          </a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Your total time</p>
          <p className="mt-2 text-3xl font-semibold">{fmtDuration(total)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Entries</p>
          <p className="mt-2 text-3xl font-semibold">{mine.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Days worked</p>
          <p className="mt-2 text-3xl font-semibold">{dayRows.length}</p>
        </div>
      </div>

      {mine.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No time tracked this month. Press ▶ Start on any task to begin.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 font-semibold">By space</h2>
              {spaceRows.map(([name, v]) => (
                <Bar key={name} label={name} seconds={v.seconds} max={spaceRows[0][1].seconds} color={v.color} />
              ))}
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-2 font-semibold">Top tasks</h2>
              {taskRows.map((t, i) => (
                <Bar key={i} label={t.title} seconds={t.seconds} max={taskRows[0].seconds} />
              ))}
            </section>
          </div>

          <section className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <h2 className="px-5 pt-5 font-semibold">Entries</h2>
            <table className="mt-3 w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Task</th>
                  <th className="px-4 py-2 font-medium">Space</th>
                  <th className="px-4 py-2 font-medium">Time</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-600">{dayKey(e.started_at)}</td>
                    <td className="px-4 py-2 font-medium">
                      {e.tasks?.project_id ? (
                        <Link href={`/projects/${e.tasks.project_id}?task=${e.task_id}`} className="hover:text-indigo-600">
                          {e.tasks?.title}
                        </Link>
                      ) : (
                        'Deleted task'
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{e.tasks?.projects?.name ?? '-'}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {formatTime(e.started_at)}
                      {e.ended_at ? ` - ${formatTime(e.ended_at)}` : ' - running'}
                    </td>
                    <td className="px-4 py-2 font-medium">{fmtDuration(entrySeconds(e))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {isManager && personRows.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 font-semibold">Whole team (visible to managers and admins only)</h2>
          {personRows.map(([id, sec]) => (
            <Bar key={id} label={personName(people[id])} seconds={sec} max={personRows[0][1]} color="#0ea5e9" />
          ))}
        </section>
      )}
    </div>
  )
}
