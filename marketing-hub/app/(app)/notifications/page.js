import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/dates'
import MarkAllRead from '@/components/MarkAllRead'

const ICON = { assigned: '📌', comment: '💬', status: '🔄', review: '🔍' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*, tasks(project_id)')
    .order('created_at', { ascending: false })
    .limit(60)

  const items = data ?? []
  const unread = items.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-slate-500">
            Assignments, comments, status changes and approval requests.
          </p>
        </div>
        <MarkAllRead disabled={unread === 0} />
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          You're all caught up. No notifications.
        </div>
      ) : (
        <div className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {items.map((n) => {
            const href = n.tasks?.project_id ? `/projects/${n.tasks.project_id}?task=${n.task_id}` : null
            const body = (
              <div className={`flex items-start gap-3 px-4 py-3 ${n.is_read ? '' : 'bg-indigo-50/60'}`}>
                <span className="mt-0.5 text-lg">{ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${n.is_read ? '' : 'font-medium'}`}>{n.message}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}
              </div>
            )
            return href ? (
              <Link key={n.id} href={href} className="block hover:bg-slate-50">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
