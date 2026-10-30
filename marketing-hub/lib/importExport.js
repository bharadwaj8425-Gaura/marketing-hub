// Import / export helpers (browser only). The spreadsheet library is loaded on demand.
import { STATUSES, PRIORITIES, PROJECT_COLORS, personName } from './constants'
import { dayKey, formatTime, monthRange, todayStr } from './dates'

export const TEMPLATE_COLUMNS = [
  'Space',
  'Title',
  'Description',
  'Status',
  'Priority',
  'Content Type',
  'Assignee Email',
  'Reviewer Email',
  'Start Date',
  'Due Date',
  'Month Folder',
]

export const TEMPLATE_EXAMPLES = [
  ['Social Media', 'Diwali offer reel', 'Script + edit, 30 sec', 'To Do', 'High', 'YouTube Short / Reel', '', '', '2026-11-01', '2026-11-05', '2026-11'],
  ['FinStreet YouTube Channel', 'Mutual funds for beginners - long video', 'Research, script, shoot, edit', 'In Progress', 'Medium', 'YouTube video', '', '', '2026-11-02', '2026-11-15', '2026-11'],
]

async function XLSX() {
  return await import('xlsx')
}

function stamp() {
  return todayStr()
}

// Excel formula injection guard
function safeCell(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return `'${v}`
  return v ?? ''
}

export async function downloadSheets(filename, sheets, format = 'xlsx') {
  const X = await XLSX()
  const wb = X.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    const ws = X.utils.aoa_to_sheet(rows.map((r) => r.map(safeCell)))
    ws['!cols'] = rows[0]?.map((h, i) => ({
      wch: Math.min(50, Math.max(String(h).length + 2, ...rows.slice(1, 200).map((r) => String(r[i] ?? '').length + 1))),
    }))
    X.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  })
  if (format === 'csv') {
    X.writeFile(wb, `${filename}.csv`, { bookType: 'csv' })
  } else {
    X.writeFile(wb, `${filename}.xlsx`, { compression: true })
  }
}

export async function downloadTemplate(format = 'xlsx') {
  await downloadSheets(
    'task-import-template',
    [
      { name: 'Tasks', rows: [TEMPLATE_COLUMNS, ...TEMPLATE_EXAMPLES] },
      {
        name: 'Help',
        rows: [
          ['Column', 'Required', 'Allowed values / format'],
          ['Space', 'Yes', 'Exact space name. New spaces are created automatically (managers only).'],
          ['Title', 'Yes', 'Task name'],
          ['Description', 'No', 'Brief / notes'],
          ['Status', 'No', STATUSES.map((s) => s.label).join(', ') + ' (default: To Do)'],
          ['Priority', 'No', PRIORITIES.map((p) => p.label).join(', ') + ' (default: Medium)'],
          ['Content Type', 'No', 'e.g. YouTube video, Social media post, Ad creative'],
          ['Assignee Email', 'No', 'Work email of a team member who has signed up'],
          ['Reviewer Email', 'No', 'Work email of the approver'],
          ['Start Date', 'No', 'YYYY-MM-DD or DD/MM/YYYY'],
          ['Due Date', 'No', 'YYYY-MM-DD or DD/MM/YYYY (the deadline)'],
          ['Month Folder', 'No', 'YYYY-MM, e.g. 2026-11. Folder is created if missing.'],
        ],
      },
    ],
    format
  )
}

// ---------------------------------------------------------------- EXPORT

export async function exportTasks(supabase, format) {
  const rows = await buildTaskRows(supabase)
  await downloadSheets(`tasks-${stamp()}`, [{ name: 'Tasks', rows }], format)
  return rows.length - 1
}

