'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const TITLES = [
  ['/dashboard', 'Dashboard'],
  ['/my-tasks', 'My tasks'],
  ['/chat', 'Team chat'],
  ['/videos', 'Video library'],
  ['/time', 'Time and reports'],
  ['/team', 'Team and access'],
  ['/data', 'Import & export'],
  ['/notifications', 'Notifications'],
  ['/search', 'Search'],
  ['/projects', 'Spaces'],
]

export default function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let off = false
    createClient()
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .then(({ count }) => !off && setUnread(count || 0))
    return () => {
      off = true
    }
  }, [pathname])

  const title = TITLES.find(([p]) => pathname === p || pathname.startsWith(p + '/'))?.[1] ?? ''

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6 lg:px-8">
      <button
        onClick={() => window.dispatchEvent(new Event('open-sidebar'))}
        aria-label="Open menu"
        className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 md:hidden"
      >
        <Menu size={18} />
      </button>
      <span className="hidden font-display text-[19px] font-bold tracking-tight sm:block">{title}</span>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`)
        }}
        className="relative w-full max-w-sm"
      >
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks, briefs"
          className="h-9 w-full rounded-md border border-slate-200 !bg-slate-100 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:!bg-white"
        />
      </form>
      <Link
        href="/notifications"
        aria-label="Notifications"
        className="relative ml-auto rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-[#b42318] px-1 text-center text-[10.5px] font-bold leading-[18px] text-white">
            {unread}
          </span>
        )}
      </Link>
    </header>
  )
}
