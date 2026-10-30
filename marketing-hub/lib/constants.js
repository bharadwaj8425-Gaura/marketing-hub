export const STATUSES = [
  { value: 'todo', label: 'To Do', badge: 'bg-[#e2e8e5] text-[#55645f]', color: '#55645f' },
  { value: 'in_progress', label: 'In Progress', badge: 'bg-[#dce9f8] text-[#1f5fa8]', color: '#1f5fa8' },
  { value: 'review', label: 'Review Required', badge: 'bg-[#fbebcb] text-[#8f5a0b]', color: '#8f5a0b' },
  { value: 'changes_required', label: 'Changes Required', badge: 'bg-[#fadfd9] text-[#b3361f]', color: '#b3361f' },
  { value: 'approved', label: 'Approved', badge: 'bg-[#e6f0cf] text-[#4d7c0f]', color: '#4d7c0f' },
  { value: 'done', label: 'Completed', badge: 'bg-[#d6ede6] text-[#0b6e5b]', color: '#0b6e5b' },
  { value: 'on_hold', label: 'On Hold', badge: 'bg-[#e8e3f4] text-[#6b5b95]', color: '#6b5b95' },
]

// Sirf reviewer ya manager ye status laga sakta hai
export const REVIEW_ONLY = ['approved', 'changes_required']

export const PRIORITIES = [
  { value: 'low', label: 'Low', badge: 'bg-[#eef1f0] text-[#6a7b75]', color: '#6a7b75' },
  { value: 'medium', label: 'Medium', badge: 'bg-[#e3edf9] text-[#2f6db5]', color: '#2f6db5' },
  { value: 'high', label: 'High', badge: 'bg-[#fbeedd] text-[#b8620b]', color: '#b8620b' },
  { value: 'urgent', label: 'Urgent', badge: 'bg-[#fbe4e1] text-[#c0301b]', color: '#c0301b' },
]

export const CONTENT_TYPES = [
  'YouTube video',
  'YouTube Short / Reel',
  'Social media post',
  'Carousel / Story',
  'Blog / Article',
  'Email / Newsletter',
  'Ad creative',
  'Event / Workshop',
  'Podcast episode',
  'Other',
]

export const PROJECT_COLORS = ['#d9433b', '#d97a1e', '#2a7de1', '#8a5cd6', '#1b9e77', '#0f8b9e', '#6b7a75', '#c2417d']

export const DEFAULT_SPACES = [
  'FinStreet YouTube Channel',
  'Aditya Shelar YouTube Channel',
  'Social Media',
  'Paid Marketing & Campaigns',
  'Events & Workshops',
  'B2B & Institutional Partnerships',
  'Website & Other Projects',
]

export const statusOf = (value) => STATUSES.find((s) => s.value === value) || STATUSES[0]
export const priorityOf = (value) => PRIORITIES.find((p) => p.value === value) || PRIORITIES[1]

export const isManagerRole = (role) => role === 'admin' || role === 'manager'

export const personName = (p) => p?.full_name || p?.email || 'Unknown'

// Approved / Changes Required: sirf manager ya us task ka reviewer
export function canSetStatus(status, task, user) {
  if (!REVIEW_ONLY.includes(status)) return true
  return isManagerRole(user.role) || (!!task && task.reviewer_id === user.id)
}

// 7500 -> "2h 05m"
export function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}m`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

// 3725 -> "01:02:05"
export function fmtClock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0))
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
