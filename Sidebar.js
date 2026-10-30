'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { label: 'Dashboard', href: '/dashboard', ready: true },
  { label: 'Projects', href: '/projects', ready: false },
  { label: 'My Tasks', href: '/my-tasks', ready: false },
  { label: 'Timeline', href: '/timeline', ready: false },
  { label: 'Time Tracking', href: '/time', ready: false },
  { label: 'Team', href: '/team', ready: false },
]

const ROLE_STYLE = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  member: 'bg-slate-100 text-slate-600',
}

export default function Sidebar({ profile }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = profile?.full_name || profile?.email || 'User'
  const role = profile?.role || 'member'

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          M
        </div>
        <span className="font-semibold">Marketing Tasks</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href
          if (!item.ready) {
            return (
              <div
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400"
              >
                {item.label}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  Soon
                </span>
              </div>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="truncate text-sm font-medium">{name}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLE[role]}`}
        >
          {role}
        </span>
        <button
          onClick={logout}
          className="mt-3 block w-full rounded-lg border border-slate-300 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
