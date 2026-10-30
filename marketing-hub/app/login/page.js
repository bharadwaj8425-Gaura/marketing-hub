'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('signup')) setMode('signup')
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setInfoMsg('')
    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setErrorMsg(
          error.message.includes('Email not confirmed')
            ? 'Your email is not confirmed yet. Ask your admin to confirm it, or check your inbox.'
            : error.message.includes('Invalid login')
              ? 'Wrong email or password.'
              : error.message
        )
        setLoading(false)
      } else {
        window.location.href = '/'
      }
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin + '/login' },
    })
    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else if (!data.session) {
      setInfoMsg('Account created. Please confirm your email, then log in.')
      setMode('login')
      setLoading(false)
    } else {
      window.location.href = '/'
    }
  }

  async function forgot() {
    setErrorMsg('')
    setInfoMsg('')
    if (!email.trim()) return setErrorMsg('Type your email above first, then press "Forgot password".')
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/login',
    })
    if (error) setErrorMsg(error.message)
    else setInfoMsg('Password reset link sent. Check your inbox.')
  }

  return (
    <div className="auth">
      <section className="auth-side">
        <img src="/finstreet-mark.png" alt="" className="auth-mark" />
        <h2>FinStreet Marketing Hub</h2>
        <p>One place for the marketing team: spaces and monthly folders, approvals, campaigns, the video library, team chat and time tracking.</p>
        <ul>
          <li>Board and list views for every space</li>
          <li>Review, approve or request changes</li>
          <li>Start / stop timer on any task</li>
          <li>Videos, files and Drive links in one place</li>
        </ul>
        <small>FinStreet Education · Internal tool</small>
      </section>

      <section className="auth-main">
        <form className="auth-card" onSubmit={handleSubmit}>
          <img src="/finstreet-logo.png" alt="FinStreet" className="auth-logo" />
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="sub">{mode === 'login' ? 'Log in to the marketing workspace' : 'Use your name and work email'}</p>

          {mode === 'signup' && (
            <label>
              Full name
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </label>
          )}
          <label>
            Work email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@finstreeteducation.com" />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>

          {errorMsg && <p className="msg err">{errorMsg}</p>}
          {infoMsg && <p className="msg ok">{infoMsg}</p>}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>

          {mode === 'login' && (
            <button type="button" className="link" onClick={forgot}>
              Forgot password?
            </button>
          )}

          <p className="switch">
            {mode === 'login' ? 'New to the team?' : 'Already have an account?'}{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setErrorMsg('')
                setInfoMsg('')
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Log in'}
            </button>
          </p>
        </form>
      </section>
    </div>
  )
}
