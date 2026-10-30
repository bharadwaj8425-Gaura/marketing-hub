import { monthRange, todayStr } from './dates'

export function validMonth(m) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '') ? m : todayStr().slice(0, 7)
}

// Ek mahine ki saari time entries (RLS ke hisaab se: member ko apni, manager ko sabki)
export async function fetchMonthEntries(supabase, ym) {
  const { from, to } = monthRange(ym)
  const { data } = await supabase
    .from('time_entries')
    .select(
      'id, task_id, user_id, started_at, ended_at, duration_seconds, note, tasks(title, project_id, projects(name, color))'
    )
    .gte('started_at', from)
    .lt('started_at', to)
    .order('started_at', { ascending: false })
    .limit(5000)
  return data ?? []
}

export function entrySeconds(e) {
  if (e.duration_seconds != null) return e.duration_seconds
  if (!e.ended_at) return Math.max(0, Math.floor((Date.now() - new Date(e.started_at).getTime()) / 1000))
  return 0
}