async function timeRows(supabase, ym) {
  let q = supabase
    .from('time_entries')
    .select('user_id, started_at, ended_at, duration_seconds, note, tasks(title, projects(name))')
    .order('started_at', { ascending: true })
    .limit(20000)
  if (ym) {
    const { from, to } = monthRange(ym)
    q = q.gte('started_at', from).lt('started_at', to)
  }
  const [{ data, error }, peopleRes] = await Promise.all([q, supabase.from('profiles').select('id, full_name, email')])
  if (error) throw error
  const people = Object.fromEntries((peopleRes.data ?? []).map((p) => [p.id, p]))
  const rows = [['Date', 'Person', 'Email', 'Space', 'Task', 'Start', 'End', 'Minutes', 'Hours', 'Note']]
  ;(data ?? []).forEach((e) => {
    const sec =
      e.duration_seconds ??
      (e.ended_at ? 0 : Math.max(0, Math.floor((Date.now() - new Date(e.started_at).getTime()) / 1000)))
    rows.push([
      dayKey(e.started_at),
      personName(people[e.user_id]),
      people[e.user_id]?.email ?? '',
      e.tasks?.projects?.name ?? '',
      e.tasks?.title ?? 'Deleted task',
      formatTime(e.started_at),
      e.ended_at ? formatTime(e.ended_at) : 'running',
      Math.round(sec / 60),
      Math.round((sec / 3600) * 100) / 100,
      e.note ?? '',
    ])
  })
  return rows
}

export async function exportTime(supabase, ym, format) {
  const rows = await timeRows(supabase, ym)
  await downloadSheets(`time-${ym || 'all'}`, [{ name: 'Time', rows }], format)
  return rows.length - 1
}

export async function exportBackup(supabase) {
  const [taskSheet, timeRowsAll, projectsRes, peopleRes, chatRes, channelsRes] = await Promise.all([
    buildTaskRows(supabase),
    timeRows(supabase, null),
    supabase.from('projects').select('name, description, color, archived, created_at'),
    supabase.from('profiles').select('id, full_name, email, role'),
    supabase.from('chat_messages').select('channel_id, user_id, body, created_at').order('created_at').limit(20000),
    supabase.from('chat_channels').select('id, name, projects(name)'),
  ])
  const byId = Object.fromEntries((peopleRes.data ?? []).map((p) => [p.id, p]))
  const channels = Object.fromEntries((channelsRes.data ?? []).map((c) => [c.id, c.projects?.name || c.name]))

  await downloadSheets(`marketing-hub-backup-${stamp()}`, [
    { name: 'Tasks', rows: taskSheet },
    { name: 'Time', rows: timeRowsAll },
    {
      name: 'Spaces',
      rows: [
        ['Name', 'Description', 'Color', 'Archived', 'Created'],
        ...(projectsRes.data ?? []).map((p) => [p.name, p.description ?? '', p.color, p.archived ? 'Yes' : 'No', dayKey(p.created_at)]),
      ],
    },
    {
      name: 'Team',
      rows: [['Name', 'Email', 'Role'], ...(peopleRes.data ?? []).map((p) => [p.full_name ?? '', p.email, p.role])],
    },
    {
      name: 'Chat',
      rows: [
        ['Date', 'Time', 'Channel', 'Person', 'Message'],
        ...(chatRes.data ?? []).map((m) => [
          dayKey(m.created_at),
          formatTime(m.created_at),
          channels[m.channel_id] ?? '',
          personName(byId[m.user_id]),
          m.body,
        ]),
      ],
    },
  ])
}

async function buildTaskRows(supabase) {
  const [tasksRes, peopleRes, projectsRes, foldersRes] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: true }).limit(20000),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('projects').select('id, name'),
    supabase.from('folders').select('id, month'),
  ])
  const people = Object.fromEntries((peopleRes.data ?? []).map((p) => [p.id, p]))
  const projects = Object.fromEntries((projectsRes.data ?? []).map((p) => [p.id, p]))
  const folders = Object.fromEntries((foldersRes.data ?? []).map((f) => [f.id, f]))
  if (tasksRes.error) throw tasksRes.error
  const label = (list, v) => list.find((x) => x.value === v)?.label ?? v ?? ''
  return [
    [...TEMPLATE_COLUMNS, 'Assignee', 'Reviewer', 'Created By', 'Created At', 'Task ID'],
    ...(tasksRes.data ?? []).map((t) => [
      projects[t.project_id]?.name ?? '',
      t.title,
      t.description ?? '',
      label(STATUSES, t.status),
      label(PRIORITIES, t.priority),
      t.content_type ?? '',
      people[t.assignee_id]?.email ?? '',
      people[t.reviewer_id]?.email ?? '',
      t.start_date ?? '',
      t.due_date ?? '',
      folders[t.folder_id]?.month?.slice(0, 7) ?? '',
      t.assignee_id ? personName(people[t.assignee_id]) : '',
      t.reviewer_id ? personName(people[t.reviewer_id]) : '',
      t.created_by ? personName(people[t.created_by]) : '',
      t.created_at ? dayKey(t.created_at) : '',
      t.id,
    ]),
  ]
}

