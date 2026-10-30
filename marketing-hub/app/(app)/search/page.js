import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { statusOf, personName } from '@/lib/constants'
import { formatDate } from '@/lib/dates'

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams
  const term = String(q).trim().slice(0, 100)
  const supabase = await createClient()

  let tasks = []
  let videos = []
  if (term) {
    const like = `%${term.replace(/[%_,()]/g, ' ')}%`
    const [tRes, vRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, description, status, due_date, project_id, assignee_id, projects(name, color)')
        .or(`title.ilike.${like},description.ilike.${like},content_type.ilike.${like}`)
        .limit(50),
      supabase.from('videos').select('id, title, code, status').or(`title.ilike.${like},code.ilike.${like}`).limit(20),
    ])
    tasks = tRes.data ?? []
    videos = vRes.data ?? []
  }
  const { data: people } = await supabase.from('profiles').select('id, full_name, email')
  const byId = Object.fromEntries((people ?? []).map((p) => [p.id, p]))

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl">Search</h1>
      <p className="text-sm text-slate-500">
        {term ? `${tasks.length + videos.length} result${tasks.length + videos.length === 1 ? '' : 's'} for "${term}"` : 'Type in the search box above.'}
      </p>

      {tasks.length > 0 && (
        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border bg-white">
          {tasks.map((t) => {
            const st = statusOf(t.status)
            return (
              <Link key={t.id} href={`/projects/${t.project_id}?task=${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: t.projects?.color || '#8a9c96' }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="truncate text-[12.5px] text-slate-500">
                    {t.projects?.name} · {t.assignee_id ? personName(byId[t.assignee_id]) : 'Unassigned'}
                    {t.due_date ? ` · Due ${formatDate(t.due_date)}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${st.badge}`}>{st.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {videos.length > 0 && (
        <>
          <h2 className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Video library</h2>
          <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border bg-white">
            {videos.map((v) => (
              <Link key={v.id} href="/videos" className="block px-4 py-3 hover:bg-slate-50">
                <p className="font-medium">{v.title}</p>
                <p className="text-[12.5px] text-slate-500">{[v.code, v.status].filter(Boolean).join(' · ')}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
