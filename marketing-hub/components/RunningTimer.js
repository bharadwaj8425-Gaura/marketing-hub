'use client'

import Link from 'next/link'
import { Square } from 'lucide-react'
import { useRunningTimer, useElapsed, stopTimer } from '@/lib/timer'
import { fmtClock } from '@/lib/constants'

// Shown in the sidebar while a timer is running
export default function RunningTimer() {
  const { entry } = useRunningTimer()
  const elapsed = useElapsed(entry?.started_at)

  if (!entry) return null
  const tooLong = elapsed > 8 * 3600
  const href = entry.tasks?.project_id ? `/projects/${entry.tasks.project_id}?task=${entry.task_id}` : '/projects'

  return (
    <div className="rounded-lg border border-side-line bg-side-active p-3">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-[#5ed0b0]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5ed0b0] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5ed0b0]" />
        </span>
        Timer running
      </p>
      <Link href={href} className="mt-1 block truncate text-[13px] text-white hover:underline">
        {entry.tasks?.title ?? 'Task'}
      </Link>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="font-mono text-lg font-semibold tabular-nums text-white">{fmtClock(elapsed)}</p>
        <button
          onClick={() => stopTimer()}
          className="flex items-center gap-1 rounded-md bg-[#b42318] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#9a1e14]"
        >
          <Square size={10} fill="currentColor" /> Stop
        </button>
      </div>
      {tooLong && <p className="mt-1 text-[11px] text-[#f0b955]">Running for over 8 hours. Forgot to stop it?</p>}
    </div>
  )
}