// ---------------------------------------------------------------- IMPORT

const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')

function pad(n) {
  return String(n).padStart(2, '0')
}

// Accepts Date objects, Excel serials, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
export function parseDate(v) {
  if (v === null || v === undefined || v === '') return { value: null }
  if (v instanceof Date && !isNaN(v)) {
    return { value: `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}` }
  }
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400000))
    return { value: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` }
  }
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return valid(m[1], m[2], m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return valid(m[3], m[2], m[1])
  return { error: `"${s}" is not a valid date` }
}
function valid(y, mo, d) {
  const dt = new Date(Date.UTC(+y, +mo - 1, +d))
  if (dt.getUTCMonth() !== +mo - 1) return { error: `${y}-${mo}-${d} is not a valid date` }
  return { value: `${y}-${pad(mo)}-${pad(d)}` }
}

function parseMonth(v) {
  if (!v) return { value: null }
  if (v instanceof Date) return { value: `${v.getFullYear()}-${pad(v.getMonth() + 1)}` }
  const s = String(v).trim()
  let m = s.match(/^(\d{4})-(\d{1,2})/)
  if (m && +m[2] >= 1 && +m[2] <= 12) return { value: `${m[1]}-${pad(m[2])}` }
  m = s.match(/^(\d{1,2})[/-](\d{4})$/)
  if (m && +m[1] >= 1 && +m[1] <= 12) return { value: `${m[2]}-${pad(m[1])}` }
  const d = new Date(`1 ${s}`)
  if (!isNaN(d)) return { value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` }
  return { error: `Month Folder "${s}" should look like 2026-11` }
}

function matchOption(list, v, fallback) {
  if (v === null || v === undefined || String(v).trim() === '') return { value: fallback }
  const n = norm(v)
  const hit =
    list.find((x) => norm(x.value) === n || norm(x.label) === n) ||
    (n === 'completed' || n === 'complete' ? list.find((x) => x.value === 'done') : null) ||
    (n === 'review' || n === 'in review' ? list.find((x) => x.value === 'review') : null)
  return hit ? { value: hit.value } : { error: `"${v}" is not a valid option` }
}

