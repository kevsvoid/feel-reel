'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { Eye, EyeOff, Film } from 'lucide-react'
import Link from 'next/link'

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials'))  return 'Wrong email or password. Please try again.'
  if (msg.includes('Email not confirmed'))        return 'Please check your inbox and confirm your email first.'
  if (msg.includes('Too many requests'))          return 'Too many attempts — wait a moment and try again.'
  if (msg.includes('User not found'))             return 'No account found with that email.'
  return msg
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Both fields are required.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      router.replace('/dashboard')
    } catch (err: unknown) {
      setError(mapError(err instanceof Error ? err.message : 'Something went wrong.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">

      {/* Film strip sides */}
      <FilmStrips />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,83,0.05) 0%, transparent 70%)'
      }} />

      <div className="w-full max-w-sm px-6 fade-up">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.2)' }}>
            <Film size={26} style={{ color: 'var(--amber)' }} />
          </div>
          <h1 className="font-display text-5xl font-black tracking-tight amber-glow" style={{ color: 'var(--amber)' }}>
            FeelReel
          </h1>
          <p className="text-xs mt-2 tracking-widest uppercase font-mono" style={{ color: 'var(--silver-ghost)' }}>
            watch what you feel
          </p>
        </div>

        {/* Auth toggle tabs */}
        <div className="flex p-1 rounded-xl mb-8" style={{ background: 'var(--frame)' }}>
          <div className="flex-1 py-2 rounded-lg text-center text-xs font-mono uppercase tracking-widest"
            style={{ background: 'var(--amber)', color: 'var(--void)', fontWeight: 600 }}>
            Sign In
          </div>
          <Link href="/signup"
            className="flex-1 py-2 rounded-lg text-center text-xs font-mono uppercase tracking-widest transition-colors"
            style={{ color: 'var(--silver-ghost)' }}>
            Sign Up
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@cinema.com"
              autoComplete="email"
              className="cin-input w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest font-mono" style={{ color: 'var(--silver-ghost)' }}>
                Password
              </label>
              {/* Forgot password — wire to supabase.auth.resetPasswordForEmail later */}
              <button type="button" className="text-xs font-mono transition-colors hover:opacity-100"
                style={{ color: 'var(--amber)', opacity: 0.7 }}
                onClick={() => setError('Password reset coming soon — contact support for now.')}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="cin-input w-full px-4 py-3 pr-11 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                style={{ color: 'var(--silver-ghost)', opacity: 0.6 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)', color: '#e88' }}>
              <span className="mt-px flex-shrink-0">⚠</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cin-btn w-full py-3 rounded-lg flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
              : 'Enter the Screening Room'}
          </button>
        </form>

        {/* Sign up nudge */}
        <p className="text-center mt-6 text-xs" style={{ color: 'var(--silver-ghost)' }}>
          No account yet?{' '}
          <Link href="/signup" className="underline underline-offset-2 transition-colors hover:opacity-100"
            style={{ color: 'var(--amber)', opacity: 0.8 }}>
            Create one — it&apos;s free
          </Link>
        </p>
      </div>
    </div>
  )
}

function FilmStrips() {
  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-12 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 20px, #d4a853 20px, #d4a853 22px)',
        backgroundSize: '100% 44px',
      }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(180deg, transparent 0px, transparent 20px, #d4a853 20px, #d4a853 22px)',
        backgroundSize: '100% 44px',
      }} />
    </>
  )
}
