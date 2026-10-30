'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SPACES, PROJECT_COLORS } from '@/lib/constants'

// Ek click mein FinStreet ke 7 default spaces bana deta hai (jo pehle se hain unhe chhod deta hai)
export default function SeedSpacesButton({ userId, existingNames }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const have = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  const missing = DEFAULT_SPACES.filter((n) => !have.has(n.toLowerCase()))
  if (missing.length === 0) return null

  async function seed() {
    setBusy(true)
    setError('')
    const supabase = createClient()
    const rows = missing.map((name, i) => ({
      name,
      color: PROJECT_COLORS[(existingNames.length + i) % PROJECT_COLORS.length],
      created_by: userId,
    }))
    const { error } = await supabase.from('projects').insert(rows)
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={seed}
        disabled={busy}
        className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
      >
        {busy ? 'Adding...' : `Add FinStreet default spaces (${missing.length})`}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
