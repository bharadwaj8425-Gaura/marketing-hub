import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'

// Wraps every logged-in page: dark sidebar with spaces + top bar
export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, projectsRes, foldersRes, tasksRes, mineRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role').eq('id', user.id).single(),
    supabase.from('projects').select('id, name, color').eq('archived', false).order('created_at'),
    supabase.from('folders').select('id, project_id, name, month').order('month', { ascending: true }),
    supabase.from('tasks').select('project_id, folder_id, status'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('assignee_id', user.id).neq('status', 'done'),
  ])

  const counts = {}
  ;(tasksRes.data ?? []).forEach((t) => {
    if (t.status === 'done') return
    counts[t.project_id] = (counts[t.project_id] || 0) + 1
    if (t.folder_id) counts[t.folder_id] = (counts[t.folder_id] || 0) + 1
  })
  const spaces = (projectsRes.data ?? []).map((p) => ({
    ...p,
    open: counts[p.id] || 0,
    folders: (foldersRes.data ?? [])
      .filter((f) => f.project_id === p.id)
      .map((f) => ({ id: f.id, month: f.month, open: counts[f.id] || 0 })),
  }))
  const totalOpen = spaces.reduce((s, p) => s + p.open, 0)

  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<div className="hidden w-[272px] shrink-0 bg-side md:block" />}>
      <Sidebar
        profile={profileRes.data ?? { id: user.id, email: user.email }}
        spaces={spaces}
        totalOpen={totalOpen}
        myOpen={mineRes.count || 0}
      />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-w-0 flex-1 animate-fade-up px-4 py-5 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
