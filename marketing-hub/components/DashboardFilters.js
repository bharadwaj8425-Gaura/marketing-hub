'use client'

import { useRouter } from 'next/navigation'
import { personName } from '@/lib/constants'

export default function DashboardFilters({ projects, people, space, person }) {
  const router = useRouter()
  const go = (next) => {
    const q = new URLSearchParams()
    const s = next.space ?? space
    const p = next.person ?? person
    if (s) q.set('space', s)
    if (p) q.set('person', p)
    router.push(`/dashboard${q.toString() ? `?${q}` : ''}`)
  }
  const cls = 'h-9 rounded-md border border-slate-300 px-3 text-sm'
  return (
    <div className="flex flex-wrap gap-2">
      <select value={space} onChange={(e) => go({ space: e.target.value })} className={`${cls} w-56`}>
        <option value="">All spaces</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select value={person} onChange={(e) => go({ person: e.target.value })} className={`${cls} w-36`}>
        <option value="">Everyone</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {personName(p)}
          </option>
        ))}
      </select>
    </div>
  )
}
