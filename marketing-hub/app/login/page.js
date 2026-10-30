'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' ya 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setErrorMsg(error.message)
      } else if (!data.session) {
        setInfoMsg('Account created. Please confirm your email, then log in.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  const inputCls =
    'w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500'

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/30">
              FS
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight">FinStreet</p>
              <p className="text-xs font-medium text-slate-400">Marketing Hub</p>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to your workspace' : 'Join the FinStreet marketing workspace'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputCls}
                  placeholder="Your full name"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="you@finstreeteducation.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                placeholder="At least 6 characters"
              />
            </div>

            {errorMsg && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-100">{errorMsg}</p>
            )}
            {infoMsg && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">
                {infoMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setErrorMsg('')
                setInfoMsg('')
              }}
              className="font-semibold text-indigo-600 hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      {/* Showcase side (desktop) */}
      <div className="relative hidden overflow-hidden border-l border-slate-200/70 bg-gradient-to-br from-indigo-50 via-white to-pink-50 lg:flex lg:items-center lg:justify-center">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -bottom-10 right-0 h-72 w-72 rounded-full bg-pink-300/25 blur-3xl" />
        <div className="relative w-full max-w-md space-y-4 px-8">
          <div className="rounded-2xl border border-white bg-white/80 p-5 shadow-xl shadow-indigo-500/10 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">This week</p>
            <p className="mt-1 text-lg font-bold">YouTube launch plan</p>
            <div className="mt-4 space-y-2.5">
              {[
                ['Script draft', 'bg-emerald-100 text-emerald-700', 'Approved'],
                ['Thumbnail design', 'bg-amber-100 text-amber-700', 'In review'],
                ['Shorts cut-downs', 'bg-sky-100 text-sky-700', 'In progress'],
              ].map(([t, c, s]) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                  <span className="font-medium">{t}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-10 rounded-2xl border border-white bg-white/80 p-4 shadow-xl shadow-pink-500/10 backdrop-blur">
            <p className="text-xs font-semibold text-slate-400"># social-media</p>
            <div className="mt-2 flex items-start gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">
                TM
              </span>
              <p className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-sm">Final reel is ready for review 🚀</p>
            </div>
          </div>
          <p className="pt-4 text-center text-sm text-slate-500">
            Tasks · Approvals · Team chat · Time tracking — all in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
