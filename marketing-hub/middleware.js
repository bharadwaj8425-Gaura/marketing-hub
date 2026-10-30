import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Refreshes the login session on every request and keeps people on the right page.
export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isLogin = path.startsWith('/login')

  function redirectTo(pathname) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    url.search = ''
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c))
    return redirect
  }

  if (!user && !isLogin) return redirectTo('/login')
  if (user && isLogin) return redirectTo('/')
  // old pages from earlier versions now live inside the single app
  if (user && path !== '/') return redirectTo('/')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