export async function readSpreadsheet(file) {
  const X = await XLSX()
  const buf = await file.arrayBuffer()
  const wb = X.read(buf, { cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return X.utils.sheet_to_json(ws, { defval: '', raw: true })
}

// Turn raw sheet rows into validated task rows
export function validateRows(rawRows, { people, projects }) {
  const byEmail = Object.fromEntries(people.map((p) => [String(p.email).toLowerCase(), p]))
  const byProject = Object.fromEntries(projects.map((p) => [norm(p.name), p]))

  return rawRows
    .map((raw, i) => {
      const get = (col) => {
        const key = Object.keys(raw).find((k) => norm(k) === norm(col))
        return key ? raw[key] : ''
      }
      const errors = []
      const warnings = []
      const space = String(get('Space') ?? '').trim()
      const title = String(get('Title') ?? '').trim()
      if (!space && !title) return null // blank line
      if (!space) errors.push('Space is required')
      if (!title) errors.push('Title is required')

      const status = matchOption(STATUSES, get('Status'), 'todo')
      if (status.error) errors.push(`Status: ${status.error}`)
      const priority = matchOption(PRIORITIES, get('Priority'), 'medium')
      if (priority.error) errors.push(`Priority: ${priority.error}`)

      const aEmail = String(get('Assignee Email') ?? '').trim().toLowerCase()
      const rEmail = String(get('Reviewer Email') ?? '').trim().toLowerCase()
      const assignee = aEmail ? byEmail[aEmail] : null
      const reviewer = rEmail ? byEmail[rEmail] : null
      if (aEmail && !assignee) warnings.push(`Assignee ${aEmail} has not signed up — left unassigned`)
      if (rEmail && !reviewer) warnings.push(`Reviewer ${rEmail} has not signed up — left empty`)

      const start = parseDate(get('Start Date'))
      const due = parseDate(get('Due Date'))
      if (start.error) errors.push(`Start Date: ${start.error}`)
      if (due.error) errors.push(`Due Date: ${due.error}`)
      if (start.value && due.value && due.value < start.value) errors.push('Due Date is before Start Date')
      const month = parseMonth(get('Month Folder'))
      if (month.error) errors.push(month.error)

      const project = byProject[norm(space)]
      if (space && !project) warnings.push(`New space "${space}" will be created`)

      return {
        line: i + 2,
        space,
        project,
        month: month.value,
        task: {
          title,
          description: String(get('Description') ?? '').trim() || null,
          status: status.value,
          priority: priority.value,
          content_type: String(get('Content Type') ?? '').trim() || null,
          assignee_id: assignee?.id ?? null,
          reviewer_id: reviewer?.id ?? null,
          start_date: start.value ?? null,
          due_date: due.value ?? null,
        },
        assigneeName: assignee ? personName(assignee) : '',
        errors,
        warnings,
      }
    })
    .filter(Boolean)
}

export async function importRows(supabase, rows, { userId, canCreateSpaces, onProgress }) {
  const good = rows.filter((r) => r.errors.length === 0)
  const projectIds = {}
  const created = { spaces: 0, folders: 0, tasks: 0 }

  // 1. Spaces
  for (const r of good) {
    const key = norm(r.space)
    if (projectIds[key]) continue
    if (r.project) {
      projectIds[key] = r.project.id
      continue
    }
    if (!canCreateSpaces) throw new Error(`Space "${r.space}" does not exist. Ask a manager to create it first.`)
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: r.space, color: PROJECT_COLORS[created.spaces % PROJECT_COLORS.length], created_by: userId })
      .select('id')
      .single()
    if (error) throw new Error(`Could not create space "${r.space}": ${error.message}`)
    projectIds[key] = data.id
    created.spaces++
  }

  // 2. Month folders
  const folderIds = {}
  const needed = [...new Set(good.filter((r) => r.month).map((r) => `${projectIds[norm(r.space)]}|${r.month}`))]
  if (needed.length) {
    const { data: existing } = await supabase
      .from('folders')
      .select('id, project_id, month')
      .in('project_id', [...new Set(needed.map((k) => k.split('|')[0]))])
    ;(existing ?? []).forEach((f) => (folderIds[`${f.project_id}|${f.month.slice(0, 7)}`] = f.id))
    for (const k of needed) {
      if (folderIds[k]) continue
      const [pid, ym] = k.split('|')
      const [y, m] = ym.split('-').map(Number)
      const name = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
      const { data, error } = await supabase
        .from('folders')
        .insert({ project_id: pid, month: `${ym}-01`, name, created_by: userId })
        .select('id')
        .single()
      if (error) throw new Error(`Could not create folder ${ym}: ${error.message}`)
      folderIds[k] = data.id
      created.folders++
    }
  }

  // 3. Tasks, in batches
  const payload = good.map((r) => {
    const pid = projectIds[norm(r.space)]
    return {
      ...r.task,
      project_id: pid,
      folder_id: r.month ? folderIds[`${pid}|${r.month}`] ?? null : null,
      created_by: userId,
    }
  })
  for (let i = 0; i < payload.length; i += 200) {
    const batch = payload.slice(i, i + 200)
    const { error } = await supabase.from('tasks').insert(batch)
    if (error) throw new Error(`Imported ${created.tasks} tasks, then stopped: ${error.message}`)
    created.tasks += batch.length
    onProgress?.(created.tasks, payload.length)
  }
  return created
}
