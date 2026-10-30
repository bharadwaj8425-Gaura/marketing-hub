// Company India mein hai, isliye har jagah IST (Asia/Kolkata) use hota hai.
// Task dates database mein "YYYY-MM-DD" text ki tarah aati hain.

export const APP_TZ = 'Asia/Kolkata'

export function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: APP_TZ }) // YYYY-MM-DD
}

export function formatDate(value) {
  if (!value) return '-'
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function isOverdue(task) {
  return !!task.due_date && task.status !== 'done' && task.due_date < todayStr()
}

// "2026-11-01" helpers (month folders)
export function currentMonthStart() {
  return todayStr().slice(0, 7) + '-01'
}

export function addMonths(monthStr, n) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export function monthLabel(monthStr, short = false) {
  const [y, m] = monthStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    month: short ? 'short' : 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// "2026-11" -> start and end of that month in IST, as UTC ISO strings
export function monthRange(ym) {
  const from = new Date(`${ym}-01T00:00:00+05:30`).toISOString()
  const to = new Date(`${addMonths(`${ym}-01`, 1)}T00:00:00+05:30`).toISOString()
  return { from, to }
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: APP_TZ,
  })
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: APP_TZ,
  })
}

// "YYYY-MM-DD" of a timestamp, in IST
export function dayKey(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: APP_TZ })
}
