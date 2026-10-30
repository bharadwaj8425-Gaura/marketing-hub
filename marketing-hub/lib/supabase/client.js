import { createBrowserClient } from '@supabase/ssr'

// Browser (client components) ke liye Supabase connection
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
}
