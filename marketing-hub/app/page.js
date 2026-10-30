import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Hub from '@/components/hub/Hub'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [meRes, peopleRes, docsRes, msgRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role').eq('id', user.id).maybeSingle(),
    supabase.from('profiles').select('id, full_name, email, role'),
    supabase.from('hub_docs').select('kind, id, doc').neq('kind', 'msg').limit(20000),
    supabase.from('hub_docs').select('kind, id, doc').eq('kind', 'msg').order('created_at', { ascending: false }).limit(800),
  ])

  if (docsRes.error) {
    return (
      <div style={{ fontFamily: 'IBM Plex Sans, system-ui, sans-serif', maxWidth: 560, margin: '80px auto', padding: 24, lineHeight: 1.6 }}>
        <h2 style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>One setup step left</h2>
        <p>
          Open Supabase, go to <b>SQL Editor</b>, paste the contents of <b>schema_v5.sql</b> and press <b>Run</b>. Then
          refresh this page.
        </p>
        <p style={{ color: '#586964', fontSize: 13 }}>Details: {docsRes.error.message}</p>
      </div>
    )
  }

  const profiles = peopleRes.data ?? []
  if (!profiles.some((p) => p.id === user.id)) {
    profiles.push({ id: user.id, full_name: user.user_metadata?.full_name || '', email: user.email, role: 'member' })
  }
  const me = meRes.data ?? profiles.find((p) => p.id === user.id)

  return (
    <Hub
      meId={user.id}
      meName={me?.full_name || user.email}
      meRole={me?.role || 'member'}
      data={{ profiles, docs: [...(docsRes.data ?? []), ...(msgRes.data ?? [])] }}
      maxMb={Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50}
    />
  )
}
