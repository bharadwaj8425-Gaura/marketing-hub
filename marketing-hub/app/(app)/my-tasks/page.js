import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusOf, priorityOf } from '@/lib/constants'
import { formatDate, isOverdue } from '@/lib/dates'
import TimerButton from '@/components/TimerButton'

function sortByDue(a, b) {
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
  if (a.due_date) return -1
  if (b.due_date) return 1
  return b.created_at.localeCompare(a.created_at)
}

function TaskTable({ tasks, projectsById, showTimer }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="px-4 py-3 font-medium">Space</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Due</th>
            {showTimer && <th className="px-4 py-3 font-medium">Timer</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const project = projectsById[t.project_id]
            const st = statusOf(t.status)
            const pr = priorityOf(t.priority)
            const overdue = isOverdue(t)
            return (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/projects/${t.project_id}?task=${t.id}`} className="hover:text-indigo-600">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: project?.color ?? '#94a3b8' }}
                    />
                    {project?.name ?? '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.badge}`}>{st.label}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${pr.badge}`}>{pr.label}</span>
                </td>
                <td
                  className={`px-4 py-3 ${overdue ? 'font-medium text-red-600' : 'text-slate-600'}`}
                  suppressHydrationWarning
                >
                  {formatDate(t.due_date)}
                  {overdue && ' (overdue)'}
                </td>
                {showTimer && (
                  <td className="px-4 py-3">
                    <TimerButton taskId={t.id} compact />
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function MyTasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [tasksRes, reviewRes, projectsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('assignee_id', user.id).neq('status', 'done'),
    supabase.from('tasks').select('*').eq('reviewer_id', user.id).eq('status', 'review'),
    supabase.from('projects').select('id, name, color'),
  ])

  const projectsById = Object.fromEntries((projectsRes.data ?? []).map((p) => [p.id, p]))
  const tasks = (tasksRes.data ?? []).sort(sortByDue)
  const reviews = (reviewRes.data ?? []).sort(sortByDue)

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold">My Tasks</h1>
      <p className="mt-1 text-slate-500">Tasks assigned to you. Completed tasks are hidden.</p>

      {reviews.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold">Awaiting your review ({reviews.length})</h2>
          <TaskTable tasks={reviews} projectsById={projectsById} />
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">Assigned to me ({tasks.length})</h2>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            You have no open tasks.
          </div>
        ) : (
          <TaskTable tasks={tasks} projectsById={projectsById} showTimer />
        )}
      </section>
    </div>
  )
}
