import { createClient } from '@/lib/supabase/server'
import { isManagerRole } from '@/lib/constants'
import DataTools from '@/components/DataTools'

export default async function DataPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [meRes, peopleRes, projectsRes] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase.from('profiles').select('id, full_name, email'),
    supabase.from('projects').select('id, name').eq('archived', false),
  ])

  return (
    <DataTools
      userId={user.id}
      canManage={isManagerRole(meRes.data?.role)}
      people={peopleRes.data ?? []}
      projects={projectsRes.data ?? []}
    />
  )
}
