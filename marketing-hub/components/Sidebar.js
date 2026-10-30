'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutGrid,
  CheckSquare,
  MessageSquare,
  Video,
  Clock,
  Users,
  ArrowDownUp,
  LogOut,
  FileText,
  Plus,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetTimer } from '@/lib/timer'
import { monthLabel } from '@/lib/dates'
import RunningTimer from './RunningTimer'
import Avatar from './Avatar'

const ROLE_LABEL = { admin: 'Admin', manager: 'Manager', member: 'Team Member' }

function NavLink({ href, icon: Icon, label, active, badge }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] transition-colors ${
        active ? 'bg-side-active text-white' : 'text-side-fg hover:bg-side-line'
      }`}
    >
      <Icon size={16} strokeWidth={1.9} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold leading-[18px] text-white">{badge}</span>
      )}
    </Link>
  )
}

export default function Sidebar({ profile, spaces = [], totalOpen = 0, myOpen = 0 }) {
  const pathname = usePathname()
  const search = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('open-sidebar', onOpen)
    return () => window.removeEventListener('open-sidebar', onOpen)
  }, [])
  useEffect(() => setOpen(false), [pathname, search])

  async function logout() {
    await createClient().auth.signOut()
    resetTimer()
    router.push('/login')
    router.refresh()
  }

  const name = profile?.full_name || profile?.email || 'User'
  const role = profile?.role || 'member'
  const isManager = role === 'admin' || role === 'manager'
  const is = (href) => pathname === href || pathname.startsWith(href + '/')
  const activeSpace = pathname.startsWith('/projects/') ? pathname.split('/')[2] : null
  const activeFolder = search.get('folder')

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`side-scroll fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col overflow-y-auto bg-side px-3 pb-3 pt-4 text-side-fg transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-1.5 pb-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-display text-sm font-extrabold text-white">
              FS
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[16px] font-bold text-white">FinStreet Marketing</span>
              <span className="block text-[11.5px] text-side-muted">Workspace</span>
            </span>
          </Link>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-side-muted hover:bg-side-line md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-0.5">
          <NavLink href="/dashboard" icon={LayoutGrid} label="Dashboard" active={is('/dashboard')} />
          <NavLink href="/my-tasks" icon={CheckSquare} label="My tasks" active={is('/my-tasks')} badge={myOpen} />
          <NavLink href="/chat" icon={MessageSquare} label="Team chat" active={is('/chat')} />
          <NavLink href="/videos" icon={Video} label="Video library" active={is('/videos')} />
          <NavLink href="/time" icon={Clock} label="Time and reports" active={is('/time')} />
          {isManager && <NavLink href="/team" icon={Users} label="Team and access" active={is('/team')} />}
          <NavLink href="/data" icon={ArrowDownUp} label="Import & export" active={is('/data')} />
        </nav>

        <div className="mt-5 flex items-center justify-between px-2.5 pb-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-side-muted">Spaces</span>
          {isManager && (
            <Link href="/projects?new=1" title="New space" className="rounded p-0.5 text-side-muted hover:bg-side-line hover:text-white">
              <Plus size={15} />
            </Link>
          )}
        </div>

        <div className="space-y-0.5">
          <Link
            href="/projects"
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] ${
              pathname === '/projects' ? 'bg-side-active text-white' : 'hover:bg-side-line'
            }`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-side-muted" />
            <span className="flex-1">All spaces</span>
            <span className="text-[11.5px] text-side-muted">{totalOpen}</span>
          </Link>

          {spaces.map((s) => {
            const on = activeSpace === s.id
            return (
              <div key={s.id}>
                <Link
                  href={`/projects/${s.id}`}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] ${
                    on && !activeFolder ? 'bg-side-active text-white' : on ? 'text-white' : 'hover:bg-side-line'
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span className="flex-1 truncate">{s.name}</span>
                  <span className="text-[11.5px] text-side-muted">{s.open}</span>
                </Link>
                {on && (
                  <div className="my-1 ml-[18px] space-y-0.5 border-l border-side-line pl-2">
                    {s.folders.map((f) => (
                      <Link
                        key={f.id}
                        href={`/projects/${s.id}?folder=${f.id}`}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                          activeFolder === f.id ? 'bg-side-active text-white' : 'text-side-muted hover:bg-side-line hover:text-side-fg'
                        }`}
                      >
                        <FileText size={13} className="shrink-0" />
                        <span className="flex-1">{monthLabel(f.month)}</span>
                        <span className="text-[11px]">{f.open}</span>
                      </Link>
                    ))}
                    <Link
                      href={`/projects/${s.id}?newmonth=1`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-side-muted hover:bg-side-line hover:text-side-fg"
                    >
                      <Plus size={13} /> New month
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-auto pt-4">
          <RunningTimer />
          <div className="mt-2 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Avatar name={name} id={profile?.id || name} size={34} ring={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-white">{name}</p>
              <p className="text-[11.5px] text-side-muted">{ROLE_LABEL[role] || role}</p>
            </div>
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="rounded-md p-2 text-side-muted hover:bg-side-line hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
