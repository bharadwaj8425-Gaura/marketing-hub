import { createClient } from '@/lib/supabase/server'
import { isManagerRole } from '@/lib/constants'
import VideoLibrary from '@/components/VideoLibrary'

export default async function VideosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [videosRes, projectsRes, meRes] = await Promise.all([
    supabase.from('videos').select('*').order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name, color').eq('archived', false).order('created_at'),
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
  ])

  return (
    <VideoLibrary
      initialVideos={videosRes.data ?? []}
      setupError={videosRes.error ? 'Run schema_v4.sql in Supabase to enable the video library.' : ''}
      projects={projectsRes.data ?? []}
      currentUser={{ id: user.id, role: meRes.data?.role ?? 'member' }}
      isManager={isManagerRole(meRes.data?.role)}
    />
  )
}
