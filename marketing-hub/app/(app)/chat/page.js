import { createClient } from '@/lib/supabase/server'
import Chat from '@/components/Chat'

export default async function ChatPage({ searchParams }) {
  const { space } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [channelsRes, peopleRes, meRes] = await Promise.all([
    supabase.from('chat_channels').select('id, name, project_id, projects(name, color)'),
    supabase.from('profiles').select('id, full_name, email, role').order('full_name'),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])

  // General sabse upar, phir spaces naam ke hisaab se
  const channels = (channelsRes.data ?? []).sort((a, b) => {
    if (!a.project_id && b.project_id) return -1
    if (a.project_id && !b.project_id) return 1
    return (a.projects?.name || a.name).localeCompare(b.projects?.name || b.name)
  })

  if (channelsRes.error || channels.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Chat is not set up yet. Please run <b>schema_v2.sql</b> in the Supabase SQL Editor
        {channelsRes.error ? ` (${channelsRes.error.message})` : ''}.
      </div>
    )
  }

  const initial = channels.find((c) => c.project_id === space)?.id

  return (
    <Chat
      channels={channels}
      people={peopleRes.data ?? []}
      currentUser={{ id: user.id, role: meRes.data?.role ?? 'member' }}
      initialChannelId={initial}
    />
  )
}
