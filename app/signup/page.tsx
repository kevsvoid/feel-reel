'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth'
import { Eye, EyeOff, Film, Mail } from 'lucide-react'
import Link from 'next/link'

function mapError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'An account with this email already exists. Try signing in.'
  if (msg.includes('Password should be at least'))
    return 'Password must be at least 6 characters.'
  if (msg.includes('Unable to validate email'))
    return 'Please enter a valid email address.'
  if (msg.includes('Too many requests'))
    return 'Too many attempts — wait a moment and try again.'
  return msg
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strength = checks.filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#e74c3c', '#d4a853', '#f0c060', '#27ae60']

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all"
            style={{ background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <p className="text-xs font-mono" style={{ color: colors[strength] }}>
        {labels[strength]}
        {strength < 3 && password && (
          <span style={{ color: 'var(--silver-ghost)' }}> — try adding numbers or symbols</span>
        )}
      </p>
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)   // email confirmation sent state

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!displayName.trim())        { setError('Please enter your name.'); return }
    if (!email.trim())              { setError('Please enter your email.'); return }
    if (!password)                  { setError('Please enter a password.'); return }
    if (password.length < 6)        { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)       { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      await signUp(email.trim(), password, displayName.trim())
      setDone(true)
    } catch (err: unknown) {
      setError(mapError(err instanceof Error ? err.message : 'Something went wrong.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Email sent confirmation screen ─────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
        <FilmStrips />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,83,0.05) 0%, transparent 70%)'
        }} />

        <div className="w-full max-w-sm px-6 text-center fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.25)' }}>
            <Mail size={28} style={{ color: 'var(--amber)' }} />
          </div>

          <h2 className="font-display text-3xl font-bold mb-3" style={{ color: 'var(--silver)' }}>
            Check your inbox
          </h2>
          <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--silver-dim)' }}>
            We&apos;ve sent a confirmation link to
          </p>
          <p className="font-mono text-sm mb-6 px-3 py-2 rounded-lg inline-block"
            style={{ background: 'rgba(212,168,83,0.08)', color: 'var(--amber)' }}>
            {email}
          </p>
          <p className="text-xs leading-relaxed mb-8" style={{ color: 'var(--silver-ghost)' }}>
            Click the link in the email to activate your account, then come back here to sign in.
          </p>

          <Link href="/login" className="cin-btn px-8 py-3 rounded-lg inline-block">
            Go to Sign In
          </Link>

          <p className="mt-6 text-xs" style={{ color: 'var(--silver-ghost)' }}>
            Didn&apos;t get it? Check your spam folder or{' '}
            <button
              onClick={() => setDone(false)}
              className="underline underline-offset-2"
              style={{ color: 'var(--amber)' }}>
              try again
            </button>
            .
          </p>
        </div>
      </div>
    )
  }

  // ── Sign up form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden py-12">
      <FilmStrips />
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
          <Link href="/login"
            className="flex-1 py-2 rounded-lg text-center text-xs font-mono uppercase tracking-widest transition-colors"
            style={{ color: 'var(--silver-ghost)' }}>
            Sign In
          </Link>
          <div className="flex-1 py-2 rounded-lg text-center text-xs font-mono uppercase tracking-widest"
            style={{ background: 'var(--amber)', color: 'var(--void)', fontWeight: 600 }}>
            Sign Up
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4">

          {/* Display name */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Kubrick, Sofia, Tarantino..."
              autoComplete="name"
              className="cin-input w-full px-4 py-3 rounded-lg text-sm"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="cin-input w-full px-4 py-3 pr-11 rounded-lg text-sm"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                style={{ color: 'var(--silver-ghost)', opacity: 0.6 }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--silver-ghost)' }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                className="cin-input w-full px-4 py-3 pr-11 rounded-lg text-sm"
                style={confirm && confirm !== password ? { borderColor: 'rgba(192,57,43,0.5)' } : {}}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                style={{ color: 'var(--silver-ghost)', opacity: 0.6 }}>
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p className="text-xs mt-1.5 font-mono" style={{ color: '#e88' }}>Passwords don&apos;t match</p>
            )}
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
            disabled={loading || (!!confirm && confirm !== password)}
            className="cin-btn w-full py-3 rounded-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin" />
              : 'Create My Account'}
          </button>
        </form>

        {/* Terms note */}
        <p className="text-center mt-6 text-xs leading-relaxed" style={{ color: 'var(--silver-ghost)' }}>
          By signing up you agree to use this app responsibly.<br />
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-2"
            style={{ color: 'var(--amber)', opacity: 0.8 }}>
            Sign in
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
