import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isManagerRole } from '@/lib/constants'
import NewProjectButton from '@/components/NewProjectButton'
import SeedSpacesButton from '@/components/SeedSpacesButton'

export default async function ProjectsPage({ searchParams }) {
  const sp = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profileRes, projectsRes, tasksRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('projects').select('*').eq('archived', false).order('created_at', { ascending: true }),
    supabase.from('tasks').select('project_id, status'),
  ])

  const projects = projectsRes.data ?? []
  const tasks = tasksRes.data ?? []
  const canCreate = isManagerRole(profileRes.data?.role)

  const stats = {}
  tasks.forEach((t) => {
    const s = (stats[t.project_id] ||= { total: 0, done: 0 })
    s.total += 1
    if (t.status === 'done') s.done += 1
  })

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Spaces</h1>
          <p className="mt-1 text-slate-500">Each space contains monthly folders and tasks.</p>
        </div>
        {canCreate && (
          <div className="flex flex-wrap items-start gap-2">
            <SeedSpacesButton userId={user.id} existingNames={projects.map((p) => p.name)} />
            <NewProjectButton userId={user.id} autoOpen={sp?.new === '1'} />
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {canCreate
            ? 'No spaces yet. Use "Add FinStreet default spaces" to create all 7 in one click, or "+ New space" to create your own.'
            : 'No spaces yet. Ask your manager to create one.'}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const s = stats[p.id] || { total: 0, done: 0 }
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <h2 className="font-semibold">{p.name}</h2>
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                )}
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: p.color }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {s.done} of {s.total} tasks completed
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
