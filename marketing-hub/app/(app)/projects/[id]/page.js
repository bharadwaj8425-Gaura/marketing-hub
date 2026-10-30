import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProjectTasks from '@/components/ProjectTasks'

export default async function ProjectPage({ params, searchParams }) {
  const { id } = await params
  const { task: openTaskId, folder, newmonth } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [projectRes, tasksRes, foldersRes, peopleRes, meRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).maybeSingle(),
    supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('folders').select('*').eq('project_id', id).order('month', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])

  if (!projectRes.data) notFound()
  const tasks = tasksRes.data ?? []

  // Subtask / file / comment counts for the board cards (optional tables)
  const ids = tasks.map((t) => t.id)
  const stats = {}
  if (ids.length) {
    const [itemsRes, filesRes, commentsRes] = await Promise.all([
      supabase.from('task_items').select('task_id, kind, done').in('task_id', ids),
      supabase.from('task_files').select('task_id').in('task_id', ids),
      supabase.from('comments').select('task_id').in('task_id', ids),
    ])
    const s = (id) => (stats[id] ||= { sub: 0, subDone: 0, files: 0, comments: 0 })
    ;(itemsRes.data ?? []).forEach((r) => {
      if (r.kind !== 'subtask') return
      s(r.task_id).sub++
      if (r.done) s(r.task_id).subDone++
    })
    ;(filesRes.data ?? []).forEach((r) => s(r.task_id).files++)
    ;(commentsRes.data ?? []).forEach((r) => s(r.task_id).comments++)
  }

  return (
    <ProjectTasks
      key={`${id}-${folder || 'all'}`}
      project={projectRes.data}
      initialTasks={tasks}
      initialFolders={foldersRes.data ?? []}
      people={peopleRes.data ?? []}
      currentUser={{ id: user.id, role: meRes.data?.role ?? 'member' }}
      openTaskId={openTaskId}
      initialFolderId={folder || 'all'}
      openNewMonth={!!newmonth}
      stats={stats}
    />
  )
}
