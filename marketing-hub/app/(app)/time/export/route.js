import { createClient } from '@/lib/supabase/server'
import { personName } from '@/lib/constants'
import { dayKey, formatTime } from '@/lib/dates'
import { fetchMonthEntries, entrySeconds, validMonth } from '@/lib/timeData'

function csvCell(v) {
  const s = String(v ?? '')
  // Excel formula injection se bachne ke liye = + - @ se shuru hone wale text ke aage ' laga do
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

// Time entries ko CSV (Excel mein khulne wali file) ki tarah download karo
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ym = validMonth(searchParams.get('m'))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Login required', { status: 401 })

  const [entries, peopleRes] = await Promise.all([
    fetchMonthEntries(supabase, ym),
    supabase.from('profiles').select('id, full_name, email'),
  ])
  const people = Object.fromEntries((peopleRes.data ?? []).map((p) => [p.id, p]))

  const rows = [['Date', 'Person', 'Space', 'Task', 'Start', 'End', 'Minutes', 'Note']]
  entries.forEach((e) => {
    rows.push([
      dayKey(e.started_at),
      personName(people[e.user_id]),
      e.tasks?.projects?.name ?? '',
      e.tasks?.title ?? '',
      formatTime(e.started_at),
      e.ended_at ? formatTime(e.ended_at) : 'running',
      Math.round(entrySeconds(e) / 60),
      e.note ?? '',
    ])
  })

  const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="time-${ym}.csv"`,
    },
  })
}
